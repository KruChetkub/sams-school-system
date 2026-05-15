import { supabase } from '../lib/supabase'

export interface AttendanceRecord {
  schedule_id: string
  student_id: string
  attendance_date: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'
  checkin_time?: string
}

export const getStudentsForSchedule = async (scheduleId: string) => {
  // First get the classroom_id from the schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('classroom_id')
    .eq('id', scheduleId)
    .single()
    
  if (scheduleError) throw scheduleError
  
  if (!schedule?.classroom_id) return []

  // Then get all students in that classroom
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, first_name, last_name, nickname')
    .eq('classroom_id', schedule.classroom_id)
    .order('student_code')
    
  if (error) throw error
  return data
}

export const saveClassroomAttendance = async (records: AttendanceRecord[]) => {
  if (records.length === 0) return
  
  const { error } = await supabase
    .from('attendance_records')
    .upsert(records, { onConflict: 'schedule_id, student_id, attendance_date' })
    
  if (error) throw error
}
