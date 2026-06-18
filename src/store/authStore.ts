import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  role: string | null
  isAdminAllowed: boolean
  isLoading: boolean
  setUser: (user: User | null, session: Session | null) => void
  fetchRole: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  isAdminAllowed: false,
  isLoading: true,
  setUser: (user, session) => set({ user, session, isLoading: false }),
  fetchRole: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, is_admin_allowed')
        .eq('id', userId)
        .maybeSingle()
      
      if (data && !error) {
        set({ role: data.role, isAdminAllowed: !!data.is_admin_allowed })
      } else {
        console.warn('User role not found or error, signing out locally:', error)
        set({ role: null, user: null, session: null, isAdminAllowed: false })
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (signOutErr) {
          console.debug('Local signOut error during fallback:', signOutErr)
        }
        // Clear leftover localStorage auth tokens
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.warn('fetchRole exception, signing out locally:', errMsg)
      set({ role: null, user: null, session: null, isAdminAllowed: false })
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (signOutErr) {
        console.debug('Local signOut error during catch:', signOutErr)
      }
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
      } catch (signOutErr) {
        console.debug('Local signOut error during signOut fallback:', signOutErr)
      }
    }
    // Clean up local storage auth token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key)
      }
    }
    set({ user: null, session: null, role: null, isAdminAllowed: false })
  }
}))

export const useAuth = () => {
  const { user, role, isAdminAllowed, isLoading, signOut } = useAuthStore()
  return {
    user,
    role,
    isLoading,
    signOut,
    isSuperAdmin: role === 'SUPER_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'SUPER_ADMIN' || isAdminAllowed === true,
    isTeacher: role === 'TEACHER' || role === 'ADVISOR',
    isParent: role === 'PARENT',
    isStudent: role === 'STUDENT'
  }
}
