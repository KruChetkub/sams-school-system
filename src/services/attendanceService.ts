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
    .select('classroom_id, room_name')
    .eq('id', scheduleId)
    .single()
    
  if (scheduleError) throw scheduleError
  
  if (!schedule?.classroom_id) return []

  const parseExtraClassroomIds = (roomName?: string | null) => {
    if (!roomName) return []
    const prefix = '[MULTI_CLASSROOM_IDS]'
    if (!roomName.startsWith(prefix)) return []
    const raw = roomName.replace(prefix, '').trim()
    if (!raw) return []
    return raw.split(',').map((x) => x.trim()).filter(Boolean)
  }
  const classroomIds = Array.from(new Set([schedule.classroom_id, ...parseExtraClassroomIds(schedule.room_name)]))

  // Then get all students in that classroom
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, nickname')
    .in('classroom_id', classroomIds)
    .order('student_code')
    
  if (error) throw error
  const unique = new Map<string, any>()
  ;(data || []).forEach((row: any) => unique.set(row.id, row))
  return Array.from(unique.values())
}

export const saveClassroomAttendance = async (records: AttendanceRecord[]) => {
  if (records.length === 0) return
  
  // เรียกใช้งาน RPC เพื่อจัดการ Session และ Insert ลงตาราง Attendance
  const { error } = await supabase.rpc('save_classroom_attendance', {
    p_records: records
  })
    
  if (error) throw error
}
