import { supabase } from '../lib/supabase'

export interface Student {
  id: string
  student_code: string
  prefix?: string
  first_name: string
  last_name: string
  nickname: string
  gender?: string | null
  updated_at?: string
  deleted_at?: string
  classroom_id?: string
  classroom?: {
    level: string
    room: string
  }
  home_visits?: {
    id: string
    status: string
    home_visit_assessments?: { risk_level: string }[]
  }[]
}

export const getStudents = async (academicYearId?: string) => {
  let selectStr = `
    id, student_code, prefix, first_name, last_name, nickname, classroom_id, gender,
    classroom:classroom_id (level, room, academic_year_id),
    home_visits (
      id, status,
      home_visit_assessments ( risk_level )
    )
  `
  
  if (academicYearId) {
    selectStr = `
      id, student_code, prefix, first_name, last_name, nickname, classroom_id, gender,
      classroom:classroom_id!inner(level, room, academic_year_id),
      home_visits (
        id, status,
        home_visit_assessments ( risk_level )
      )
    `
  }

  let query = supabase
    .from('students')
    .select(selectStr)
    .is('deleted_at', null)
  
  if (academicYearId) {
    query = query.eq('classroom.academic_year_id', academicYearId)
  }

  const { data, error } = await query.order('student_code')
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

export const findStudentByCode = async (studentCode: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, deleted_at')
    .eq('student_code', studentCode)
    .maybeSingle()
  if (error) throw error
  return data as Pick<Student, 'id' | 'student_code' | 'prefix' | 'first_name' | 'last_name' | 'deleted_at'> | null
}

export const findStudentsByCodes = async (studentCodes: string[]) => {
  if (studentCodes.length === 0) return []
  const { data, error } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, deleted_at')
    .in('student_code', studentCodes)
  if (error) throw error
  return (data || []) as Pick<Student, 'id' | 'student_code' | 'prefix' | 'first_name' | 'last_name' | 'deleted_at'>[]
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

export const promoteClassroomStudents = async (sourceClassroomId: string, targetClassroomId: string) => {
  const { data, error } = await supabase
    .from('students')
    .update({ 
      classroom_id: targetClassroomId || null,
      updated_at: new Date().toISOString() 
    })
    .eq('classroom_id', sourceClassroomId)
    .is('deleted_at', null)
    
  if (error) throw error
  return data
}
