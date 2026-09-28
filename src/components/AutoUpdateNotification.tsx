/**
 * @file AutoUpdateNotification.tsx
 * @description Real-time version update detector and automatic reload notifier
 * @author KruChet (https://github.com/KruChetkub)
 * @copyright 2024-2026 KruChet (KruChetkub). All rights reserved.
 */

import { useEffect, useState, useRef } from 'react'
import { RefreshCw, ArrowRight, X, Sparkles } from 'lucide-react'

// Injected by Vite define at build time
declare const __APP_BUILD_ID__: string

export default function AutoUpdateNotification() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const [isDismissed, setIsDismissed] = useState(false)
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Current build ID injected by Vite
  const currentBuildId = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : ''

  const checkForUpdate = async () => {
    if (isDismissed) return

    try {
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      })

      if (!response.ok) return

      const data = await response.json()
      if (data && data.version && currentBuildId) {
        if (data.version !== currentBuildId) {
          setHasUpdate(true)
        }
      }
    } catch (_) {
      // Ignore background fetch errors
    }
  }

  // Periodic check & event-based check (focus, visibility)
  useEffect(() => {
    if (!currentBuildId) return

    // 1. Initial check after 10s
    const initialTimer = setTimeout(checkForUpdate, 10000)

    // 2. Periodic check every 60 seconds
    checkTimerRef.current = setInterval(checkForUpdate, 60000)

    // 3. Check on tab visibility/focus
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate()
      }
    }

    // 4. Trigger Service Worker update check if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const reg of registrations) {
          reg.update().catch(() => {})
        }
      }).catch(() => {})
    }

    window.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      clearTimeout(initialTimer)
      if (checkTimerRef.current) clearInterval(checkTimerRef.current)
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [currentBuildId, isDismissed])

  // Countdown timer when update is detected
  useEffect(() => {
    if (!hasUpdate || isDismissed) return

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          window.location.reload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [hasUpdate, isDismissed])

  // Global Vite Chunk/Preload Error Handler (prevents blank screen on new deploy)
  useEffect(() => {
    const handlePreloadError = () => {
      console.warn('Vite preload error detected, auto-reloading to fetch new assets...')
      window.location.reload()
    }

    const handleError = (e: ErrorEvent) => {
      const msg = e.message || ''
      if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('error loading dynamically imported module')
      ) {
        console.warn('Dynamic chunk error detected, reloading page...')
        window.location.reload()
      }
    }

    window.addEventListener('vite:preloadError', handlePreloadError)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError)
      window.removeEventListener('error', handleError)
    }
  }, [])

  if (!hasUpdate || isDismissed) return null

  const handleUpdateNow = () => {
    window.location.reload()
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    // Snooze for 10 minutes
    setTimeout(() => {
      setIsDismissed(false)
      setCountdown(10)
    }, 10 * 60 * 1000)
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-950/50 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                มีอัปเดตระบบเวอร์ชันใหม่!
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  New
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                ระบบตรวจพบการปรับปรุงโค้ดเวอร์ชันล่าสุด
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="เลื่อนการอัปเดตไป 10 นาที"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
            <RefreshCw size={13} className="animate-spin text-indigo-400" />
            <span>จะรีโหลดอัตโนมัติใน {countdown} วิ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              ภายหลัง
            </button>
            <button
              onClick={handleUpdateNow}
              className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>อัปเดตทันที</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
