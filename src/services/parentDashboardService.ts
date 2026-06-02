import { supabase } from '../lib/supabase'

/**
 * ดึงรายการบุตรหลานของผู้ปกครองคนนี้โดยหาจาก email หรือ id ของบัญชีผู้ใช้
 */
export const getParentStudents = async (email: string) => {
  if (!email) return []

  // 1. ค้นหาข้อมูลผู้ปกครองในตาราง parents ด้วยอีเมล
  const { data: parent, error: parentError } = await supabase
    .from('parents')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  
  if (parentError) throw parentError
  if (!parent) return []

  // 2. ค้นหานักเรียนที่มี parent_id ตรงกัน
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('*, classrooms(level, room)')
    .eq('parent_id', parent.id)
  
  if (studentError) throw studentError
  return students || []
}

/**
 * ดึงข้อมูลการเข้าเรียนวิชาและโฮมรูมของนักเรียนคนนี้
 */
export const getStudentAttendanceSummary = async (studentId: string) => {
  // ดึงข้อมูลเช็คชื่อเข้าแถว (Homeroom)
  const { data: homeroom, error: homeroomError } = await supabase
    .from('homeroom_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: false })
  
  if (homeroomError) throw homeroomError

  // ดึงข้อมูลเช็คชื่อรายวิชา (Attendance)
  const { data: subjectAtt, error: subjectError } = await supabase
    .from('attendance')
    .select('*, attendance_sessions(session_date, start_time, subjects(subject_name))')
    .eq('student_id', studentId)
    .order('checkin_time', { ascending: false })
  
  if (subjectError) throw subjectError

  return {
    homeroom: homeroom || [],
    subject: subjectAtt || []
  }
}

/**
 * ดึงประวัติการยื่นใบลาของนักเรียนคนนี้
 */
export const getStudentLeaveHistory = async (studentId: string) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('start_date', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * ดึงสถานะการเยี่ยมบ้านของนักเรียนคนนี้
 */
export const getStudentHomeVisitInfo = async (studentId: string) => {
  const { data, error } = await supabase
    .from('home_visits')
    .select('*, home_visit_assessments(*), home_visit_photos(*)')
    .eq('student_id', studentId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

/**
 * ดึงผลการคัดกรองและการดูแลช่วยเหลือ (SDQ / EQ / Risk Analysis)
 */
export const getStudentSupportSummary = async (studentId: string) => {
  const { data: sdq, error: sdqError } = await supabase
    .from('student_support_sdq')
    .select('*')
    .eq('student_id', studentId)
  
  if (sdqError) throw sdqError

  const { data: eq, error: eqError } = await supabase
    .from('student_support_eq')
    .select('*')
    .eq('student_id', studentId)
  
  if (eqError) throw eqError

  const { data: risk, error: riskError } = await supabase
    .from('student_support_risk_analysis')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()
  
  if (riskError) throw riskError

  return {
    sdq: sdq || [],
    eq: eq || [],
    risk: risk || null
  }
}
