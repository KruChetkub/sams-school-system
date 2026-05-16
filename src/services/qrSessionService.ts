import { supabase } from '../lib/supabase'

export const createAttendanceSession = async (scheduleId: string) => {
  // First, fetch schedule details
  const { data: schedule } = await supabase.from('schedules').select('subject_id, teacher_id').eq('id', scheduleId).single()
  
  if (!schedule) throw new Error('Schedule not found')

  // Generate a random token for the QR
  const qrToken = `SAMS-${scheduleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const session = {
    subject_id: schedule.subject_id,
    teacher_id: schedule.teacher_id,
    schedule_id: scheduleId,
    session_date: new Date().toISOString().split('T')[0],
    start_time: new Date().toISOString().split('T')[1].substring(0, 8),
    qr_code: qrToken,
    status: 'ACTIVE'
  }

  const { data, error } = await supabase.from('attendance_sessions').insert(session).select().single()
  if (error) throw error
  return data
}

export const updateSessionQR = async (sessionId: string) => {
  const qrToken = `SAMS-REFRESH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({ qr_code: qrToken })
    .eq('id', sessionId)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export const closeSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('attendance_sessions')
    .update({ 
      status: 'INACTIVE', 
      end_time: new Date().toISOString().split('T')[1].substring(0, 8) 
    })
    .eq('id', sessionId)
    
  if (error) throw error
}

export const getSessionAttendance = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      checkin_time,
      status,
      students (
        id,
        student_code,
        first_name,
        last_name
      )
    `)
    .eq('session_id', sessionId)
    .order('checkin_time', { ascending: false })
    
  if (error) throw error
  return data
}
