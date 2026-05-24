import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const SCHOOL_NAME = ''
const SCHOOL_LOGO_PATH = '/school-logo.png'

export default function Login() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const flashTimeoutRef = useRef<number | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mouseFx, setMouseFx] = useState({ x: 0, y: 0, show: false, seed: 0 })
  const [bolts, setBolts] = useState<Array<{ id: number; d: string; core: number; glow: number; delay: number }>>([])

  const createBoltPath = (x: number, y: number, angle: number, length: number) => {
    const rad = (angle * Math.PI) / 180
    let px = x
    let py = y
    const segments = 4 + Math.floor(Math.random() * 3)
    let d = `M ${x} ${y}`

    for (let i = 1; i <= segments; i += 1) {
      const step = (length / segments) * (0.85 + Math.random() * 0.3)
      const jitter = (Math.random() - 0.5) * 18
      px += Math.cos(rad) * step + Math.cos(rad + Math.PI / 2) * jitter
      py += Math.sin(rad) * step + Math.sin(rad + Math.PI / 2) * jitter
      d += ` L ${px.toFixed(2)} ${py.toFixed(2)}`
    }

    return d
  }

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const onMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      setMouseFx((prev) => ({
        x,
        y,
        show: true,
        seed: prev.seed + 1,
      }))

      const burst = Array.from({ length: 2 + Math.floor(Math.random() * 3) }).map((_, idx) => {
        const angle = 200 + Math.random() * 140
        const length = 45 + Math.random() * 80
        return {
          id: Date.now() + idx + Math.floor(Math.random() * 10000),
          d: createBoltPath(x, y, angle, length),
          core: 1.7 + Math.random() * 1.6,
          glow: 5 + Math.random() * 4,
          delay: Math.random() * 0.07,
        }
      })
      setBolts(burst)

      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        setMouseFx((prev) => ({ ...prev, show: false }))
        setBolts([])
      }, 220)
    }

    const onLeave = () => setMouseFx((prev) => ({ ...prev, show: false }))

    node.addEventListener('mousemove', onMove)
    node.addEventListener('mouseleave', onLeave)

    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      node.removeEventListener('mousemove', onMove)
      node.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const start = Date.now()
    const minOverlayMs = 250
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    const elapsed = Date.now() - start
    if (elapsed < minOverlayMs) {
      await new Promise((resolve) => setTimeout(resolve, minOverlayMs - elapsed))
    }
    setLoading(false)
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#2a1360] p-4 md:p-8">
      {loading && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#140b2d]/55 backdrop-blur-md">
          <div className="rounded-3xl border border-white/30 bg-white/15 px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-lg font-bold text-white">กำลังเข้าสู่ระบบ...</p>
            <p className="mt-1 text-sm text-white/80">โปรดรอสักครู่</p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes orbitSlow {
          0% { transform: rotate(0deg) translateX(18px) rotate(0deg); opacity: 0.35; }
          50% { opacity: 0.9; }
          100% { transform: rotate(360deg) translateX(18px) rotate(-360deg); opacity: 0.35; }
        }
        @keyframes floatNebula {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(20px,-16px,0) scale(1.04); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes sparkPulse {
          0%, 100% { opacity: 0.5; filter: blur(0px); }
          50% { opacity: 1; filter: blur(1px); }
        }
        @keyframes lightningDraw {
          0% { opacity: 0; stroke-dashoffset: 160; }
          20% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 h-96 w-96 rounded-full bg-violet-300/40 blur-3xl" style={{ animation: 'floatNebula 10s ease-in-out infinite' }} />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl" style={{ animation: 'floatNebula 13s ease-in-out infinite reverse' }} />
        <div className="absolute -bottom-28 left-1/4 h-96 w-96 rounded-full bg-fuchsia-300/35 blur-3xl" style={{ animation: 'floatNebula 12s ease-in-out infinite' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,255,255,0.45),transparent_34%),radial-gradient(circle_at_78%_26%,rgba(243,232,255,0.36),transparent_30%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.26),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.62),rgba(99,102,241,0.54),rgba(76,29,149,0.75))]" />
        <div className="absolute left-[68%] top-[35%] h-24 w-24 rounded-full border border-white/35">
          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.9)]" />
          <div className="absolute left-1/2 top-1/2" style={{ animation: 'orbitSlow 9s linear infinite' }}>
            <div className="h-2 w-2 rounded-full bg-violet-100 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
          </div>
          <div className="absolute left-1/2 top-1/2" style={{ animation: 'orbitSlow 12s linear infinite reverse' }}>
            <div className="h-1.5 w-1.5 rounded-full bg-white/95 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      </div>
      {mouseFx.show && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <div
            key={`glow-${mouseFx.seed}`}
            className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-100/30 blur-2xl"
            style={{ left: mouseFx.x, top: mouseFx.y }}
          />
          <svg key={`bolt-${mouseFx.seed}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {bolts.map((bolt) => (
              <g key={bolt.id}>
                <path
                  d={bolt.d}
                  stroke="rgba(196,181,253,0.7)"
                  strokeWidth={bolt.glow}
                  fill="none"
                  filter="blur(5px)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="160"
                  strokeDashoffset="160"
                  style={{ animation: `lightningDraw 0.22s ease-out ${bolt.delay}s 1 both` }}
                />
                <path
                  d={bolt.d}
                  stroke="rgba(255,255,255,0.96)"
                  strokeWidth={bolt.core}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="160"
                  strokeDashoffset="160"
                  style={{ animation: `lightningDraw 0.2s ease-out ${bolt.delay}s 1 both` }}
                />
              </g>
            ))}
          </svg>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-white/20 bg-white/5 p-4 shadow-[0_20px_70px_rgba(5,5,20,0.55)] backdrop-blur-xl md:grid-cols-2 md:gap-10 md:p-8">
          <section className="hidden flex-col justify-between rounded-[1.6rem] border border-white/20 bg-black/15 p-7 text-white md:flex">
            <div>
              <div className="mb-6 flex flex-col items-center justify-center gap-3 text-center">
                <img
                  src={SCHOOL_LOGO_PATH}
                  alt="School logo"
                  className="h-38 w-38 rounded-2xl border border-white/30 bg-white/90 p-2 object-contain"
                />
                <div>
                  <p className="text-lg font-semibold text-white/95">{SCHOOL_NAME}</p>
                </div>
              </div>
              <p className="mb-3 block w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-center text-xxs tracking-[0.20em] text-white/85 mx-auto">
                ยินดีต้อนรับ             </p>
              <h1 className="text-center text-3xl font-extrabold leading-tight text-white/95">
               ระบบจัดการการเข้าเรียน
                <br />
                โรงเรียนเชียงของวิทยาคม
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white/90">เช็คชื่อรายวัน</div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white/90">รายงานเรียลไทม์</div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white/90">ดูแลนักเรียนทั้งระบบ</div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-white/90">ปลอดภัยด้วยบัญชีผู้ใช้</div>
            </div>
          </section>

          <section className="w-full rounded-[1.6rem] border border-white/40 bg-white/90 p-6 shadow-xl backdrop-blur md:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#2a1b4d]">SAMS</h2>
              <p className="mt-2 text-sm text-[#5a4f70]">
                เข้าสู่ระบบ School Attendance Management System
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#43385a]">อีเมล</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-[#2b2240] outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-200/60"
                  placeholder="name@school.ac.th"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#43385a]">รหัสผ่าน</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-violet-200 bg-white px-4 py-3 text-[#2b2240] outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-200/60"
                  placeholder="กรอกรหัสผ่านของคุณ"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
