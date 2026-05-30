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

export const getHomeVisitsByTeacher = async (teacherId: string, role?: string | null) => {
  let query = supabase
    .from('home_visits')
    .select(`
      *,
      student:students(id, student_code, prefix, first_name, last_name, nickname),
      home_visit_assessments(risk_level)
    `)
    .order('visit_date', { ascending: false });

  if (role !== 'ADMIN') {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;
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

export const getHomeVisitByStudentAndTeacher = async (studentId: string, teacherId: string, role?: string | null) => {
  let query = supabase
    .from('home_visits')
    .select(`*`)
    .eq('student_id', studentId);
    
  if (role !== 'ADMIN') {
    query = query.eq('teacher_id', teacherId);
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

export const uploadVisitPhoto = async (visitId: string, studentCode: string, originalFile: File, description?: string) => {
  // 1. บีบอัดรูปภาพก่อนอัปโหลด
  const file = await compressImage(originalFile, 1080, 0.8);

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
