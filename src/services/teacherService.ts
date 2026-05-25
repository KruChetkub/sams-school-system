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

export const createTeacher = async (teacher: Omit<Teacher, 'id'> & { password?: string }) => {
  if (teacher.password) {
    // ใช้งาน RPC ที่เราเพิ่งสร้างใน Supabase
    const { data, error } = await supabase.rpc('create_teacher_account', {
      t_email: teacher.email,
      t_password: teacher.password,
      t_code: teacher.teacher_code,
      t_fname: teacher.first_name,
      t_lname: teacher.last_name,
      t_dept: teacher.department,
      t_phone: teacher.phone
    })
    
    if (error) throw error
    
    const { data: newTeacher } = await supabase.from('teachers').select('*').eq('id', data).single()
    return newTeacher as Teacher
  } else {
    // กรณีไม่มีรหัสผ่าน (เพิ่มข้อมูลธรรมดา)
    const { data, error } = await supabase.from('teachers').insert(teacher).select().single()
    if (error) throw error
    return data as Teacher
  }
}

export const deleteTeacher = async (id: string) => {
  const { error } = await supabase.from('teachers').delete().eq('id', id)
  if (error) throw error
}

export const updateTeacher = async (id: string, updates: Partial<Omit<Teacher, 'id' | 'email'>>) => {
  const { data, error } = await supabase.from('teachers').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Teacher
}
