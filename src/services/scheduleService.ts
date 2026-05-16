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

export const deleteSchedule = async (id: string) => {
  const { error } = await supabase.from('schedules').delete().eq('id', id)
  if (error) throw error
}
