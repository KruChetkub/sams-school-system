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

const RELOADED_VERSION_KEY = 'sams_auto_reloaded_version'

export default function AutoUpdateNotification() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isDismissed, setIsDismissed] = useState(false)
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
      // 1. ล้าง Cache Storage ของ Service Worker / PWA (ห้าม unregister service worker เพื่อไม่ให้เกิด controllerchange loop)
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      // 2. สั่งให้อัปเดต Service Worker ตัวใหม่ (ถ้ามี) โดยไม่ปลดการลงทะเบียน
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(async reg => {
            try {
              await reg.update()
            } catch (_) {}
          })
        )
      }
      // 3. บังคับดึง HTML หน้าปัจจุบันใหม่จากเซิร์ฟเวอร์โดยตรง
      await fetch(window.location.pathname, {
        cache: 'reload',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      }).catch(() => {})
    } catch (_) {}

    // 4. รีโหลดหน้าเว็บ 1 ครั้ง
    window.location.reload()
  }

  const checkForUpdate = async () => {
    // ไม่ทำงานในโหมด Dev (localhost) เพื่อไม่ให้ตีกับตอนรัน npm run build
    if (import.meta.env.DEV) return
    if (isDismissed || isReloadingRef.current) return

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
        const remoteVersion = String(data.version)
        if (remoteVersion !== currentBuildId) {
          // หากเคยสั่งรีโหลดสำหรับเวอร์ชันนี้ไปแล้วในเซสชันนี้ ห้ามรีโหลดซ้ำเด็ดขาด (ป้องกันการรีเฟรชวนลูป 100%)
          try {
            const alreadyReloadedForVersion = sessionStorage.getItem(RELOADED_VERSION_KEY)
            if (alreadyReloadedForVersion === remoteVersion) {
              return
            }
          } catch (_) {}

          detectedVersionRef.current = remoteVersion
          setHasUpdate(true)
        }
      }
    } catch (_) {
      // Ignore background fetch errors
    }
  }

  // Periodic check & event-based check (focus, visibility)
  useEffect(() => {
    if (!currentBuildId || import.meta.env.DEV) return

    // 1. ตรวจสอบหลังเปิดหน้าเว็บ 3 วินาที
    const initialTimer = setTimeout(checkForUpdate, 3000)

    // 2. ตรวจสอบทุกๆ 30 วินาที
    checkTimerRef.current = setInterval(checkForUpdate, 30000)

    // 3. ตรวจสอบเมื่อสลับแท็บกลับมา
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate()
      }
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

  // เมื่อตรวจพบเวอร์ชันใหม่ นับถอยหลัง 5 วินาทีแล้วรีโหลด 1 ครั้ง
  useEffect(() => {
    if (!hasUpdate || isDismissed) return

    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          void purgeBrowserAndSwCacheAndReload(detectedVersionRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [hasUpdate, isDismissed])

  if (!hasUpdate || isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      if (detectedVersionRef.current) {
        sessionStorage.setItem(RELOADED_VERSION_KEY, detectedVersionRef.current)
      }
    } catch (_) {}
  }

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
                มีอัปเดตระบบเวอร์ชันใหม่!
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AUTO
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                ระบบจะอัปเดตหน้าเว็บเป็นเวอร์ชันล่าสุดใน {countdown} วินาที
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="ปิดการแจ้งเตือน"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-indigo-300 font-medium flex items-center gap-1.5">
            <RefreshCw size={13} className="animate-spin text-indigo-400" />
            <span>จะรีโหลดอัตโนมัติใน {countdown} วิ</span>
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
