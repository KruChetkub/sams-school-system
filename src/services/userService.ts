import { supabase } from '../lib/supabase'

export interface AppUser {
  id: string
  email: string
  role: string
  created_at: string
}

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data as AppUser[]
}

export const updateUserRole = async (userId: string, newRole: string) => {
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    
  if (error) throw error
}
