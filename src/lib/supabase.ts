import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzyuuqfwzjadrrahmzbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!rawSupabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables')
}

// In the browser, use the same-origin reverse proxy (/supabase-api) to eliminate
// cross-domain requests and prevent CORS wildcard (*) alerts in security scanners (ZAP).
const isBrowser = typeof window !== 'undefined'
const supabaseUrl = isBrowser ? `${window.location.origin}/supabase-api` : rawSupabaseUrl

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
