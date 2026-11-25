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

const clearStaleAuthStorage = () => {
  if (!isBrowser) return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {}
}

// Wrap fetch to gracefully handle expired/invalid refresh_token (400 Bad Request)
// by clearing stale sb-*-auth-token entries from localStorage immediately.
const customSupabaseFetch: typeof fetch = async (input, init) => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const response = await fetch(input, init)

  if (response.status === 400 && urlStr.includes('/auth/v1/token') && urlStr.includes('grant_type=refresh_token')) {
    clearStaleAuthStorage()
  }

  return response
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customSupabaseFetch,
  },
})


