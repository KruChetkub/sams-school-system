import { supabase } from '../lib/supabase'

export interface LeaveRequest {
  id?: string
  student_id: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  attachment_url?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export const getLeaveRequests = async () => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      students (
        id,
        student_code,
        first_name,
        last_name,
        classrooms (
          level,
          room
        )
      )
    `)
    .order('start_date', { ascending: false })
  
  if (error) throw error
  return data
}

export const submitLeaveRequest = async (request: LeaveRequest) => {
  const { data, error } = await supabase.from('leave_requests').insert(request).select().single()
  if (error) throw error
  return data
}

export const updateLeaveStatus = async (id: string, status: 'APPROVED' | 'REJECTED', teacherId?: string) => {
  const updateData: any = { status }
  // Only update approved_by if teacherId is provided (in real app, use logged in teacher's ID)
  if (teacherId) updateData.approved_by = teacherId
  
  const { error } = await supabase
    .from('leave_requests')
    .update(updateData)
    .eq('id', id)
    
  if (error) throw error
}
