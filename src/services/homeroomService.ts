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
