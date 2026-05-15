import { supabase } from '../lib/supabase'

export interface Teacher {
  id: string
  teacher_code: string
  first_name: string
  last_name: string
  phone: string
  email: string
  department: string
}

export const getTeachers = async () => {
  const { data, error } = await supabase.from('teachers').select('*').order('first_name')
  if (error) throw error
  return data as Teacher[]
}

export const createTeacher = async (teacher: Omit<Teacher, 'id'>) => {
  const { data, error } = await supabase.from('teachers').insert(teacher).select().single()
  if (error) throw error
  return data as Teacher
}

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase.from('teachers').delete().eq('id', id)
  if (error) throw error
}
