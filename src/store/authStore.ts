import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  role: string | null
  isLoading: boolean
  setUser: (user: User | null, session: Session | null) => void
  fetchRole: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  setUser: (user, session) => set({ user, session, isLoading: false }),
  fetchRole: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    
    if (data && !error) {
      set({ role: data.role })
    }
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, role: null })
  }
}))

export const useAuth = () => {
  const { user, role, isLoading, signOut } = useAuthStore()
  return {
    user,
    role,
    isLoading,
    signOut,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN',
    isTeacher: role === 'TEACHER' || role === 'ADVISOR',
    isParent: role === 'PARENT',
    isStudent: role === 'STUDENT'
  }
}
