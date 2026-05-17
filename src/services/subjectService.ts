import { supabase } from '../lib/supabase'

export interface Subject {
  id: string
  subject_code: string
  subject_name: string
  department: string
  credit: number
  teacher_id?: string
  teacher?: {
    first_name: string
    last_name: string
  }
}

export const getSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      id, subject_code, subject_name, department, credit, teacher_id,
      teacher:teacher_id (first_name, last_name)
    `)
    .order('subject_code')
  if (error) throw error
  return data as Subject[]
}

export const createSubject = async (subject: Omit<Subject, 'id' | 'teacher'>) => {
  const { data, error } = await supabase.from('subjects').insert(subject).select().single()
  if (error) throw error
  return data as Subject
}

export const updateSubject = async (
  id: string,
  payload: Omit<Subject, 'id' | 'teacher'>
) => {
  const { data, error } = await supabase
    .from('subjects')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Subject
}

export const deleteSubject = async (id: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
}
