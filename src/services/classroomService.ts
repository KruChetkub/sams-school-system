import { supabase } from '../lib/supabase'

export interface Classroom {
  id: string
  level: string
  room: string
  academic_year_id?: string
  advisor_id?: string
  subject_teacher_id?: string
  advisor?: {
    first_name: string
    last_name: string
  }
  subject_teacher?: {
    first_name: string
    last_name: string
  }
}

export const getClassrooms = async () => {
  const { data, error } = await supabase
    .from('classrooms')
    .select(`
      *,
      advisor:advisor_id (first_name, last_name),
      subject_teacher:subject_teacher_id (first_name, last_name)
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

export const updateClassroom = async (id: string, classroom: Partial<Omit<Classroom, 'id' | 'advisor' | 'subject_teacher'>>) => {
  // แปลงค่า advisor_id/subject_teacher_id ให้เป็น null หากว่างเปล่า เพื่อไม่ให้เกิด error กับ foreign key ใน supabase
  const updateData = { ...classroom };
  if (updateData.advisor_id === '') {
    updateData.advisor_id = null as any;
  }
  if (updateData.subject_teacher_id === '') {
    updateData.subject_teacher_id = null as any;
  }
  
  const { data, error } = await supabase.from('classrooms').update(updateData).eq('id', id).select().single()
  if (error) throw error
  return data as Classroom
}
