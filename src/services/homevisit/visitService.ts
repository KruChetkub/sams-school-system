import { supabase } from '../../lib/supabase';

// Types
export interface HomeVisit {
  id: string;
  student_id: string;
  teacher_id: string;
  visit_date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  latitude?: number;
  longitude?: number;
  distance_to_school?: number;
  address_details?: string;
  created_at: string;
  updated_at: string;
  student?: any; // Will hold joined student info
}

export interface HomeVisitAssessment {
  id: string;
  visit_id: string;
  living_condition?: string;
  family_status?: string;
  economic_status?: string;
  risk_level: 'NORMAL' | 'WATCH' | 'URGENT';
  notes?: string;
  form_data?: any;
}

export interface HomeVisitPhoto {
  id: string;
  visit_id: string;
  photo_url: string;
  description?: string;
  created_at: string;
}

/**
 * Helper: ย่อขนาดรูปภาพก่อนอัปโหลดเพื่อประหยัดพื้นที่ Supabase
 * - ลดขนาดให้ด้านกว้างสุดไม่เกิน 1080px
 * - บีบอัดเป็น JPEG ด้วยคุณภาพ 80% (0.8) ซึ่งไฟล์จะอยู่ประมาณ 100KB - 500KB
 */
const compressImage = (file: File, maxWidth = 1080, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // ถ้าไม่ใช่รูปภาพ ให้คืนค่าไฟล์เดิมกลับไป
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // คำนวณอัตราส่วนใหม่ถ้ากว้างกว่าที่กำหนด
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback ถ้าเบราว์เซอร์ไม่รองรับ
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // แปลงกลับเป็น File (บังคับเป็น JPEG)
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // เปลี่ยนนามสกุลไฟล์เป็น .jpg
          const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
          const compressedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file); // fallback ถ้าโหลดภาพไม่สำเร็จ
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Helper: ย่อขนาดรูปภาพนักเรียนเป็นขนาดสูงสุดไม่เกิน 102 x 126 px
 * และทำการ Crop ส่วนตรงกลาง (Center Crop) เพื่อคงสัดส่วนที่สวยงาม
 */
export const resizeStudentPhoto = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const targetWidth = 102;
        const targetHeight = 126;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgRatio > targetRatio) {
          // กว้างกว่าสัดส่วนเป้าหมาย
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          // สูงกว่าสัดส่วนเป้าหมาย
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const newName = file.name.replace(/\.[^/.]+$/, ".jpg");
          const compressedFile = new File([blob], newName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const getHomeVisitsByTeacher = async (teacherId: string, role?: string | null, academicYearId?: string) => {
  let query = supabase
    .from('home_visits')
    .select(`
      *,
      student:students!inner(id, student_code, prefix, first_name, last_name, nickname, deleted_at),
      home_visit_assessments(risk_level)
    `);

  // Filter out soft-deleted students
  query = query.is('student.deleted_at', null);

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    query = query.eq('teacher_id', teacherId);
  }

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  query = query.order('visit_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data as HomeVisit[];
};

export const getHomeVisitById = async (visitId: string) => {
  const { data: visit, error: visitError } = await supabase
    .from('home_visits')
    .select(`
      *,
      student:students(*)
    `)
    .eq('id', visitId)
    .single();

  if (visitError) throw visitError;

  const { data: assessments, error: assessmentError } = await supabase
    .from('home_visit_assessments')
    .select('*')
    .eq('visit_id', visitId)
    .maybeSingle();

  if (assessmentError) throw assessmentError;

  const { data: photos, error: photoError } = await supabase
    .from('home_visit_photos')
    .select('*')
    .eq('visit_id', visitId);

  if (photoError) throw photoError;

  return { visit, assessment: assessments, photos };
};

export const getHomeVisitByStudentAndTeacher = async (
  studentId: string,
  teacherId: string,
  role?: string | null,
  academicYearId?: string
) => {
  let query = supabase
    .from('home_visits')
    .select(`*`)
    .eq('student_id', studentId);
    
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    query = query.eq('teacher_id', teacherId);
  }

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data: visit, error: visitError } = await query
    .order('visit_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (visitError) throw visitError;
  if (!visit) return null;

  return getHomeVisitById(visit.id);
};

export const createHomeVisit = async (visitData: Partial<HomeVisit>) => {
  const { data, error } = await supabase
    .from('home_visits')
    .insert([visitData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateHomeVisit = async (id: string, visitData: Partial<HomeVisit>) => {
  const { data, error } = await supabase
    .from('home_visits')
    .update(visitData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveHomeVisitAssessment = async (assessmentData: Partial<HomeVisitAssessment>) => {
  if (assessmentData.id) {
    const { data, error } = await supabase
      .from('home_visit_assessments')
      .update(assessmentData)
      .eq('id', assessmentData.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // แยก id ออกไป เพื่อป้องกันปัญหา null value in column "id" violates not-null constraint
    const { id, ...dataToInsert } = assessmentData;
    
    const { data, error } = await supabase
      .from('home_visit_assessments')
      .insert([dataToInsert])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteVisitPhoto = async (visitId: string, description: string) => {
  // 1. Find the existing photo record to get the URL and delete the file from Storage
  const { data: photos, error: selectError } = await supabase
    .from('home_visit_photos')
    .select('photo_url')
    .eq('visit_id', visitId)
    .eq('description', description);

  if (selectError) throw selectError;

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const urlParts = photo.photo_url.split('/home_visit_photos/');
        if (urlParts.length > 1) {
          const filePath = decodeURIComponent(urlParts[1]);
          await supabase.storage.from('home_visit_photos').remove([filePath]);
        }
      } catch (storageErr) {
        console.error('Failed to remove file from storage:', storageErr);
      }
    }
  }

  // 2. Delete from DB
  const { error: dbError } = await supabase
    .from('home_visit_photos')
    .delete()
    .eq('visit_id', visitId)
    .eq('description', description);

  if (dbError) throw dbError;
};

export const uploadVisitPhoto = async (visitId: string, studentCode: string, originalFile: File, description?: string) => {
  // Clear any existing photo with the same description first to avoid duplicates
  if (description) {
    try {
      await deleteVisitPhoto(visitId, description);
    } catch (err) {
      console.warn('Failed to delete old photo:', err);
    }
  }

  // 1. บีบอัดรูปภาพก่อนอัปโหลด (ถ้ารูปถ่ายนักเรียนให้ย่อไม่เกิน 102 x 126 px)
  let file;
  if (description === 'รูปถ่ายนักเรียน') {
    file = await resizeStudentPhoto(originalFile);
  } else {
    file = await compressImage(originalFile, 1080, 0.8);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `homevisit_${studentCode}_${Date.now()}.${fileExt}`;
  const filePath = `${studentCode}/${fileName}`;

  // Upload to Storage
  const { error: uploadError } = await supabase.storage
    .from('home_visit_photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('home_visit_photos')
    .getPublicUrl(filePath);

  // Insert to DB
  const { data, error: dbError } = await supabase
    .from('home_visit_photos')
    .insert([
      {
        visit_id: visitId,
        photo_url: publicUrl,
        description: description || ''
      }
    ])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};
