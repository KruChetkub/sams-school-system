import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logAuditEvent } from '../services/auditLogService'
import LottieDefault from 'lottie-react'
import animationData from '../../purple.json'

const Lottie = (LottieDefault as any).default || LottieDefault;

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
          id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
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
      if (error.message === 'Invalid login credentials') {
        setError('รหัสผ่านหรืออีเมลไม่ถูกต้อง กรุณาไปดูที่ไลน์นะครับ')
      } else {
        setError(error.message)
      }
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        user_email: email,
      })
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
      {/* Background Lottie Animation */}
      <style>{`
        @keyframes lightningDraw {
          0% { opacity: 0; stroke-dashoffset: 160; }
          20% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; stroke-dashoffset: 0; }
        }
      `}</style>
      <div className="absolute inset-0 z-0 opacity-90 pointer-events-none">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        />
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
                โรงเรียนเชียงของวิทยาคม
                <br />

              </h1>
            </div>

          </section>

          <section className="w-full rounded-[1.6rem] border border-white/40 bg-white/90 p-6 shadow-xl backdrop-blur md:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#2a1b4d]">School Portal Ckw</h2>
              <p className="mt-2 text-m text-[#5a4f70]">
                เข้าสู่ระบบ
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

            <div className="mt-6 text-center">
              <p className="text-[10px] font-semibold text-[#8b7f9d]">
                v2.3.0
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
