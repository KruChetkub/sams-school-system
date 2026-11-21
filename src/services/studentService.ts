import { supabase } from '../lib/supabase'
import { findOfficialRosterEntry, isTrackedOfficialClassroom } from '../data/m3OfficialRoster'

export interface Student {
  id: string
  student_code: string
  student_number?: number | null
  is_in_official_roster?: boolean | null
  prefix?: string
  first_name: string
  last_name: string
  nickname: string
  gender?: string | null
  updated_at?: string
  deleted_at?: string
  deleted_by?: string
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

export const getStudentGenderRank = (student?: { gender?: string | null; prefix?: string | null } | null): number => {
  if (!student) return 2
  const prefix = (student.prefix || '').trim()
  const gender = (student.gender || '').trim().toUpperCase()
  if (prefix === 'นาย' || prefix === 'เด็กชาย' || prefix === 'ด.ช.' || gender === 'MALE' || gender === 'M' || gender === 'ชาย') {
    return 0
  }
  if (prefix === 'นางสาว' || prefix === 'เด็กหญิง' || prefix === 'ด.ญ.' || prefix === 'น.ส.' || gender === 'FEMALE' || gender === 'F' || gender === 'หญิง') {
    return 1
  }
  return 2
}

export const CUSTOM_STUDENT_ORDER_KEY = 'sams_custom_student_order_v1'

export const getCustomOrderMap = (): Record<string, number> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(CUSTOM_STUDENT_ORDER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const getCustomStudentOrderNumber = (student?: {
  id?: string | null
  student_code?: string | null
  student_number?: number | null
} | null): number | null => {
  if (!student) return null
  // 1. หากมีค่า student_number จากฐานข้อมูล Supabase ให้ใช้ค่าจากฐานข้อมูลเป็นหลัก (เพื่อให้เปิดเครื่องอื่น/เวลาอื่นก็ตรงกันเสมอ)
  if (typeof student.student_number === 'number' && student.student_number > 0 && student.student_number < 900) {
    return student.student_number
  }
  // 2. Fallback จาก LocalStorage ในกรณีที่ยังไม่ได้รัน SQL เพิ่มคอลัมน์ใน Supabase
  const map = getCustomOrderMap()
  if (student.id && typeof map[`id:${student.id}`] === 'number') {
    return map[`id:${student.id}`]
  }
  const code = String(student.student_code || '').trim()
  if (code && typeof map[`code:${code}`] === 'number') {
    return map[`code:${code}`]
  }
  return null
}

export const saveCustomStudentOrderForList = async (
  orderedStudents: { id: string; student_code?: string | null }[]
): Promise<void> => {
  if (typeof window !== 'undefined') {
    const map = getCustomOrderMap()
    orderedStudents.forEach((st, idx) => {
      const no = idx + 1
      if (st.id) map[`id:${st.id}`] = no
      const code = String(st.student_code || '').trim()
      if (code) map[`code:${code}`] = no
    })
    window.localStorage.setItem(CUSTOM_STUDENT_ORDER_KEY, JSON.stringify(map))
  }

  // บันทึกลงฐานข้อมูล Supabase จริง (ผ่าน RPC save_student_order หรือ update คอลัมน์ student_number)
  try {
    const ids = orderedStudents.map((st) => st.id).filter(Boolean)
    const { error: rpcError } = await supabase.rpc('save_student_order', {
      p_student_ids: ids,
    })
    if (rpcError) {
      await Promise.all(
        orderedStudents.map((st, idx) =>
          supabase
            .from('students')
            .update({ student_number: idx + 1 } as any)
            .eq('id', st.id)
        )
      )
    }
  } catch {
    // หากยังไม่ได้รัน SQL เพิ่มคอลัมน์ student_number ใน Supabase ระบบจะเก็บใน LocalStorage สำรองไว้
  }
}

export const resetCustomStudentOrderForList = async (
  studentsToReset: { id: string; student_code?: string | null }[]
): Promise<void> => {
  if (typeof window !== 'undefined') {
    const map = getCustomOrderMap()
    studentsToReset.forEach((st) => {
      if (st.id) delete map[`id:${st.id}`]
      const code = String(st.student_code || '').trim()
      if (code) delete map[`code:${code}`]
    })
    window.localStorage.setItem(CUSTOM_STUDENT_ORDER_KEY, JSON.stringify(map))
  }
  try {
    await Promise.all(
      studentsToReset.map((st) =>
        supabase
          .from('students')
          .update({ student_number: null } as any)
          .eq('id', st.id)
      )
    )
  } catch {
    // ignore
  }
}

export const compareStudentsByRosterOrder = <
  T extends {
    id?: string | null
    student_code?: string | null
    student_number?: number | null
    is_in_official_roster?: boolean | null
    gender?: string | null
    prefix?: string | null
    first_name?: string | null
    last_name?: string | null
    classroom?: { level?: string | null; room?: string | null } | null
  }
>(a: T, b: T): number => {
  // 1. หากผู้ใช้จัดเรียงลำดับรายคนไว้ (หรือมี student_number จากฐานข้อมูล) ให้ยึดตามลำดับนั้นเป็นอันดับแรกสุด
  const customA = getCustomStudentOrderNumber(a)
  const customB = getCustomStudentOrderNumber(b)
  if (customA !== null && customB !== null && customA !== customB) {
    return customA - customB
  }
  if (customA !== null && customB === null) return -1
  if (customA === null && customB !== null) return 1

  const codeA = String(a.student_code || '').trim()
  const codeB = String(b.student_code || '').trim()
  const entryA = findOfficialRosterEntry(a, a.classroom?.level, a.classroom?.room)
  const entryB = findOfficialRosterEntry(b, b.classroom?.level, b.classroom?.room)
  const isTrackedContext =
    isTrackedOfficialClassroom(a.classroom?.level, a.classroom?.room) ||
    isTrackedOfficialClassroom(b.classroom?.level, b.classroom?.room) ||
    !!entryA ||
    !!entryB

  if (isTrackedContext) {
    // 1. นักเรียนที่มีชื่อในไฟล์ Excel อ้างอิง (ม.3/1-5, ม.4/7, ม.5/7, ม.6/7) ต้องขึ้นก่อนตามลำดับเลขที่ในไฟล์
    if (entryA && entryB) {
      if (entryA.level !== entryB.level) return entryA.level.localeCompare(entryB.level, 'th', { numeric: true })
      if (entryA.room !== entryB.room) return Number(entryA.room) - Number(entryB.room)
      return entryA.no - entryB.no
    }
    // 2. นักเรียนที่ไม่มีชื่อในไฟล์ Excel (ย้ายออก/ต้องลบ) ให้ไปอยู่ท้ายสุดของห้องเพื่อทำสัญลักษณ์แจ้งเตือน
    if (entryA && !entryB) return -1
    if (!entryA && entryB) return 1
  }

  const rankA = getStudentGenderRank(a)
  const rankB = getStudentGenderRank(b)
  if (rankA !== rankB) return rankA - rankB
  return codeA.localeCompare(codeB, undefined, { numeric: true })
}

export const getStudents = async (academicYearId?: string) => {
  const buildSelect = (withNumber: boolean) => {
    const extraCols = withNumber ? 'student_number, is_in_official_roster,' : ''
    if (academicYearId) {
      return `
        id, student_code, ${extraCols} prefix, first_name, last_name, nickname, classroom_id, gender,
        classroom:classroom_id!inner(level, room, academic_year_id),
        home_visits (
          id, status,
          home_visit_assessments ( risk_level )
        )
      `
    }
    return `
      id, student_code, ${extraCols} prefix, first_name, last_name, nickname, classroom_id, gender,
      classroom:classroom_id (level, room, academic_year_id),
      home_visits (
        id, status,
        home_visit_assessments ( risk_level )
      )
    `
  }

  const runQuery = async (withNumber: boolean) => {
    let q = supabase.from('students').select(buildSelect(withNumber)).is('deleted_at', null)
    if (academicYearId) {
      q = q.eq('classroom.academic_year_id', academicYearId)
    }
    return q.order('student_code')
  }

  let { data, error } = await runQuery(true)
  if (error && (error.code === '42703' || String(error.message || '').includes('student_number'))) {
    const fallback = await runQuery(false)
    data = fallback.data
    error = fallback.error
  }
  if (error) throw error
  return ((data || []) as unknown as Student[]).sort(compareStudentsByRosterOrder)
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

export const deleteStudent = async (id: string, deletedBy?: string) => {
  const { data, error } = await supabase
    .from('students')
    .update({ 
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy || null
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Student
}

export const restoreStudent = async (id: string) => {
  const { data, error } = await supabase
    .from('students')
    .update({ 
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Student
}

export const getDeletedStudents = async (academicYearId?: string) => {
  let selectStr = `
    id, student_code, prefix, first_name, last_name, nickname, classroom_id, gender, deleted_at, deleted_by,
    classroom:classroom_id (level, room, academic_year_id)
  `
  
  if (academicYearId) {
    selectStr = `
      id, student_code, prefix, first_name, last_name, nickname, classroom_id, gender, deleted_at, deleted_by,
      classroom:classroom_id!inner(level, room, academic_year_id)
    `
  }

  let query = supabase
    .from('students')
    .select(selectStr)
    .not('deleted_at', 'is', null)
  
  if (academicYearId) {
    query = query.eq('classroom.academic_year_id', academicYearId)
  }

  const { data, error } = await query.order('student_code')
  if (error) throw error
  return ((data || []) as Student[]).sort(compareStudentsByRosterOrder)
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

export const hardDeleteStudent = async (id: string) => {
  const { data, error } = await supabase.rpc('admin_hard_delete_student', {
    s_id: id
  })
  if (error) throw error
  return data
}

