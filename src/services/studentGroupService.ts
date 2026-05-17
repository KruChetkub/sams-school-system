import { supabase } from '../lib/supabase'

export type GroupType = 'CLASSROOM' | 'SUBJECT'

export const getMembershipsByGroup = async (groupType: GroupType, groupId: string) => {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .select('student_id')
    .eq('group_type', groupType)
    .eq('group_id', groupId)
  if (error) throw error
  return (data || []).map((x: any) => x.student_id as string)
}

export const addMembership = async (studentId: string, groupType: GroupType, groupId: string) => {
  const { error } = await supabase.from('student_group_memberships').insert({
    student_id: studentId,
    group_type: groupType,
    group_id: groupId,
  })
  if (error) throw error
}

export const removeMembership = async (studentId: string, groupType: GroupType, groupId: string) => {
  const { error } = await supabase
    .from('student_group_memberships')
    .delete()
    .eq('student_id', studentId)
    .eq('group_type', groupType)
    .eq('group_id', groupId)
  if (error) throw error
}

export const getAllMemberships = async () => {
  const { data, error } = await supabase
    .from('student_group_memberships')
    .select('student_id, group_type, group_id')
  if (error) throw error
  return (data || []) as { student_id: string; group_type: GroupType; group_id: string }[]
}
