import { supabase } from '../lib/supabase'

export const submitQRScan = async (qrToken: string, lat?: number, lng?: number) => {
  // 1. Get current logged in user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('กรุณาล็อกอินก่อนทำการสแกน')
  
  // 2. Find student ID from user ID
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
    
  if (!student) {
    throw new Error('ไม่พบข้อมูลนักเรียนของคุณในระบบ (บัญชีนี้อาจไม่ใช่บัญชีนักเรียน)')
  }

  // 3. Find the active session with this QR token
  const { data: attendanceSession } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('qr_code', qrToken)
    .eq('status', 'ACTIVE')
    .single()
    
  if (!attendanceSession) {
    throw new Error('QR Code หมดอายุ หรือ ไม่ถูกต้อง')
  }

  // 4. Check if already checked in
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('student_id', student.id)
    .eq('session_id', attendanceSession.id)
    .maybeSingle()

  if (existing) {
    throw new Error('คุณได้เช็คชื่อในคาบนี้ไปแล้ว')
  }

  // 5. Record attendance
  const record = {
    student_id: student.id,
    session_id: attendanceSession.id,
    checkin_time: new Date().toISOString(),
    status: 'PRESENT',
    gps_latitude: lat,
    gps_longitude: lng,
  }

  const { error } = await supabase.from('attendance').insert(record)
  if (error) throw error
  
  return attendanceSession
}
