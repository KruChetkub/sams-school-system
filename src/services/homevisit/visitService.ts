import { supabase } from '../../lib/supabase';

// Types
export interface HomeVisit {
  id: string;
  student_id: string;
  teacher_id: string;
  academic_year_id?: string | null;
  semester_id?: string | null;
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

export const getHomeVisitsByTeacher = async (
  teacherId: string,
  role?: string | null,
  academicYearId?: string,
  semesterId?: string
) => {
  let query = supabase
    .from('home_visits')
    .select(`
      *,
      student:students!inner(id, student_code, prefix, first_name, last_name, nickname, deleted_at, classroom_id),
      home_visit_assessments(risk_level)
    `);

  // Filter out soft-deleted students
  query = query.is('student.deleted_at', null);

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    // ดึง classrooms ของครูเพื่อดึงประวัติเยี่ยมบ้านของห้องที่ครูเป็นที่ปรึกษา (ทั้งคนที่ 1 และคนที่ 2)
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', teacherId)
      .maybeSingle();

    if (teacherProfile) {
      const { data: advisorClassrooms } = await supabase
        .from('classrooms')
        .select('id')
        .or(`advisor_id.eq.${teacherProfile.id},advisor2_id.eq.${teacherProfile.id}`);
      
      const classroomIds = (advisorClassrooms || []).map(c => c.id);
      if (classroomIds.length > 0) {
        query = query.in('student.classroom_id', classroomIds);
      } else {
        query = query.eq('teacher_id', teacherId);
      }
    } else {
      query = query.eq('teacher_id', teacherId);
    }
  }

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  if (semesterId) {
    query = query.eq('semester_id', semesterId);
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
  academicYearId?: string,
  semesterId?: string
) => {
  let query = supabase
    .from('home_visits')
    .select(`*`)
    .eq('student_id', studentId);
    
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    // ตรวจสอบว่าครูคนนี้เป็นครูประจำชั้นคนที่ 1 หรือ 2 ของเด็กคนนี้หรือไม่
    const { data: teacherProfile } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', teacherId)
      .maybeSingle();

    if (teacherProfile) {
      const { data: student } = await supabase
        .from('students')
        .select(`
          classroom:classroom_id (id, advisor_id, advisor2_id)
        `)
        .eq('id', studentId)
        .maybeSingle();

      const classroom = student?.classroom as any;
      const isAdvisor = classroom && (classroom.advisor_id === teacherProfile.id || classroom.advisor2_id === teacherProfile.id);

      if (!isAdvisor) {
        query = query.eq('teacher_id', teacherId);
      }
    } else {
      query = query.eq('teacher_id', teacherId);
    }
  }

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  if (semesterId) {
    query = query.eq('semester_id', semesterId);
  }

  const { data: visit, error: visitError } = await query
    .order('visit_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (visitError) throw visitError;
  if (!visit) return null;

  return getHomeVisitById(visit.id);
};

/**
 * คัดลอกข้อมูลการเยี่ยมบ้านทั้งหมด (ข้อมูลหลัก + แบบประเมิน form_data + รูปถ่าย/ลายเซ็น)
 * จากภาคเรียนต้นทาง (เช่น ภาคเรียนที่ 1) มายังภาคเรียนปลายทาง (เช่น ภาคเรียนที่ 2)
 */
export const cloneHomeVisitsFromSemester = async (params: {
  sourceSemesterId: string;
  targetSemesterId: string;
  academicYearId?: string;
  studentId?: string;
  classroomId?: string;
  overwriteExisting?: boolean;
}): Promise<number> => {
  const { sourceSemesterId, targetSemesterId, academicYearId, studentId, classroomId, overwriteExisting } = params;
  if (!sourceSemesterId || !targetSemesterId || sourceSemesterId === targetSemesterId) {
    return 0;
  }

  const shouldOverwrite = overwriteExisting ?? Boolean(studentId);

  // 1. กรณีดึงรายคน: เรียก RPC clone_single_student_home_visit ก่อน
  if (studentId) {
    try {
      const { data: newVisitId, error: singleErr } = await supabase.rpc('clone_single_student_home_visit', {
        p_student_id: studentId,
        p_source_semester_id: sourceSemesterId,
        p_target_semester_id: targetSemesterId,
        p_academic_year_id: academicYearId || null,
        p_overwrite: shouldOverwrite,
      });
      if (!singleErr && newVisitId) {
        return 1;
      }
    } catch {
      // Fallback ด้านล่าง
    }
  } else {
    // กรณีดึงทั้งห้อง/หลายคน: เรียก RPC clone_home_visits_to_semester
    try {
      const { data: rpcCount, error: rpcError } = await supabase.rpc('clone_home_visits_to_semester', {
        p_source_semester_id: sourceSemesterId,
        p_target_semester_id: targetSemesterId,
        p_academic_year_id: academicYearId || null,
        p_student_id: null,
        p_classroom_id: classroomId || null,
      });
      if (!rpcError && typeof rpcCount === 'number') {
        return rpcCount;
      }
    } catch {
      // Fallback ด้านล่าง
    }
  }

  // 2. Fallback: ดึงข้อมูลจากภาคเรียนต้นทาง แล้วสร้างเรคคอร์ดใหม่ในภาคเรียนปลายทาง (แยก ID ใหม่ ไม่ทับเรคคอร์ดของภาคเรียนที่ 1)
  let srcQuery = supabase
    .from('home_visits')
    .select('*, student:students!inner(id, classroom_id, deleted_at)')
    .is('student.deleted_at', null)
    .or(`semester_id.eq.${sourceSemesterId},semester_id.is.null`);

  if (academicYearId) srcQuery = srcQuery.eq('academic_year_id', academicYearId);
  if (studentId) srcQuery = srcQuery.eq('student_id', studentId);
  if (classroomId) srcQuery = srcQuery.eq('student.classroom_id', classroomId);

  const { data: srcVisits, error: srcErr } = await srcQuery.order('visit_date', { ascending: false });
  if (srcErr) throw srcErr;
  if (!srcVisits || srcVisits.length === 0) return 0;

  const uniqueByStudent = new Map<string, any>();
  for (const v of srcVisits) {
    if (v.semester_id === targetSemesterId) continue;
    if (!uniqueByStudent.has(v.student_id)) {
      uniqueByStudent.set(v.student_id, v);
    }
  }

  let clonedCount = 0;
  for (const [stId, srcVisit] of uniqueByStudent.entries()) {
    const { data: existingTarget } = await supabase
      .from('home_visits')
      .select('id')
      .eq('student_id', stId)
      .eq('semester_id', targetSemesterId)
      .limit(1)
      .maybeSingle();

    let targetVisitId: string | null = null;

    if (existingTarget) {
      if (!shouldOverwrite) continue;
      targetVisitId = existingTarget.id;
      await supabase
        .from('home_visits')
        .update({
          teacher_id: srcVisit.teacher_id,
          visit_date: srcVisit.visit_date,
          status: srcVisit.status,
          latitude: srcVisit.latitude,
          longitude: srcVisit.longitude,
          distance_to_school: srcVisit.distance_to_school,
          address_details: srcVisit.address_details,
          academic_year_id: academicYearId || srcVisit.academic_year_id,
        })
        .eq('id', targetVisitId);

      await supabase.from('home_visit_assessments').delete().eq('visit_id', targetVisitId);
      await supabase.from('home_visit_photos').delete().eq('visit_id', targetVisitId);
    } else {
      // สร้างเรคคอร์ดใหม่ในฐานข้อมูลสำหรับภาคเรียนปลายทาง (ไม่ไปซ้ำซ้อนหรือทับเรคคอร์ดภาคเรียนที่ 1)
      const { data: newVisit, error: insertErr } = await supabase
        .from('home_visits')
        .insert([
          {
            student_id: srcVisit.student_id,
            teacher_id: srcVisit.teacher_id,
            visit_date: srcVisit.visit_date,
            status: srcVisit.status,
            latitude: srcVisit.latitude,
            longitude: srcVisit.longitude,
            distance_to_school: srcVisit.distance_to_school,
            address_details: srcVisit.address_details,
            academic_year_id: academicYearId || srcVisit.academic_year_id,
            semester_id: targetSemesterId,
          },
        ])
        .select()
        .single();

      if (insertErr || !newVisit) continue;
      targetVisitId = newVisit.id;
    }

    // คัดลอก home_visit_assessments ไปผูกกับ targetVisitId
    const { data: srcAssessment } = await supabase
      .from('home_visit_assessments')
      .select('*')
      .eq('visit_id', srcVisit.id)
      .maybeSingle();

    if (srcAssessment && targetVisitId) {
      await supabase.from('home_visit_assessments').insert([
        {
          visit_id: targetVisitId,
          living_condition: srcAssessment.living_condition,
          family_status: srcAssessment.family_status,
          economic_status: srcAssessment.economic_status,
          risk_level: srcAssessment.risk_level,
          notes: srcAssessment.notes,
          form_data: srcAssessment.form_data,
        },
      ]);
    }

    // คัดลอก home_visit_photos ไปผูกกับ targetVisitId
    const { data: srcPhotos } = await supabase
      .from('home_visit_photos')
      .select('*')
      .eq('visit_id', srcVisit.id);

    if (srcPhotos && srcPhotos.length > 0 && targetVisitId) {
      await supabase.from('home_visit_photos').insert(
        srcPhotos.map((p: any) => ({
          visit_id: targetVisitId,
          photo_url: p.photo_url,
          description: p.description,
        }))
      );
    }

    clonedCount++;
  }

  return clonedCount;
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
