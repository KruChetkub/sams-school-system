import { supabase } from '../lib/supabase'

export interface Parent {
  id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  line_user_id?: string
  telegram_user_id?: string
}

export const getParents = async () => {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .order('first_name')
  if (error) throw error
  return data as Parent[]
}

export const createParent = async (parent: Omit<Parent, 'id'>) => {
  const { data, error } = await supabase.from('parents').insert(parent).select().single()
  if (error) throw error
  return data as Parent
}

export const deleteParent = async (id: string) => {
  const { error } = await supabase.from('parents').delete().eq('id', id)
  if (error) throw error
}

export const assignParentToStudent = async (studentId: string, parentId: string) => {
  const { error } = await supabase
    .from('students')
    .update({ parent_id: parentId })
    .eq('id', studentId)
  if (error) throw error
}
