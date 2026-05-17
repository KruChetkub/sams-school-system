import { supabase } from '../lib/supabase'

export interface ActivityGroup {
  id: string
  name: string
  description?: string
}

export const getActivityGroups = async () => {
  const { data, error } = await supabase
    .from('activity_groups')
    .select('id, name, description')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return (data || []) as ActivityGroup[]
}

export const getActivityMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('activity_group_members')
    .select('student_id')
    .eq('activity_group_id', groupId)
  if (error) throw error
  return (data || []).map((x: any) => x.student_id as string)
}

export const addStudentToActivity = async (groupId: string, studentId: string) => {
  const { error } = await supabase.from('activity_group_members').insert({
    activity_group_id: groupId,
    student_id: studentId,
  })
  if (error) throw error
}

export const removeStudentFromActivity = async (groupId: string, studentId: string) => {
  const { error } = await supabase
    .from('activity_group_members')
    .delete()
    .eq('activity_group_id', groupId)
    .eq('student_id', studentId)
  if (error) throw error
}
