import { supabase } from '../lib/supabase'

export interface Schedule {
  id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  academic_year_id?: string
  semester_id?: string
  day_of_week: number
  period: number
  start_time: string
  end_time: string
  room_name?: string
  subject?: { subject_code: string; subject_name: string }
  teacher?: { first_name: string; last_name: string }
  classroom?: { level: string; room: string; academic_year_id?: string }
}

export const getSchedules = async (
  classroomId?: string,
  teacherId?: string,
  academicYearId?: string,
  semesterId?: string
) => {
  let selectStr = `
    *,
    subject:subject_id (subject_code, subject_name),
    teacher:teacher_id (first_name, last_name),
    classroom:classroom_id (level, room, academic_year_id)
  `

  if (academicYearId && !classroomId) {
    selectStr = `
      *,
      subject:subject_id (subject_code, subject_name),
      teacher:teacher_id (first_name, last_name),
      classroom:classroom_id!inner(level, room, academic_year_id)
    `
  }

  let query = supabase.from('schedules').select(selectStr).order('day_of_week').order('period')

  if (classroomId) query = query.eq('classroom_id', classroomId)
  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (academicYearId && !classroomId) query = query.eq('classroom.academic_year_id', academicYearId)
  if (semesterId) query = query.eq('semester_id', semesterId)

  const { data, error } = await query
  if (error) throw error
  return data as Schedule[]
}

export const cloneSchedules = async (
  sourceSemesterId: string,
  targetSemesterId: string,
  targetAcademicYearId: string
) => {
  // 1. First attempt to call the RPC function in Supabase
  try {
    const { data: count, error: rpcError } = await supabase.rpc('clone_schedules_between_semesters', {
      source_semester_id: sourceSemesterId,
      target_semester_id: targetSemesterId,
      target_academic_year_id: targetAcademicYearId
    })
    if (!rpcError) return count as number
  } catch (_) {}

  // 2. Fallback: Client-side cloning if RPC not executed yet
  const sourceSchedules = await getSchedules(undefined, undefined, undefined, sourceSemesterId)
  if (!sourceSchedules || sourceSchedules.length === 0) return 0

  const targetSchedules = await getSchedules(undefined, undefined, undefined, targetSemesterId)
  const existingKeys = new Set(
    (targetSchedules || []).map(s => `${s.classroom_id}_${s.day_of_week}_${s.period}`)
  )

  const toInsert = sourceSchedules
    .filter(s => !existingKeys.has(`${s.classroom_id}_${s.day_of_week}_${s.period}`))
    .map(s => ({
      subject_id: s.subject_id,
      teacher_id: s.teacher_id,
      classroom_id: s.classroom_id,
      day_of_week: s.day_of_week,
      period: s.period,
      start_time: s.start_time,
      end_time: s.end_time,
      room_name: s.room_name || '',
      academic_year_id: targetAcademicYearId,
      semester_id: targetSemesterId
    }))

  if (toInsert.length === 0) return 0

  const { error: insertError } = await supabase.from('schedules').insert(toInsert)
  if (insertError) throw insertError

  return toInsert.length
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
