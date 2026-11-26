/**
 * @file AutoUpdateNotification.tsx
 * @description Real-time version update detector and automatic reload notifier
 * @author KruChet (https://github.com/KruChetkub)
 * @copyright 2024-2026 KruChet (KruChetkub). All rights reserved.
 */

import { useEffect, useState, useRef } from 'react'
import { RefreshCw, ArrowRight, Sparkles } from 'lucide-react'

// Injected by Vite define at build time
declare const __APP_BUILD_ID__: string

const RELOADED_VERSION_KEY = 'sams_auto_reloaded_version'

export default function AutoUpdateNotification() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [countdown, setCountdown] = useState(1)
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isReloadingRef = useRef(false)
  const detectedVersionRef = useRef<string>('')

  // Current build ID injected by Vite
  const currentBuildId = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : ''

  const purgeBrowserAndSwCacheAndReload = async (targetVersion?: string) => {
    if (isReloadingRef.current) return
    isReloadingRef.current = true

    const versionToSave = targetVersion || detectedVersionRef.current
    if (versionToSave) {
      try {
        sessionStorage.setItem(RELOADED_VERSION_KEY, versionToSave)
      } catch (_) {}
    }

    try {
      // 1. ล้าง Cache Storage ของ Service Worker / PWA ทั้งหมดทันที
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      // 2. สั่งปลด Service Worker ตัวเก่าที่จำไฟล์ index.html เดิมไว้
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(async reg => {
            try {
              await reg.unregister()
            } catch (_) {}
          })
        )
      }
      // 3. บังคับดึง HTML หน้าปัจจุบันใหม่จากเซิร์ฟเวอร์โดยตรงเพื่อทับ HTTP Disk Cache ของเบราว์เซอร์
      await fetch(window.location.pathname, {
        cache: 'reload',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      }).catch(() => {})
    } catch (_) {}

    // 4. บังคับรีโหลดหน้าเว็บใหม่พร้อม Cache-Busting
    const url = new URL(window.location.href)
    url.searchParams.set('_v', Date.now().toString())
    window.location.replace(url.toString())
  }

  const checkForUpdate = async () => {
    if (isReloadingRef.current) return

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
          detectedVersionRef.current = String(data.version)
          const alreadyTriedVersion = sessionStorage.getItem(RELOADED_VERSION_KEY)
          // ป้องกันการรีโหลดซ้ำไม่รู้จบหาก CDN ยังส่งไฟล์เก่าในเสี้ยววินาทีแรก
          if (alreadyTriedVersion === String(data.version)) {
            // ลองล้างแคชและรีโหลดอีกครั้งหลังจากผ่านไป 5 วินาที
            setTimeout(() => {
              try {
                sessionStorage.removeItem(RELOADED_VERSION_KEY)
              } catch (_) {}
            }, 5000)
            return
          }
          setHasUpdate(true)
        } else {
          // เวอร์ชันตรงกับล่าสุดแล้ว ล้างค่าป้องกันลูปได้
          try {
            sessionStorage.removeItem(RELOADED_VERSION_KEY)
          } catch (_) {}
        }
      }
    } catch (_) {
      // Ignore background fetch errors
    }
  }

  // Periodic check & event-based check (focus, visibility, SW controllerchange)
  useEffect(() => {
    if (!currentBuildId) return

    // 1. ตรวจสอบทันทีที่เปิดหน้าเว็บ (300 มิลลิวินาที)
    const initialTimer = setTimeout(checkForUpdate, 300)

    // 2. ตรวจสอบทุกๆ 10 วินาที
    checkTimerRef.current = setInterval(checkForUpdate, 10000)

    // 3. ตรวจสอบทันทีเมื่อสลับแท็บกลับมาหรือคลิกหน้าจอ
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate()
      }
    }

    // 4. ดักจับเมื่อ Service Worker ตัวใหม่เข้าควบคุมหน้าเว็บ ให้รีโหลดเป็นหน้าใหม่ทันที
    let refreshing = false
    const handleControllerChange = () => {
      if (refreshing || isReloadingRef.current) return
      refreshing = true
      void purgeBrowserAndSwCacheAndReload()
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
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
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      }
    }
  }, [currentBuildId])

  // เมื่อตรวจพบเวอร์ชันใหม่ ให้ล้างแคชและเปลี่ยนเป็นหน้าใหม่แบบ AUTO ทันที (ภายใน 1 วินาที)
  useEffect(() => {
    if (!hasUpdate) return

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          void purgeBrowserAndSwCacheAndReload(detectedVersionRef.current)
          return 0
        }
        return prev - 1
      })
    }, 800)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [hasUpdate])

  // Global Vite Chunk/Preload Error Handler (prevents blank screen on new deploy)
  useEffect(() => {
    const handlePreloadError = () => {
      void purgeBrowserAndSwCacheAndReload()
    }

    const handleError = (e: ErrorEvent) => {
      const msg = e.message || ''
      if (
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('error loading dynamically imported module')
      ) {
        void purgeBrowserAndSwCacheAndReload()
      }
    }

    window.addEventListener('vite:preloadError', handlePreloadError)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError)
      window.removeEventListener('error', handleError)
    }
  }, [])

  if (!hasUpdate) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md border border-indigo-500/40 rounded-2xl p-4 shadow-2xl shadow-indigo-950/50 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                กำลังอัปเดตหน้าเว็บเป็นเวอร์ชันใหม่...
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AUTO
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                ระบบกำลังล้างแคชเดิมและโหลดหน้าเว็บเวอร์ชันล่าสุดอัตโนมัติ ({countdown} วิ)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
            <RefreshCw size={13} className="animate-spin text-indigo-400" />
            <span>กำลังสลับไปหน้าเว็บใหม่...</span>
          </div>

          <button
            onClick={() => void purgeBrowserAndSwCacheAndReload(detectedVersionRef.current)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>อัปเดตทันที</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
