import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzyuuqfwzjadrrahmzbp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!rawSupabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables')
}

// In local development / preview (localhost or 127.0.0.1), route through the Vite dev proxy
// (/supabase-api) to eliminate cross-origin headers during local security scanning (ZAP / Qpent).
// In production (Vercel / live domain), connect directly to Supabase over HTTPS.
const isBrowser = typeof window !== 'undefined'
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local'))

const supabaseUrl = isLocalhost ? `${window.location.origin}/supabase-api` : rawSupabaseUrl

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

