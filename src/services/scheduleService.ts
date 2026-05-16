import { supabase } from '../lib/supabase'

export interface Schedule {
  id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  day_of_week: number
  period: number
  start_time: string
  end_time: string
  room_name?: string
  subject?: { subject_code: string; subject_name: string }
  teacher?: { first_name: string; last_name: string }
  classroom?: { level: string; room: string }
}

export const getSchedules = async (classroomId?: string, teacherId?: string) => {
  let query = supabase.from('schedules').select(`
    *,
    subject:subject_id (subject_code, subject_name),
    teacher:teacher_id (first_name, last_name),
    classroom:classroom_id (level, room)
  `).order('day_of_week').order('period')

  if (classroomId) query = query.eq('classroom_id', classroomId)
  if (teacherId) query = query.eq('teacher_id', teacherId)

  const { data, error } = await query
  if (error) throw error
  return data as Schedule[]
}

export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'subject' | 'teacher' | 'classroom'>) => {
  const { data, error } = await supabase.from('schedules').insert(schedule).select().single()
  if (error) throw error
  return data as Schedule
}

export const updateSchedule = async (
  id: string,
  schedule: Omit<Schedule, 'id' | 'subject' | 'teacher' | 'classroom'>
) => {
  const { data, error } = await supabase
    .from('schedules')
    .update(schedule)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Schedule
}

export const deleteSchedule = async (id: string) => {
  // 1) ดึง session ที่ผูกกับ schedule นี้
  const { data: sessions, error: sessionFetchError } = await supabase
    .from('attendance_sessions')
    .select('id')
    .eq('schedule_id', id)
  if (sessionFetchError) throw sessionFetchError

  const sessionIds = (sessions || []).map((s: any) => s.id)

  // 2) ลบ attendance ที่ผูกกับ session เหล่านั้น
  if (sessionIds.length > 0) {
    const { error: attendanceBySessionError } = await supabase
      .from('attendance')
      .delete()
      .in('session_id', sessionIds)
    if (attendanceBySessionError) throw attendanceBySessionError
  }

  // 3) ลบ attendance_sessions ของ schedule นี้
  const { error: sessionDeleteError } = await supabase
    .from('attendance_sessions')
    .delete()
    .eq('schedule_id', id)
  if (sessionDeleteError) throw sessionDeleteError

  // 4) ลบ schedule หลัก
  const { error: scheduleDeleteError } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)
  if (scheduleDeleteError) throw scheduleDeleteError
}
