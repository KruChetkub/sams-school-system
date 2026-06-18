import { supabase } from '../lib/supabase'

export interface Teacher {
  id: string
  teacher_code: string
  first_name: string
  last_name: string
  phone: string
  email: string
  department: string
  user_id?: string | null
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

export interface MergedTeacherUser {
  user_id: string
  email: string
  role: string
  teacher_id: string | null
  teacher_code: string
  first_name: string
  last_name: string
  phone: string
  department: string
  hasProfile: boolean
}

export const getTeachersAndUsers = async (): Promise<MergedTeacherUser[]> => {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .in('role', ['TEACHER', 'ADVISOR', 'ADMIN', 'SUPER_ADMIN'])
    
  if (usersError) throw usersError

  const { data: teachers, error: teachersError } = await supabase
    .from('teachers')
    .select('*')
    
  if (teachersError) throw teachersError

  const merged = (users || []).map((u: { id: string; email: string; role: string }) => {
    const profile = (teachers || []).find((t: Teacher) => t.user_id === u.id || t.email === u.email)
    return {
      user_id: u.id,
      email: u.email,
      role: u.role,
      teacher_id: profile?.id || null,
      teacher_code: profile?.teacher_code || '',
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      hasProfile: !!profile
    }
  })

  merged.sort((a, b) => {
    if (a.first_name && b.first_name) {
      return a.first_name.localeCompare(b.first_name)
    }
    if (a.first_name) return -1
    if (b.first_name) return 1
    return a.email.localeCompare(b.email)
  })

  return merged
}

export const createTeacherProfile = async (profile: Omit<Teacher, 'id'>) => {
  const { data, error } = await supabase
    .from('teachers')
    .insert(profile)
    .select()
    .single()
    
  if (error) throw error
  return data as Teacher
}

