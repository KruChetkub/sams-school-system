import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Clock, AlertTriangle, LogOut, RefreshCw, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export const SESSION_CONFIG_KEYS = {
  ENABLED: 'sams_session_timeout_enabled',
  TIMEOUT_MINUTES: 'sams_session_timeout_minutes',
  WARNING_SECONDS: 'sams_session_warning_seconds',
  LAST_ACTIVITY: 'sams_last_activity_time',
  LOGOUT_REASON: 'sams_logout_reason',
  BROADCAST_LOGOUT: 'sams_broadcast_logout_event'
}

export function getSessionSettings() {
  const enabledStr = localStorage.getItem(SESSION_CONFIG_KEYS.ENABLED)
  const enabled = enabledStr === null ? true : enabledStr === 'true' // Default enabled
  const minutes = parseInt(localStorage.getItem(SESSION_CONFIG_KEYS.TIMEOUT_MINUTES) || '30', 10)
  const warningSec = parseInt(localStorage.getItem(SESSION_CONFIG_KEYS.WARNING_SECONDS) || '60', 10)
  return {
    enabled,
    timeoutMinutes: isNaN(minutes) || minutes < 1 ? 30 : minutes,
    warningSeconds: isNaN(warningSec) || warningSec < 10 ? 60 : warningSec
  }
}

export default function SessionTimeoutManager() {
  const { user, signOut } = useAuthStore()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const lastActivityRef = useRef<number>(Date.now())
  const isLoggingOutRef = useRef<boolean>(false)

  // Update last activity in state and localStorage (throttled)
  const recordActivity = useCallback(() => {
    const now = Date.now()
    if (now - lastActivityRef.current > 2000) {
      lastActivityRef.current = now
      try {
        localStorage.setItem(SESSION_CONFIG_KEYS.LAST_ACTIVITY, now.toString())
      } catch (_) {}
    }
  }, [])

  // Explicitly extend session when user clicks "Stay Logged In"
  const handleExtendSession = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    try {
      localStorage.setItem(SESSION_CONFIG_KEYS.LAST_ACTIVITY, now.toString())
    } catch (_) {}
    setShowWarning(false)
  }, [])

  // Complete logout & cleanup
  const handleLogout = useCallback(async (isTimeout: boolean = true) => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true
    setShowWarning(false)

    try {
      if (isTimeout) {
        sessionStorage.setItem(SESSION_CONFIG_KEYS.LOGOUT_REASON, 'timeout')
      }
      // Notify other tabs
      localStorage.setItem(SESSION_CONFIG_KEYS.BROADCAST_LOGOUT, Date.now().toString())
      localStorage.removeItem(SESSION_CONFIG_KEYS.LAST_ACTIVITY)
    } catch (_) {}

    try {
      await signOut()
    } catch (err) {
      console.warn('Auto logout error:', err)
    } finally {
      isLoggingOutRef.current = false
    }
  }, [signOut])

  // Setup user event listeners
  useEffect(() => {
    if (!user) return

    // Initialize activity timestamp
    const now = Date.now()
    lastActivityRef.current = now
    try {
      localStorage.setItem(SESSION_CONFIG_KEYS.LAST_ACTIVITY, now.toString())
    } catch (_) {}

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    const handler = () => recordActivity()

    events.forEach(eventName => {
      window.addEventListener(eventName, handler, { passive: true })
    })

    // Listen to localStorage changes across browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_CONFIG_KEYS.LAST_ACTIVITY && e.newValue) {
        const val = parseInt(e.newValue, 10)
        if (!isNaN(val) && val > lastActivityRef.current) {
          lastActivityRef.current = val
          setShowWarning(false)
        }
      } else if (e.key === SESSION_CONFIG_KEYS.BROADCAST_LOGOUT) {
        // Another tab logged out
        handleLogout(false)
      } else if (e.key === 'sams_trigger_test_modal') {
        // Preview/test warning modal from settings
        setShowWarning(true)
        setCountdown(60)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      events.forEach(eventName => {
        window.removeEventListener(eventName, handler)
      })
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user, recordActivity, handleLogout])

  // Interval timer check
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      const config = getSessionSettings()
      if (!config.enabled) {
        if (showWarning) setShowWarning(false)
        return
      }

      // Check cross-tab last activity
      let lastTime = lastActivityRef.current
      try {
        const stored = localStorage.getItem(SESSION_CONFIG_KEYS.LAST_ACTIVITY)
        if (stored) {
          const parsed = parseInt(stored, 10)
          if (!isNaN(parsed) && parsed > lastTime) {
            lastTime = parsed
            lastActivityRef.current = parsed
          }
        }
      } catch (_) {}

      const now = Date.now()
      const timeoutMs = config.timeoutMinutes * 60 * 1000
      const warningMs = config.warningSeconds * 1000
      const elapsed = now - lastTime
      const remainingMs = timeoutMs - elapsed
      const remainingSeconds = Math.ceil(remainingMs / 1000)

      if (remainingMs <= 0) {
        // Session expired
        handleLogout(true)
      } else if (remainingMs <= warningMs) {
        // In warning zone
        setShowWarning(true)
        setCountdown(Math.max(1, remainingSeconds))
      } else {
        // Active
        if (showWarning) setShowWarning(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [user, showWarning, handleLogout])

  if (!user || !showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 animate-pulse" />
        
        <div className="p-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-inner">
            <Clock size={34} className="animate-spin text-amber-600 [animation-duration:8s]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
            <ShieldAlert size={14} />
            <span>ระบบความปลอดภัยเซสชัน</span>
          </div>

          <h3 className="text-xl font-black text-slate-800 font-sans tracking-tight mb-2">
            เซสชันการใช้งานกำลังจะหมดอายุ
          </h3>

          <p className="text-xs text-slate-600 font-sans leading-relaxed mb-6">
            เนื่องจากไม่มีการเคลื่อนไหวหรือใช้งานหน้าจอนานเกินกำหนด เพื่อป้องกันการจดจำข้อมูลและคุกกี้ตกค้าง ระบบจะทำการล็อกเอ้าท์อัตโนมัติใน:
          </p>

          {/* Countdown display */}
          <div className="mb-6 flex justify-center items-baseline gap-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl py-4 px-6 shadow-sm">
            <span className="font-mono text-4xl font-extrabold text-amber-600 tracking-tight">
              {countdown}
            </span>
            <span className="text-sm font-bold text-amber-800 font-sans">
              วินาที
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleLogout(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs font-sans"
            >
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
            <button
              type="button"
              onClick={handleExtendSession}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 text-xs font-sans"
            >
              <RefreshCw size={16} />
              <span>ใช้งานต่อ (ขยายเวลา)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
