import { supabase } from '../lib/supabase'

export interface Semester {
  id: string
  academic_year_id: string
  semester_number: string
  label: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface AcademicYear {
  id: string
  year: string
  label: string | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
  semesters?: Semester[]
}

/**
 * ดึงข้อมูลปีการศึกษาทั้งหมด พร้อมข้อมูลภาคเรียนของปีนั้นๆ
 */
export const getAcademicYears = async (): Promise<AcademicYear[]> => {
  const { data: years, error: yearsError } = await supabase
    .from('academic_years')
    .select('*')
    .order('year', { ascending: false })
  
  if (yearsError) throw yearsError

  const { data: semesters, error: semestersError } = await supabase
    .from('semesters')
    .select('*')
    .order('semester_number', { ascending: true })
  
  if (semestersError) throw semestersError

  const semestersByYear = ((semesters || []) as Semester[]).reduce<Record<string, Semester[]>>((acc, semester) => {
    if (!acc[semester.academic_year_id]) acc[semester.academic_year_id] = []
    acc[semester.academic_year_id].push(semester)
    return acc
  }, {})
  
  return (years || []).map((year: any) => ({
    ...year,
    semesters: (semestersByYear[year.id] || []).sort((a: any, b: any) =>
      a.semester_number.localeCompare(b.semester_number)
    )
  })) as AcademicYear[]
}

/**
 * ดึงข้อมูลปีการศึกษาและภาคเรียนที่เป็น Active (ปัจจุบัน)
 */
export const getActiveAcademicYear = async () => {
  const { data: yearData, error: yearError } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  
  if (yearError) throw yearError

  const { data: semesterData, error: semesterError } = await supabase
    .from('semesters')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  
  if (semesterError) throw semesterError

  return {
    activeYear: yearData as AcademicYear | null,
    activeSemester: semesterData as Semester | null
  }
}

/**
 * สร้างปีการศึกษาใหม่ พร้อมสร้าง 2 ภาคเรียนโดยอัตโนมัติ
 */
export const createAcademicYear = async (input: {
  year: string
  label?: string
  start_date?: string | null
  end_date?: string | null
}): Promise<AcademicYear> => {
  const label = input.label || `ปีการศึกษา ${input.year}`
  const yearPayload = {
    year: input.year,
    label,
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    is_active: false
  }

  let { data, error } = await supabase
    .from('academic_years')
    .insert({ ...yearPayload, year_name: label })
    .select()
    .single()

  // รองรับฐานข้อมูลใหม่ที่ไม่มีคอลัมน์ year_name แล้ว
  if (error?.message.includes('year_name')) {
    const legacyResult = await supabase
      .from('academic_years')
      .insert(yearPayload)
      .select()
      .single()
    data = legacyResult.data
    error = legacyResult.error
  }
  
  if (error) throw error

  const yearId = data.id

  const semestersToCreate = [
    {
      academic_year_id: yearId,
      semester_number: '1',
      label: 'ภาคเรียนที่ 1',
      is_active: false
    },
    {
      academic_year_id: yearId,
      semester_number: '2',
      label: 'ภาคเรียนที่ 2',
      is_active: false
    }
  ]

  let { error: semError } = await supabase
    .from('semesters')
    .insert(semestersToCreate.map((semester) => ({
      ...semester,
      semester_name: semester.label
    })))

  // รองรับฐานข้อมูลใหม่ที่ไม่มีคอลัมน์ semester_name แล้ว
  if (semError?.message.includes('semester_name')) {
    const legacyResult = await supabase
      .from('semesters')
      .insert(semestersToCreate)
    semError = legacyResult.error
  }
  
  if (semError) throw semError

  return {
    ...data,
    semesters: semestersToCreate as Semester[]
  } as AcademicYear
}

/**
 * แก้ไขข้อมูลปีการศึกษา
 */
export const updateAcademicYear = async (
  id: string,
  updates: Partial<Omit<AcademicYear, 'id' | 'created_at' | 'semesters'>>
): Promise<AcademicYear> => {
  const { data, error } = await supabase
    .from('academic_years')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as AcademicYear
}

/**
 * ตั้งค่าให้ปีการศึกษาที่เลือกเป็น Active (ปีปัจจุบัน) และปิดปีอื่น
 */
export const setActiveYear = async (yearId: string): Promise<AcademicYear> => {
  // 1. เคลียร์ปีอื่นๆ ที่ active ให้เป็น false
  const { error: resetError } = await supabase
    .from('academic_years')
    .update({ is_active: false })
    .eq('is_active', true)
  
  if (resetError) throw resetError

  // 2. ตั้งปีที่เลือกเป็น active
  const { data, error } = await supabase
    .from('academic_years')
    .update({ is_active: true })
    .eq('id', yearId)
    .select()
    .single()
  
  if (error) throw error
  return data as AcademicYear
}

/**
 * ตั้งค่าให้ภาคเรียนที่เลือกเป็น Active (ภาคเรียนปัจจุบัน) และปิดภาคเรียนอื่น
 */
export const setActiveSemester = async (semesterId: string): Promise<Semester> => {
  // 1. เคลียร์ภาคเรียนอื่นๆ ที่ active ให้เป็น false
  const { error: resetError } = await supabase
    .from('semesters')
    .update({ is_active: false })
    .eq('is_active', true)
  
  if (resetError) throw resetError

  // 2. ตั้งภาคเรียนที่เลือกเป็น active
  const { data, error } = await supabase
    .from('semesters')
    .update({ is_active: true })
    .eq('id', semesterId)
    .select()
    .single()
  
  if (error) throw error
  return data as Semester
}

/**
 * แก้ไขรายละเอียดภาคเรียน (เช่น วันที่เริ่ม/สิ้นสุด)
 */
export const updateSemester = async (
  semesterId: string,
  updates: { start_date?: string | null; end_date?: string | null }
): Promise<Semester> => {
  const { data, error } = await supabase
    .from('semesters')
    .update(updates)
    .eq('id', semesterId)
    .select()
    .single()
  
  if (error) throw error
  return data as Semester
}

/**
 * ลบปีการศึกษา (ข้อมูลภาคเรียนของปีนั้นจะถูกลบตามเพราะ Foreign Key Cascade)
 */
export const deleteAcademicYear = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
