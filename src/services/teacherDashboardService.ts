import { supabase } from '../lib/supabase'

export interface TeacherProfile {
  id: string
  user_id: string
  teacher_code: string
  first_name: string
  last_name: string
  phone: string
  email: string
  department: string
  role: 'TEACHER' | 'EXECUTIVE' | 'ADMIN'
}

/**
 * ดึงข้อมูลครูตาม user_id จาก auth
 */
export const getTeacherByUserId = async (userId: string): Promise<TeacherProfile | null> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) throw error
  return data as TeacherProfile | null
}

/**
 * ดึงรายการห้องเรียนที่ครูคนนี้ดูแล (เป็นครูที่ปรึกษา advisor_id หรือครูประจำวิชา)
 */
export const getTeacherClassrooms = async (teacherId: string, academicYearId?: string) => {
  let query = supabase
    .from('classrooms')
    .select('*')
    .or(`advisor_id.eq.${teacherId},advisor2_id.eq.${teacherId}`)
  
  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  const { data, error } = await query
    .order('level')
    .order('room')
  
  if (error) throw error
  return data
}

/**
 * ดึงข้อมูลการเข้าแถว (Homeroom) ของห้องเรียนที่ครูคนนี้เป็นครูที่ปรึกษาในวันนี้
 */
export const getTeacherHomeroomToday = async (classroomIds: string[], dateStr: string) => {
  if (!classroomIds || classroomIds.length === 0) return []

  // 1. ดึงนักเรียนในห้องเรียนเหล่านี้
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, classroom_id')
    .in('classroom_id', classroomIds)
    .is('deleted_at', null)
  
  if (studentError) throw studentError
  if (!students || students.length === 0) return []

  const studentIds = students.map(s => s.id)

  // 2. ดึงการเช็คชื่อเข้าแถวของนักเรียนกลุ่มนี้ในวันนี้
  const { data: attendance, error: attendanceError } = await supabase
    .from('homeroom_attendance')
    .select('student_id, status')
    .eq('attendance_date', dateStr)
    .in('student_id', studentIds)
  
  if (attendanceError) throw attendanceError

  // 3. จัดกลุ่มสรุปตาม classroom_id
  const summaryMap = new Map<string, {
    total: number
    checked: number
    present: number
    late: number
    absent: number
    leave: number
  }>()

  classroomIds.forEach(id => {
    summaryMap.set(id, { total: 0, checked: 0, present: 0, late: 0, absent: 0, leave: 0 })
  })

  students.forEach(s => {
    const sum = summaryMap.get(s.classroom_id)
    if (sum) {
      sum.total += 1
    }
  })

  attendance?.forEach(att => {
    const student = students.find(s => s.id === att.student_id)
    if (!student) return
    const sum = summaryMap.get(student.classroom_id)
    if (sum) {
      sum.checked += 1
      if (att.status === 'PRESENT') sum.present += 1
      else if (att.status === 'LATE') sum.late += 1
      else if (att.status === 'ABSENT') sum.absent += 1
      else if (att.status === 'LEAVE') sum.leave += 1
    }
  })

  return Array.from(summaryMap.entries()).map(([classroomId, stats]) => ({
    classroomId,
    ...stats
  }))
}

/**
 * ดึงข้อมูลการสอนและการเช็คชื่อวิชาของครูคนนี้ในวันนี้
 */
export const getTeacherSubjectAttendanceToday = async (
  teacherId: string, 
  dayOfWeek: number, 
  dateStr: string,
  academicYearId?: string
) => {
  // 1. ดึงตารางเรียนของครูในวันนี้
  let selectStr = '*, subject:subject_id(subject_name, subject_code), classroom:classroom_id(level, room, academic_year_id)'
  if (academicYearId) {
    selectStr = '*, subject:subject_id(subject_name, subject_code), classroom:classroom_id!inner(level, room, academic_year_id)'
  }

  let query = supabase
    .from('schedules')
    .select(selectStr)
    .eq('teacher_id', teacherId)
    .eq('day_of_week', dayOfWeek)

  if (academicYearId) {
    query = query.eq('classroom.academic_year_id', academicYearId)
  }

  const { data: schedules, error: scheduleError } = await query.order('period')
  
  if (scheduleError) throw scheduleError
  if (!schedules || schedules.length === 0) return []

  const scheduleIds = schedules.map(s => s.id)

  // 2. ดึง session ที่บันทึกเช็คชื่อของตารางเรียนเหล่านี้ในวันนี้
  const { data: sessions, error: sessionError } = await supabase
    .from('attendance_sessions')
    .select('id, schedule_id')
    .eq('session_date', dateStr)
    .in('schedule_id', scheduleIds)
  
  if (sessionError) throw sessionError

  const sessionIds = (sessions || []).map(s => s.id)

  // 3. ดึงสถิติเช็คชื่อของแต่ละ session
  let attendanceRecords: any[] = []
  if (sessionIds.length > 0) {
    const { data: attData, error: attError } = await supabase
      .from('attendance')
      .select('session_id, status')
      .in('session_id', sessionIds)
    if (attError) throw attError
    attendanceRecords = attData || []
  }

  // 4. สรุปคาบเรียนพร้อมสถิติ
  return schedules.map(sch => {
    const session = sessions?.find(s => s.schedule_id === sch.id)
    const isChecked = !!session
    let stats = { present: 0, late: 0, absent: 0, leave: 0, total: 0 }
    
    if (session) {
      const records = attendanceRecords.filter(r => r.session_id === session.id)
      stats.total = records.length
      records.forEach(r => {
        if (r.status === 'PRESENT') stats.present += 1
        else if (r.status === 'LATE') stats.late += 1
        else if (r.status === 'ABSENT') stats.absent += 1
        else if (r.status === 'LEAVE') stats.leave += 1
      })
    }

    return {
      schedule: sch,
      isChecked,
      stats
    }
  })
}

/**
 * ดึงรายการนักเรียนในกลุ่มเสี่ยง (RISK หรือ URGENT) ของห้องเรียนที่ครูคนนี้ดูแล
 */
export const getTeacherStudentRiskSummary = async (classroomIds: string[], academicYearId?: string) => {
  if (!classroomIds || classroomIds.length === 0) return []

  // 1. ดึงนักเรียนในห้องเรียนเหล่านี้
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name, prefix, student_code, classroom_id, classrooms(level, room)')
    .in('classroom_id', classroomIds)
    .is('deleted_at', null)
  
  if (studentError) throw studentError
  if (!students || students.length === 0) return []

  const studentIds = students.map(s => s.id)

  // 2. ดึงสถานะความเสี่ยงจาก student_support_risk_analysis
  let query = supabase
    .from('student_support_risk_analysis')
    .select('*')
    .in('student_id', studentIds)
    .in('risk_level', ['RISK', 'URGENT'])

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }
  
  const { data: riskData, error: riskError } = await query
  
  if (riskError) throw riskError

  return (riskData || []).map(risk => {
    const student = students.find(s => s.id === risk.student_id)
    return {
      ...risk,
      student
    }
  })
}

/**
 * ดึงความคืบหน้าการเยี่ยมบ้านของนักเรียนในห้องเรียนที่ครูคนนี้ดูแล
 */
export const getTeacherHomeVisitProgress = async (classroomIds: string[], academicYearId?: string) => {
  if (!classroomIds || classroomIds.length === 0) return { visited: 0, total: 0 }

  // 1. ดึงนักเรียนทั้งหมดในห้องเรียน
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id')
    .in('classroom_id', classroomIds)
    .is('deleted_at', null)
  
  if (studentError) throw studentError
  if (!students || students.length === 0) return { visited: 0, total: 0 }

  const studentIds = students.map(s => s.id)

  // 2. ดึงจำนวนการเยี่ยมบ้านที่เรียบร้อยแล้ว
  let visitQuery = supabase
    .from('home_visits')
    .select('student_id')
    .in('student_id', studentIds)

  if (academicYearId) {
    visitQuery = visitQuery.eq('academic_year_id', academicYearId)
  }
  
  const { data: visits, error: visitError } = await visitQuery
  
  if (visitError) throw visitError

  const uniqueVisitedStudentIds = new Set((visits || []).map(v => v.student_id))

  return {
    visited: uniqueVisitedStudentIds.size,
    total: studentIds.length
  }
}

/**
 * ดึงตารางสอนทั้งหมดของครูในวันนี้
 */
export const getTeacherScheduleToday = async (teacherId: string, dayOfWeek: number, academicYearId?: string) => {
  let selectStr = `
    *,
    subject:subject_id (subject_code, subject_name),
    classroom:classroom_id (level, room, academic_year_id)
  `
  if (academicYearId) {
    selectStr = `
      *,
      subject:subject_id (subject_code, subject_name),
      classroom:classroom_id!inner(level, room, academic_year_id)
    `
  }

  let query = supabase
    .from('schedules')
    .select(selectStr)
    .eq('teacher_id', teacherId)
    .eq('day_of_week', dayOfWeek)

  if (academicYearId) {
    query = query.eq('classroom.academic_year_id', academicYearId)
  }

  const { data, error } = await query.order('period')
  
  if (error) throw error
  return data
}
