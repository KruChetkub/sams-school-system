import { supabase } from '../lib/supabase'

export interface Subject {
  id: string
  subject_code: string
  subject_name: string
  department: string
  credit: number
  teacher_id?: string
  academic_year_id?: string
  semester_id?: string
  teacher?: {
    first_name: string
    last_name: string
  }
}

export const getSubjects = async (academicYearId?: string, semesterId?: string) => {
  let query = supabase
    .from('subjects')
    .select(`
      id, subject_code, subject_name, department, credit, teacher_id, academic_year_id, semester_id,
      teacher:teacher_id (first_name, last_name)
    `)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }
  if (semesterId) {
    query = query.eq('semester_id', semesterId)
  }

  const { data, error } = await query.order('subject_code')
  if (error) throw error
  return data as unknown as Subject[]
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

export const cloneSubjects = async (
  sourceSemesterId: string,
  targetSemesterId: string,
  targetAcademicYearId: string
) => {
  const sourceSubjects = await getSubjects(undefined, sourceSemesterId)
  if (!sourceSubjects || sourceSubjects.length === 0) return 0

  const targetSubjects = await getSubjects(undefined, targetSemesterId)
  const existingCodes = new Set((targetSubjects || []).map(s => s.subject_code.trim().toUpperCase()))

  const toInsert = sourceSubjects
    .filter(s => !existingCodes.has(s.subject_code.trim().toUpperCase()))
    .map(s => ({
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      department: s.department,
      credit: s.credit,
      teacher_id: s.teacher_id || null,
      academic_year_id: targetAcademicYearId,
      semester_id: targetSemesterId
    }))

  if (toInsert.length === 0) return 0

  const { error: insertError } = await supabase.from('subjects').insert(toInsert)
  if (insertError) throw insertError

  return toInsert.length
}
