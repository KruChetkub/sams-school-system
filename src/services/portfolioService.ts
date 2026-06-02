import { supabase } from '../lib/supabase'

export interface PortfolioItem {
  id: string
  student_id: string
  category: 'ACADEMIC' | 'ACTIVITY' | 'AWARD' | 'SKILL' | 'OTHER'
  title: string
  description: string | null
  score: number | null
  grade: string | null
  certificate_url: string | null
  certificate_label: string
  date: string | null
  academic_year: string | null
  semester: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * ดึงข้อมูลผลงาน/กิจกรรมทั้งหมดของนักเรียน
 */
export const getStudentPortfolios = async (studentId: string): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('student_portfolios')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
  
  if (error) throw error
  return data as PortfolioItem[]
}

/**
 * เพิ่มผลงาน/กิจกรรมใหม่ให้นักเรียน
 */
export const createPortfolioItem = async (
  item: Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>
): Promise<PortfolioItem> => {
  const { data, error } = await supabase
    .from('student_portfolios')
    .insert({
      ...item,
      certificate_label: item.certificate_label || 'ผลงาน'
    })
    .select()
    .single()
  
  if (error) throw error
  return data as PortfolioItem
}

/**
 * แก้ไขผลงาน/กิจกรรมของนักเรียน
 */
export const updatePortfolioItem = async (
  id: string,
  updates: Partial<Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at'>>
): Promise<PortfolioItem> => {
  const { data, error } = await supabase
    .from('student_portfolios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as PortfolioItem
}

/**
 * ลบผลงาน/กิจกรรมของนักเรียน
 */
export const deletePortfolioItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('student_portfolios')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

/**
 * สรุปจำนวนผลงานของนักเรียนแยกตามหมวดหมู่
 */
export const getPortfolioSummary = async (studentId: string) => {
  const { data, error } = await supabase
    .from('student_portfolios')
    .select('category')
    .eq('student_id', studentId)
  
  if (error) throw error

  const summary = {
    ACADEMIC: 0,
    ACTIVITY: 0,
    AWARD: 0,
    SKILL: 0,
    OTHER: 0,
    total: 0
  }

  data?.forEach((item: any) => {
    const cat = item.category as keyof typeof summary
    if (summary[cat] !== undefined) {
      summary[cat] += 1
    }
    summary.total += 1
  })

  return summary
}
