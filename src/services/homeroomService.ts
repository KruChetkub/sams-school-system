import { supabase } from '../lib/supabase'

export interface HomeroomAttendance {
  id?: string
  student_id: string
  attendance_date: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'
  checkin_time?: string
}

export interface CheckedHomeroomClassroom {
  classroom_id: string
  classroom_label: string
}

export interface HomeroomClassroomSummary extends CheckedHomeroomClassroom {
  total_students: number
  checked_students: number
  present_count: number
  late_count: number
  absent_count: number
  leave_count: number
  remaining_count: number
}

// Fetch students for a specific classroom
export const getStudentsByClassroom = async (classroomId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, nickname')
    .eq('classroom_id', classroomId)
    .order('student_code')
  
  if (error) throw error
  return data
}

export const getCheckedHomeroomClassroomsByDate = async (date: string): Promise<CheckedHomeroomClassroom[]> => {
  const { data, error } = await supabase
    .from('homeroom_attendance')
    .select(`
      students (
        classroom_id,
        classrooms ( level, room )
      )
    `)
    .eq('attendance_date', date)

  if (error) throw error

  const map = new Map<string, CheckedHomeroomClassroom>()
  ;(data || []).forEach((row: any) => {
    const classroomId = row.students?.classroom_id
    const classroom = row.students?.classrooms
    if (!classroomId || !classroom) return
    if (!map.has(classroomId)) {
      map.set(classroomId, {
        classroom_id: classroomId,
        classroom_label: `${classroom.level}/${classroom.room}`,
      })
    }
  })

  return Array.from(map.values()).sort((a, b) => a.classroom_label.localeCompare(b.classroom_label))
}

export const getHomeroomClassroomSummaryByDate = async (date: string): Promise<HomeroomClassroomSummary[]> => {
  const { data: classroomRows, error: classroomError } = await supabase
    .from('classrooms')
    .select('id, level, room')
    .order('level')
    .order('room')
  if (classroomError) throw classroomError

  const { data: studentRows, error: studentError } = await supabase
    .from('students')
    .select('id, classroom_id')
  if (studentError) throw studentError

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from('homeroom_attendance')
    .select('student_id, status, students(classroom_id)')
    .eq('attendance_date', date)
  if (attendanceError) throw attendanceError

  const baseMap = new Map<string, HomeroomClassroomSummary>()
  ;(classroomRows || []).forEach((c: any) => {
    baseMap.set(c.id, {
      classroom_id: c.id,
      classroom_label: `${c.level}/${c.room}`,
      total_students: 0,
      checked_students: 0,
      present_count: 0,
      late_count: 0,
      absent_count: 0,
      leave_count: 0,
      remaining_count: 0,
    })
  })

  ;(studentRows || []).forEach((s: any) => {
    const item = baseMap.get(s.classroom_id)
    if (item) item.total_students += 1
  })

  ;(attendanceRows || []).forEach((row: any) => {
    const classroomId = row.students?.classroom_id
    if (!classroomId) return
    const item = baseMap.get(classroomId)
    if (!item) return
    item.checked_students += 1
    if (row.status === 'PRESENT') item.present_count += 1
    if (row.status === 'LATE') item.late_count += 1
    if (row.status === 'ABSENT') item.absent_count += 1
    if (row.status === 'LEAVE') item.leave_count += 1
  })

  return Array.from(baseMap.values()).map((item) => ({
    ...item,
    remaining_count: Math.max(0, item.total_students - item.checked_students),
  }))
}

export const getExistingHomeroomAttendance = async (date: string, classroomId: string) => {
  const { data, error } = await supabase
    .from('homeroom_attendance')
    .select('student_id, status')
    .eq('attendance_date', date)
    .in(
      'student_id',
      (
        await supabase
          .from('students')
          .select('id')
          .eq('classroom_id', classroomId)
      ).data?.map((s: any) => s.id) || []
    )
  if (error) throw error
  return data || []
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
