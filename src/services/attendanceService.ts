import { supabase } from '../lib/supabase'
import { compareStudentsByRosterOrder } from './studentService'

export interface AttendanceRecord {
  schedule_id: string
  student_id: string
  attendance_date: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'
  checkin_time?: string
  academic_year_id?: string
  semester_id?: string
}

export const getExistingClassroomAttendance = async (scheduleId: string, date: string) => {
  if (!scheduleId || !date) return []
  const { data: session, error: sessionErr } = await supabase
    .from('attendance_sessions')
    .select('id')
    .eq('schedule_id', scheduleId)
    .eq('session_date', date)
    .maybeSingle()

  if (sessionErr || !session?.id) return []

  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('session_id', session.id)

  if (error) return []
  return data || []
}

export const getStudentsForSchedule = async (scheduleId: string) => {
  // First get the classroom_id, subject_id, and room_name from the schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('classroom_id, subject_id, room_name')
    .eq('id', scheduleId)
    .single()
    
  if (scheduleError) throw scheduleError
  
  if (!schedule) return []

  // Step 1: Check if there are subject-based memberships for this subject
  if (schedule.subject_id) {
    const { data: memberships, error: membershipError } = await supabase
      .from('student_group_memberships')
      .select('student_id')
      .eq('group_type', 'SUBJECT')
      .eq('group_id', schedule.subject_id)
      
    if (membershipError) throw membershipError
    
    if (memberships && memberships.length > 0) {
      const studentIds = memberships.map((m: any) => m.student_id)
      let { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, student_code, student_number, is_in_official_roster, prefix, first_name, last_name, nickname, gender, classroom:classroom_id (level, room)')
        .in('id', studentIds)
        .is('deleted_at', null)
        .order('student_code')

      if (studentsError && (studentsError.code === '42703' || String(studentsError.message || '').includes('student_number'))) {
        const fb = await supabase
          .from('students')
          .select('id, student_code, prefix, first_name, last_name, nickname, gender, classroom:classroom_id (level, room)')
          .in('id', studentIds)
          .is('deleted_at', null)
          .order('student_code')
        students = fb.data as any
        studentsError = fb.error
      }
        
      if (studentsError) throw studentsError
      return ((students || []) as any[]).sort(compareStudentsByRosterOrder)
    }
  }

  // Step 2: Fallback to standard classroom and extra classrooms
  if (!schedule.classroom_id) return []

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
  let { data, error } = await supabase
    .from('students')
    .select('id, student_code, student_number, is_in_official_roster, prefix, first_name, last_name, nickname, gender, classroom:classroom_id (level, room)')
    .in('classroom_id', classroomIds)
    .is('deleted_at', null)
    .order('student_code')

  if (error && (error.code === '42703' || String(error.message || '').includes('student_number'))) {
    const fb = await supabase
      .from('students')
      .select('id, student_code, prefix, first_name, last_name, nickname, gender, classroom:classroom_id (level, room)')
      .in('classroom_id', classroomIds)
      .is('deleted_at', null)
      .order('student_code')
    data = fb.data as any
    error = fb.error
  }
    
  if (error) throw error
  const unique = new Map<string, any>()
  ;(data || []).forEach((row: any) => unique.set(row.id, row))
  return Array.from(unique.values()).sort(compareStudentsByRosterOrder)
}

export const saveClassroomAttendance = async (records: AttendanceRecord[]) => {
  if (records.length === 0) return
  
  // เรียกใช้งาน RPC เพื่อจัดการ Session และ Insert ลงตาราง Attendance
  const { error } = await supabase.rpc('save_classroom_attendance', {
    p_records: records
  })
    
  if (error) throw error
}
