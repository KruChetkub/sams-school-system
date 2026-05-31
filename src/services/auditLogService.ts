import { supabase } from '../lib/supabase'

export interface AuditLogInput {
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'INSERT' | 'UPDATE' | 'DELETE'
  user_id?: string
  user_email?: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
}

// Cache IP address to avoid redundant requests during a session
let clientIp: string | null = null

const getIpAddress = async (): Promise<string> => {
  if (clientIp) return clientIp
  try {
    // ใช้ Controller หรือ AbortSignal.timeout สำหรับกำหนด Timeout ป้องกันไม่ให้แอปค้างกรณีไม่มีเน็ต
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const data = await res.json()
    clientIp = data.ip
    return clientIp || 'Unknown'
  } catch (err) {
    console.warn('Could not fetch client IP:', err)
    return 'Unknown'
  }
}

export const logAuditEvent = async (input: AuditLogInput) => {
  try {
    const ip_address = await getIpAddress()
    const user_agent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
    
    // บันทึกลงตาราง audit_logs ใน Supabase
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          action: input.action,
          user_id: input.user_id || null,
          user_email: input.user_email || null,
          table_name: input.table_name || null,
          record_id: input.record_id || null,
          old_values: input.old_values || null,
          new_values: input.new_values || null,
          ip_address,
          user_agent
        }
      ])
      
    if (error) {
      console.error('Failed to insert audit log in Supabase:', error)
    }
  } catch (err) {
    console.error('Failed to log audit event:', err)
  }
}
