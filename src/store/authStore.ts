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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      
      if (data && !error) {
        set({ role: data.role })
      } else {
        console.warn('User role not found or error, signing out locally:', error)
        set({ role: null, user: null, session: null })
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (_) {}
        // Clear leftover localStorage auth tokens
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (err: any) {
      console.warn('fetchRole exception, signing out locally:', err?.message || err)
      set({ role: null, user: null, session: null })
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (_) {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key)
        }
      }
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Global signOut failed, fallback to local signOut:', err)
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (_) {}
    }
    // Clean up local storage auth token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key)
      }
    }
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
