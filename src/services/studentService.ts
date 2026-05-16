import { supabase } from '../lib/supabase'

export interface Student {
  id: string
  student_code: string
  prefix?: string
  first_name: string
  last_name: string
  nickname: string
  updated_at?: string
  deleted_at?: string
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
      id, student_code, prefix, first_name, last_name, nickname, classroom_id,
      classroom:classroom_id (level, room)
    `)
    .is('deleted_at', null)
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
  const { data, error } = await supabase
    .from('students')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Student
}

export const updateStudent = async (id: string, student: Omit<Student, 'id' | 'classroom'>) => {
  const { data, error } = await supabase
    .from('students')
    .update({ ...student, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Student
}
