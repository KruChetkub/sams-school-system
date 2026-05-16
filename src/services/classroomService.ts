import { supabase } from '../lib/supabase'

export interface Classroom {
  id: string
  level: string
  room: string
  academic_year_id?: string
  advisor_id?: string
  advisor?: {
    first_name: string
    last_name: string
  }
}

export const getClassrooms = async () => {
  const { data, error } = await supabase
    .from('classrooms')
    .select(`
      *,
      advisor:advisor_id (first_name, last_name)
    `)
    .order('level')
    .order('room')
  if (error) throw error
  return data as Classroom[]
}

export const createClassroom = async (classroom: Omit<Classroom, 'id' | 'advisor'>) => {
  const { data, error } = await supabase.from('classrooms').insert(classroom).select().single()
  if (error) throw error
  return data as Classroom
}

export const deleteClassroom = async (id: string) => {
  const { error } = await supabase.from('classrooms').delete().eq('id', id)
  if (error) throw error
}
