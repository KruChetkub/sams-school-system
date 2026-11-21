import { supabase } from '../lib/supabase';
import { compareStudentsByRosterOrder } from './studentService';
import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentDTO,
  UpdateAssignmentDTO,
  UpdateSubmissionDTO,
  BatchSubmissionUpdateItem,
  AssignmentFilter,
  AssignmentSummaryStats,
  TeacherCourseClassroom,
  SubmissionStatus
} from '../types/assignment';

/**
 * 1. ดึงรายการงาน/การบ้านตามเงื่อนไขตัวกรอง (ปีการศึกษา, ภาคเรียน, วิชา, ห้องเรียน, ครูผู้สอน)
 */
export const getAssignments = async (filter: AssignmentFilter = {}): Promise<Assignment[]> => {
  let query = supabase
    .from('assignments')
    .select(`
      *,
      subject:subject_id (id, subject_code, subject_name),
      classroom:classroom_id (id, level, room),
      teacher:teacher_id (id, first_name, last_name)
    `)
    .order('created_at', { ascending: true });

  if (filter.academicYearId) {
    query = query.eq('academic_year_id', filter.academicYearId);
  }
  if (filter.semesterId) {
    query = query.eq('semester_id', filter.semesterId);
  }
  if (filter.subjectId) {
    query = query.eq('subject_id', filter.subjectId);
  }
  if (filter.classroomId) {
    query = query.eq('classroom_id', filter.classroomId);
  }
  if (filter.teacherId) {
    query = query.eq('teacher_id', filter.teacherId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }

  const assignments = (data || []) as Assignment[];

  // คำนวณสรุปจำนวนการส่งงาน (Submissions Summary) สำหรับแต่ละชิ้นงาน
  if (assignments.length > 0) {
    const assignmentIds = assignments.map(a => a.id);
    const { data: subData, error: subError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status')
      .in('assignment_id', assignmentIds);

    if (!subError && subData) {
      const summaryMap: Record<string, { total: number; submitted: number; graded: number; pending: number; late: number }> = {};
      
      for (const item of subData) {
        if (!summaryMap[item.assignment_id]) {
          summaryMap[item.assignment_id] = { total: 0, submitted: 0, graded: 0, pending: 0, late: 0 };
        }
        const s = summaryMap[item.assignment_id];
        s.total += 1;
        if (item.status === 'submitted') s.submitted += 1;
        else if (item.status === 'graded') s.graded += 1;
        else if (item.status === 'late') s.late += 1;
        else s.pending += 1;
      }

      for (const a of assignments) {
        a.submissions_summary = summaryMap[a.id] || { total: 0, submitted: 0, graded: 0, pending: 0, late: 0 };
      }
    }
  }

  return assignments;
};

/**
 * 2. ดึงรายละเอียดงานชิ้นเดียวตาม ID
 */
export const getAssignmentById = async (id: string): Promise<Assignment | null> => {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      subject:subject_id (id, subject_code, subject_name),
      classroom:classroom_id (id, level, room),
      teacher:teacher_id (id, first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Assignment;
};

/**
 * ตรวจสอบและแปลง teacher_id ให้เป็น teachers.id ที่มีอยู่จริงในฐานข้อมูล
 * หากผู้ใช้ส่งเป็น user_id (Supabase Auth) จะทำการค้นหา teachers.id จาก teachers.user_id ให้อัตโนมัติ
 * หากไม่พบ จะคืนค่า null เพื่อป้องกันไม่ให้เกิด Foreign Key Constraint Error
 */
export const resolveTeacherId = async (inputTeacherId?: string | null): Promise<string | null> => {
  if (!inputTeacherId) return null;

  try {
    // 1. ตรวจสอบว่าตรงกับ teachers.id หรือไม่
    const { data: byId } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', inputTeacherId)
      .maybeSingle();

    if (byId) return byId.id;

    // 2. ถ้าไม่พบ ให้ลองค้นหาจาก user_id (auth.users.id)
    const { data: byUserId } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', inputTeacherId)
      .maybeSingle();

    if (byUserId) return byUserId.id;
  } catch (err) {
    console.warn('Error resolving teacher id:', err);
  }

  return null;
};

/**
 * ถอดรหัส metadata ที่เก็บใน feedback:
 * [RECEIVED] = รับงานแล้ว
 * [GROUP:ชื่อกลุ่ม] = ชื่อกลุ่ม
 */
export const parseSubmissionMeta = (rawFeedback?: string | null): {
  isReceived: boolean;
  groupName: string | null;
  cleanFeedback: string;
} => {
  if (!rawFeedback) {
    return { isReceived: false, groupName: null, cleanFeedback: '' };
  }

  const isReceived = rawFeedback.includes('[RECEIVED]');
  const groupMatch = rawFeedback.match(/\[GROUP:(.*?)\]/);
  const groupName = groupMatch ? groupMatch[1].trim() : null;

  const cleanFeedback = rawFeedback
    .replace(/\[RECEIVED\]/g, '')
    .replace(/\[GROUP:.*?\]/g, '')
    .trim();

  return { isReceived, groupName, cleanFeedback };
};

/**
 * รวม metadata เข้าเป็น feedback string สำหรับจัดเก็บลงฐานข้อมูล
 */
export const formatSubmissionMeta = (
  isReceived?: boolean,
  groupName?: string | null,
  cleanFeedback?: string | null
): string | null => {
  const parts: string[] = [];
  if (isReceived) parts.push('[RECEIVED]');
  if (groupName && groupName.trim()) parts.push(`[GROUP:${groupName.trim()}]`);
  if (cleanFeedback && cleanFeedback.trim()) parts.push(cleanFeedback.trim());

  return parts.length > 0 ? parts.join(' ') : null;
};

/**
 * 3. สร้างงาน/การบ้านใหม่ พร้อมเตรียมรายชื่อส่งงานเฉพาะนักเรียนที่เลือก หรือทุกคนในห้อง (รองรับทั้งงานเดี่ยวและงานกลุ่ม)
 */
export const createAssignment = async (payload: CreateAssignmentDTO): Promise<Assignment> => {
  const resolvedTeacherId = await resolveTeacherId(payload.teacher_id);
  const { student_ids, group_name, ...assignmentFields } = payload;

  const insertPayload = {
    ...assignmentFields,
    teacher_id: resolvedTeacherId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('assignments')
    .insert(insertPayload)
    .select(`
      *,
      subject:subject_id (id, subject_code, subject_name),
      classroom:classroom_id (id, level, room),
      teacher:teacher_id (id, first_name, last_name)
    `)
    .single();

  if (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }

  const createdAssignment = data as Assignment;

  // จัดการรายชื่อนักเรียนที่ได้รับมอบหมายงาน (เฉพาะที่เลือก หรือทุกคนในห้อง)
  try {
    const hasSpecificStudents = student_ids && student_ids.length > 0;
    const initialFeedback = formatSubmissionMeta(false, group_name, null);

    if (hasSpecificStudents) {
      // 1. ถ้ามี Trigger ของฐานข้อมูลสร้างรายชื่อนักเรียนทั้งหมดขึ้นมา ให้ลบคนที่ไม่ถูกเลือกออก
      await supabase
        .from('assignment_submissions')
        .delete()
        .eq('assignment_id', createdAssignment.id)
        .not('student_id', 'in', `(${student_ids.join(',')})`);

      // 2. เตรียมแถวส่งงานเฉพาะนักเรียนที่เลือก
      const submissionRows = student_ids.map(sid => ({
        assignment_id: createdAssignment.id,
        student_id: sid,
        status: 'pending' as SubmissionStatus,
        feedback: initialFeedback,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      await supabase
        .from('assignment_submissions')
        .upsert(submissionRows, { onConflict: 'assignment_id,student_id', ignoreDuplicates: false });
    } else {
      // มอบหมายทุกคนในห้อง
      const { data: allStudents } = await supabase
        .from('students')
        .select('id')
        .eq('classroom_id', payload.classroom_id)
        .is('deleted_at', null);

      if (allStudents && allStudents.length > 0) {
        const submissionRows = allStudents.map(s => ({
          assignment_id: createdAssignment.id,
          student_id: s.id,
          status: 'pending' as SubmissionStatus,
          feedback: initialFeedback,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        await supabase
          .from('assignment_submissions')
          .upsert(submissionRows, { onConflict: 'assignment_id,student_id', ignoreDuplicates: false });
      }
    }
  } catch (syncErr) {
    console.warn('Sync submissions student selection error:', syncErr);
  }

  return createdAssignment;
};

/**
 * 4. แก้ไขข้อมูลชิ้นงาน
 */
export const updateAssignment = async (id: string, payload: UpdateAssignmentDTO): Promise<Assignment> => {
  let resolvedTeacherId = payload.teacher_id;
  if (payload.teacher_id !== undefined) {
    resolvedTeacherId = await resolveTeacherId(payload.teacher_id);
  }

  const updatePayload = {
    ...payload,
    ...(payload.teacher_id !== undefined ? { teacher_id: resolvedTeacherId } : {}),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('assignments')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      subject:subject_id (id, subject_code, subject_name),
      classroom:classroom_id (id, level, room),
      teacher:teacher_id (id, first_name, last_name)
    `)
    .single();

  if (error) {
    console.error('Error updating assignment:', error);
    throw error;
  }

  return data as Assignment;
};

/**
 * 5. ลบชิ้นงาน (Foreign Key Cascade จะลบข้อมูล submission ที่เกี่ยวข้องให้อัตโนมัติ)
 */
export const deleteAssignment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting assignment:', error);
    throw error;
  }
};

/**
 * 6. ดึงรายชื่อนักเรียนพร้อมสถานะการส่งงานและคะแนนของชิ้นงานนั้น
 */
export const getSubmissionsByAssignment = async (assignmentId: string): Promise<AssignmentSubmission[]> => {
  // ดึง assignment เพื่อทราบ classroom_id
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) throw new Error('ไม่พบข้อมูลชิ้นงาน');

  // ดึงนักเรียนทุกคนในห้องเรียนนี้
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, nickname, gender, classroom_id')
    .eq('classroom_id', assignment.classroom_id)
    .is('deleted_at', null)
    .order('student_code', { ascending: true });

  if (studentError) {
    console.error('Error fetching classroom students:', studentError);
    throw studentError;
  }

  // ดึงรายการ submission ที่มีอยู่แล้ว
  let { data: submissions, error: subError } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      student:student_id (id, student_code, first_name, last_name, nickname, gender, classroom_id),
      checker:checked_by (id, first_name, last_name)
    `)
    .eq('assignment_id', assignmentId);

  if (subError) {
    console.error('Error fetching submissions:', subError);
    throw subError;
  }

  // หากยังไม่มี submission เลย (เช่น งานเดิมที่สร้างก่อนมีระบบ sync) ให้สร้างเริ่มต้นให้นักเรียนทุกคนในห้อง
  if ((!submissions || submissions.length === 0) && students && students.length > 0) {
    const missingRows = students.map(s => ({
      assignment_id: assignmentId,
      student_id: s.id,
      status: 'pending' as SubmissionStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: insertedSubs } = await supabase
      .from('assignment_submissions')
      .insert(missingRows)
      .select(`
        *,
        student:student_id (id, student_code, first_name, last_name, nickname, gender, classroom_id),
        checker:checked_by (id, first_name, last_name)
      `);

    if (insertedSubs) {
      submissions = insertedSubs;
    }
  }

  // แปลงและแนบ metadata (is_received, group_name) ให้นักเรียนแต่ละคน
  const result: AssignmentSubmission[] = [];
  (submissions || []).forEach(sub => {
    const student = (students || []).find(s => s.id === sub.student_id);
    if (student) {
      const meta = parseSubmissionMeta(sub.feedback);
      const isTurnedIn = sub.status === 'submitted' || sub.status === 'graded';
      
      const enrichedSub: AssignmentSubmission = {
        ...sub,
        student,
        is_received: isTurnedIn || (sub as any).is_received || meta.isReceived,
        group_name: (sub as any).group_name || meta.groupName || null,
        feedback: meta.cleanFeedback || null
      };
      result.push(enrichedSub);
    }
  });

  // เรียงลำดับตามใบรายชื่อไฟล์ Excel (สำหรับ ม.3 ใช้ลำดับเลขที่ตามไฟล์ 23.รายชื่อ1ถึง6-ภาค 2.2569 -ณ-10 พ.ย.2569.xlsx)
  result.sort((a, b) => compareStudentsByRosterOrder(a.student || {}, b.student || {}));

  return result;
};

/**
 * 7. อัปเดตการส่งงานและคะแนนรายบุคคล
 */
export const updateSubmission = async (
  id: string,
  payload: UpdateSubmissionDTO
): Promise<AssignmentSubmission> => {
  let resolvedCheckedBy = payload.checked_by;
  if (payload.checked_by !== undefined) {
    resolvedCheckedBy = await resolveTeacherId(payload.checked_by);
  }

  let formattedFeedback = payload.feedback;
  if (payload.is_received !== undefined || payload.group_name !== undefined) {
    formattedFeedback = formatSubmissionMeta(
      payload.is_received,
      payload.group_name,
      payload.feedback
    );
  }

  const updatePayload: Record<string, any> = {
    ...payload,
    ...(payload.checked_by !== undefined ? { checked_by: resolvedCheckedBy } : {}),
    ...(formattedFeedback !== undefined ? { feedback: formattedFeedback } : {}),
    updated_at: new Date().toISOString()
  };

  delete updatePayload.is_received;
  delete updatePayload.group_name;

  const { data, error } = await supabase
    .from('assignment_submissions')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      student:student_id (id, student_code, first_name, last_name, nickname, gender, classroom_id),
      checker:checked_by (id, first_name, last_name)
    `)
    .single();

  if (error) {
    console.error('Error updating submission:', error);
    throw error;
  }

  const res = data as AssignmentSubmission;
  const meta = parseSubmissionMeta(res.feedback);
  res.is_received = res.status === 'submitted' || res.status === 'graded' || meta.isReceived;
  res.group_name = meta.groupName;
  res.feedback = meta.cleanFeedback || null;

  return res;
};

/**
 * 8. อัปเดตการส่งงานและคะแนนแบบกลุ่มหลายคนพร้อมกัน (Batch Save)
 */
export const batchSaveSubmissions = async (
  items: BatchSubmissionUpdateItem[],
  teacherId?: string
): Promise<void> => {
  if (!items || items.length === 0) return;

  const resolvedTeacherId = await resolveTeacherId(teacherId);
  const now = new Date().toISOString();
  const updatePromises = items.map(item => {
    let formattedFeedback = item.feedback;
    if (item.is_received !== undefined || item.group_name !== undefined) {
      formattedFeedback = formatSubmissionMeta(
        item.is_received,
        item.group_name,
        item.feedback
      );
    }

    const payload: Record<string, any> = {
      status: item.status,
      score: item.score !== undefined ? item.score : null,
      feedback: formattedFeedback !== undefined ? formattedFeedback : null,
      updated_at: now
    };

    if (item.status === 'submitted' || item.status === 'graded' || item.status === 'late') {
      payload.submitted_at = payload.submitted_at || now;
    }
    if (resolvedTeacherId) {
      payload.checked_by = resolvedTeacherId;
    }

    return supabase
      .from('assignment_submissions')
      .update(payload)
      .eq('id', item.id);
  });

  const results = await Promise.all(updatePromises);
  const hasError = results.find(r => r.error);
  if (hasError?.error) {
    console.error('Batch save submissions error:', hasError.error);
    throw hasError.error;
  }
};

/**
 * 9. ดึงรายชื่อวิชาและห้องเรียนที่ครูคนนั้นสอนจริงจากตาราง schedules (อิงตามระบบเช็คชื่อรายวิชา)
 */
export const getTeacherTeachingCourses = async (
  teacherId?: string | null,
  academicYearId?: string,
  semesterId?: string
): Promise<TeacherCourseClassroom[]> => {
  let selectStr = `
    subject_id,
    classroom_id,
    teacher_id,
    subject:subject_id (id, subject_code, subject_name),
    classroom:classroom_id (id, level, room, academic_year_id),
    teacher:teacher_id (id, first_name, last_name)
  `;

  if (academicYearId) {
    selectStr = `
      subject_id,
      classroom_id,
      teacher_id,
      subject:subject_id (id, subject_code, subject_name),
      classroom:classroom_id!inner(id, level, room, academic_year_id),
      teacher:teacher_id (id, first_name, last_name)
    `;
  }

  let query = supabase.from('schedules').select(selectStr);

  // กรองเฉพาะครูที่เลือก (ยกเว้นกรณีเลือก 'school' คือดูทั้งโรงเรียน)
  if (teacherId && teacherId !== 'school') {
    query = query.eq('teacher_id', teacherId);
  }
  if (academicYearId) {
    query = query.eq('classroom.academic_year_id', academicYearId);
  }
  if (semesterId) {
    query = query.eq('semester_id', semesterId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching teacher teaching courses from schedules:', error);
    return [];
  }

  // รวมรายการเฉพาะคู่ (subject_id + classroom_id + teacher_id) ที่ไม่ซ้ำกัน
  const map = new Map<string, TeacherCourseClassroom>();

  (data || []).forEach((row: any) => {
    if (row.subject && row.classroom) {
      const key = `${row.subject.id}_${row.classroom.id}_${row.teacher_id || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          subject_id: row.subject.id,
          subject_code: row.subject.subject_code,
          subject_name: row.subject.subject_name,
          classroom_id: row.classroom.id,
          classroom_level: row.classroom.level,
          classroom_room: row.classroom.room,
          teacher_id: row.teacher?.id || row.teacher_id,
          teacher_name: row.teacher ? `${row.teacher.first_name} ${row.teacher.last_name}` : undefined
        });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const levelCmp = a.classroom_level.localeCompare(b.classroom_level, 'th', { numeric: true });
    if (levelCmp !== 0) return levelCmp;
    const roomCmp = a.classroom_room.localeCompare(b.classroom_room, 'th', { numeric: true });
    if (roomCmp !== 0) return roomCmp;
    return a.subject_code.localeCompare(b.subject_code, 'th', { numeric: true });
  });
};

/**
 * 10. สรุปสถิติตัวเลขภาพรวมงานและการส่งงาน
 */
export const getAssignmentSummaryStats = async (
  filter: AssignmentFilter = {}
): Promise<AssignmentSummaryStats> => {
  const assignments = await getAssignments(filter);
  const totalAssignments = assignments.length;

  let totalSubmissions = 0;
  let submittedCount = 0;
  let gradedCount = 0;
  let pendingCount = 0;
  let lateCount = 0;

  assignments.forEach(a => {
    if (a.submissions_summary) {
      totalSubmissions += a.submissions_summary.total;
      submittedCount += a.submissions_summary.submitted;
      gradedCount += a.submissions_summary.graded;
      pendingCount += a.submissions_summary.pending;
      lateCount += a.submissions_summary.late;
    }
  });

  const totalHandedIn = submittedCount + gradedCount + lateCount;
  const submissionRate = totalSubmissions > 0 ? Math.round((totalHandedIn / totalSubmissions) * 100) : 0;

  return {
    totalAssignments,
    totalSubmissions,
    submittedCount,
    gradedCount,
    pendingCount,
    lateCount,
    submissionRate
  };
};

