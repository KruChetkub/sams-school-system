import { supabase } from '../lib/supabase'

export interface AppUser {
  id: string
  email: string
  role: string
  created_at: string
  is_admin_allowed?: boolean
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

export const adminCreateUser = async (email: string, password: string, role: string, isAdminAllowed: boolean = false) => {
  const { data, error } = await supabase.rpc('admin_create_user', {
    u_email: email,
    u_password: password,
    u_role: role,
    u_is_admin_allowed: isAdminAllowed
  })
  
  if (error) throw error
  return data
}

export const adminUpdateUser = async (userId: string, email: string, password?: string | null, role?: string, isAdminAllowed: boolean = false) => {
  const { data, error } = await supabase.rpc('admin_update_user', {
    u_id: userId,
    u_email: email,
    u_password: password || null,
    u_role: role,
    u_is_admin_allowed: isAdminAllowed
  })
  
  if (error) throw error
  return data
}

export const adminDeleteUser = async (userId: string) => {
  const { data, error } = await supabase.rpc('admin_delete_user', {
    u_id: userId
  })
  
  if (error) throw error
  return data
}

