import { supabase } from '../lib/supabase'

export interface Student {
  id: string
  student_code: string
  first_name: string
  last_name: string
  nickname: string
  classroom_id?: string
  classroom?: {
    level: string
    room: string
  }
}

export const getStudents = async () => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id, student_code, first_name, last_name, nickname, classroom_id,
      classroom:classroom_id (level, room)
    `)
    .order('student_code')
  if (error) throw error
  return data as Student[]
}

export const createStudent = async (student: Omit<Student, 'id' | 'classroom'>) => {
  const { data, error } = await supabase.from('students').insert(student).select().single()
  if (error) throw error
  return data as Student
}

export const bulkCreateStudents = async (students: Omit<Student, 'id' | 'classroom'>[]) => {
  const { data, error } = await supabase.from('students').insert(students)
  if (error) throw error
  return data
}

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}
