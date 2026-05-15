import { supabase } from '../lib/supabase'

export interface HomeroomAttendance {
  id?: string
  student_id: string
  attendance_date: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'
  checkin_time?: string
}

// Fetch students for a specific classroom
export const getStudentsByClassroom = async (classroomId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, first_name, last_name, nickname')
    .eq('classroom_id', classroomId)
    .order('student_code')
  
  if (error) throw error
  return data
}

// Save Homeroom Attendance
export const saveHomeroomAttendance = async (date: string, records: HomeroomAttendance[]) => {
  const studentIds = records.map(r => r.student_id)
  if (studentIds.length > 0) {
    // Delete existing records for this date and these students to avoid duplicates
    await supabase
      .from('homeroom_attendance')
      .delete()
      .eq('attendance_date', date)
      .in('student_id', studentIds)

    // Insert new records
    const { error } = await supabase.from('homeroom_attendance').insert(records)
    if (error) throw error
  }
}
