import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { logAuditEvent } from './services/auditLogService'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Teachers from './pages/Teachers'
import Classrooms from './pages/Classrooms'
import Students from './pages/Students'
import Subjects from './pages/Subjects'
import Schedules from './pages/Schedules'
import Homeroom from './pages/Homeroom'
import Attendance from './pages/Attendance'
import Dashboard from './pages/Dashboard'
import Parents from './pages/Parents'
import QRSession from './pages/QRSession'
import StudentScan from './pages/StudentScan'
import LeaveRequests from './pages/LeaveRequests'
import ParentDashboard from './pages/ParentDashboard'
import AppSettings from './pages/Settings' // Renamed import to avoid conflict with lucide Settings icon
import Reports from './pages/Reports'
import Portal from './pages/portal/Portal'
import HomeVisitDashboard from './pages/homevisit/Dashboard'
import HomeVisitStudents from './pages/homevisit/StudentsList'
import HomeVisitForm from './pages/homevisit/VisitForm'
import HomeVisitLayout from './components/homevisit/HomeVisitLayout'

// Student Support System (SAMS v13)
import StudentSupportPortal from './pages/studentsupport/index'
import SdqForm from './pages/studentsupport/SdqForm'
import EqForm from './pages/studentsupport/EqForm'
import Student360 from './pages/studentsupport/Student360'
import CaseManagement from './pages/studentsupport/CaseManagement'
import StudentSupportLayout from './components/studentsupport/StudentSupportLayout'
import StudentSupportStudents from './pages/studentsupport/StudentSupportStudents'

// New Features (SAMS Phase 1)
import AcademicYears from './pages/AcademicYears'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentPortfolio from './pages/StudentPortfolio'

import { useQueryClient } from '@tanstack/react-query'
import { useAcademicYearStore } from './store/academicYearStore'

import { LogOut, Users, Home, Settings, BookOpen, GraduationCap, Library, Calendar, CheckSquare, ClipboardCheck, HeartHandshake, QrCode, ScanLine, FileText, LayoutDashboard, Menu, X, AlertCircle, PieChart, AppWindow, CalendarRange, Filter } from 'lucide-react'

// NavItem Component to handle active state and auto-close
const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100' : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium'}`}
    >
      <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
      {children}
    </Link>
  )
}

// Layout Component
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user, role } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [teacherDisplayName, setTeacherDisplayName] = useState('')
  const userDisplayName = teacherDisplayName || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้งาน')

  const queryClient = useQueryClient()
  const { 
    years, 
    selectedYear, 
    selectedSemester, 
    initializeStore, 
    setSelectedYear, 
    setSelectedSemester 
  } = useAcademicYearStore()

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId)
    queryClient.invalidateQueries()
  }

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId)
    queryClient.invalidateQueries()
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  const handleLogout = async () => {
    setShowLogoutModal(false)
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

  useEffect(() => {
    const loadTeacherName = async () => {
      if (!user?.id) {
        setTeacherDisplayName('')
        return
      }
      const { data } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim()
        setTeacherDisplayName(fullName)
      } else {
        setTeacherDisplayName('')
      }
    }
    loadTeacherName()
  }, [user?.id, role])

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ backgroundColor: 'var(--app-bg, #f3f4f6)' }}>
      {/* Logout Confirmation Modal */}
      {isSigningOut && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4">
          <div className="rounded-3xl border border-white/35 bg-white/20 px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/35 border-t-white" />
            <p className="text-lg font-bold text-white">กำลังออกจากระบบ...</p>
            <p className="mt-1 text-sm text-white/80">กำลังปิดเซสชันผู้ใช้งาน</p>
          </div>
        </div>
      )}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-[#fff9e6] rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border-[6px] border-[#ffb700] animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#ffb700] rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-white">
                <AlertCircle size={40} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">ออกจากระบบ</h3>
              <p className="text-gray-600 font-medium mb-8">คุณต้องการออกจากระบบใช่หรือไม่?</p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-white border-2 border-gray-100 text-gray-600 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-fit"
                >
                  <X size={18} strokeWidth={3} className="flex-shrink-0" /> ยกเลิก
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-[#ea3b3b] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#d42d2d] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap min-w-fit"
                >
                  <CheckSquare size={18} strokeWidth={3} className="flex-shrink-0" /> ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white shadow-2xl lg:shadow-sm border-r border-gray-100 flex flex-col
        transform transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">SAMS</h2>
            {role === 'ADMIN' || role === 'SUPER_ADMIN' ? (
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">
                {role === 'SUPER_ADMIN' ? 'Super Admin Portal' : 'Admin Portal'}
              </p>
            ) : (
              <p className="text-xs text-gray-600 font-semibold mt-1">ยินดีต้อนรับ {userDisplayName}</p>
            )}
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        {/* Academic Year Selector (Premium Design) */}
        {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
          <div className="px-5 py-4 border-b border-gray-150 bg-gradient-to-r from-pink-50/20 via-indigo-50/10 to-blue-50/20 space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold tracking-wide">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>เลือกปีการศึกษา / ภาคเรียน</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={selectedYear?.id || ''}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-150 transition cursor-pointer appearance-none"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      ปี {y.year} {y.is_active ? ' (ปัจจุบัน)' : ''}
                    </option>
                  ))}
                  {years.length === 0 && <option value="">กำลังโหลด...</option>}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedSemester?.id || ''}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-150 transition cursor-pointer appearance-none"
                  disabled={!selectedYear}
                >
                  {selectedYear?.semesters?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label || `ภาคเรียนที่ ${s.semester_number}`} {s.is_active ? ' (ปัจจุบัน)' : ''}
                    </option>
                  ))}
                  {selectedYear && (!selectedYear.semesters || selectedYear.semesters.length === 0) && (
                    <option value="">ยังไม่มีภาคเรียน</option>
                  )}
                  {!selectedYear && <option value="">เลือกปีการศึกษา</option>}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/" icon={Home} onClick={closeSidebar}>หน้าหลัก</NavItem>

          {/* เมนูใช้งานรายวัน (สำหรับครูและแอดมิน) */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <>
              <NavItem to="/homeroom" icon={CheckSquare} onClick={closeSidebar}>เช็คชื่อเข้าแถว</NavItem>
              <NavItem to="/attendance" icon={ClipboardCheck} onClick={closeSidebar}>เช็คชื่อรายวิชา</NavItem>
            </>
          )}

          {/* เมนูจัดการข้อมูล (แยกหมวดหมู่) */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <>
                  <NavItem to="/teachers" icon={Users} onClick={closeSidebar}>จัดการบุคลากร</NavItem>
                  <NavItem to="/classrooms" icon={BookOpen} onClick={closeSidebar}>จัดการห้องเรียน</NavItem>
                  <NavItem to="/subjects" icon={Library} onClick={closeSidebar}>จัดการวิชาเรียน</NavItem>
                  <NavItem to="/students" icon={GraduationCap} onClick={closeSidebar}>จัดการข้อมูลนักเรียน</NavItem>
                  <NavItem to="/schedules" icon={Calendar} onClick={closeSidebar}>จัดการตารางเรียน</NavItem>
                </>
              )}
              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <NavItem to="/parents" icon={HeartHandshake} onClick={closeSidebar}>จัดการข้อมูลผู้ปกครอง</NavItem>
              )}
            </div>
          )}

          {/* ตั้งค่าระบบ */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <NavItem to="/academic-years" icon={CalendarRange} onClick={closeSidebar}>ปีการศึกษา</NavItem>
              <NavItem to="/settings" icon={Settings} onClick={closeSidebar}>ตั้งค่าระบบ</NavItem>
            </div>
          )}

          {/* รายงานสรุป — แสดงทั้ง ADMIN และ TEACHER ที่ล่างสุด */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <div className="pt-3 mt-3 border-t border-gray-100">
              <NavItem to="/reports" icon={PieChart} onClick={closeSidebar}>รายงานสรุป</NavItem>
            </div>
          )}
        </nav>
        <div className="p-5 border-t border-gray-100" style={{ backgroundColor: 'color-mix(in oklab, var(--app-bg, #f3f4f6) 70%, white)' }}>
          <div className="mb-5 px-2">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
            <p className="text-xs text-blue-600 font-semibold mt-1 capitalize">{role?.toLowerCase() || 'Loading...'}</p>
          </div>
          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
          >
            <AppWindow size={18} /> สลับแอปพลิเคชัน
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all shadow-sm"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-100 p-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
            >
              <Menu size={26} />
            </button>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">SAMS</h2>
          </div>
        </header>

        {/* Scrollable Content */}
        <div id="main-scroll-container" className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--app-bg, #f3f4f6)' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

const RootDashboard = () => {
  const { role } = useAuthStore()
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return <Dashboard />
  if (role === 'TEACHER' || role === 'ADVISOR') return <TeacherDashboard />
  if (role === 'PARENT') return <ParentDashboard />
  if (role === 'STUDENT') return <Navigate to="/studentscan" replace />
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  )
}

function App() {
  const { user, role, setUser, fetchRole, isLoading } = useAuthStore()

  useEffect(() => {
    const applyTheme = async () => {
      const localTheme = localStorage.getItem('sams_theme_bg') || '#f3f4f6'
      document.documentElement.style.setProperty('--app-bg', localTheme)
      document.documentElement.style.setProperty('--app-bg-image', 'none')

      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        const hasThemeBg = !!(data && Object.prototype.hasOwnProperty.call(data, 'theme_bg'))
        if (hasThemeBg && data?.theme_bg && /^#([0-9A-Fa-f]{6})$/.test(data.theme_bg)) {
          localStorage.setItem('sams_theme_bg', data.theme_bg)
          document.documentElement.style.setProperty('--app-bg', data.theme_bg)
          document.documentElement.style.setProperty('--app-bg-image', 'none')
        } else if (hasThemeBg && data?.theme_bg && String(data.theme_bg).startsWith('grad_')) {
          const gradientMap: Record<string, { image: string; fallback: string }> = {
            grad_dawn: { image: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fee2e2 100%)', fallback: '#fff7ed' },
            grad_ocean: { image: 'linear-gradient(135deg, #ecfeff 0%, #e0f2fe 50%, #e0e7ff 100%)', fallback: '#ecfeff' },
            grad_forest: { image: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfccb 100%)', fallback: '#f0fdf4' },
            grad_midnight: { image: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #111827 100%)', fallback: '#111827' },
            grad_royal: { image: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 45%, #1e1b4b 100%)', fallback: '#312e81' },
            grad_ember: { image: 'linear-gradient(135deg, #3f1d1d 0%, #7c2d12 50%, #1f2937 100%)', fallback: '#3f1d1d' },
            grad_aurora: { image: 'linear-gradient(135deg, #052e16 0%, #164e63 48%, #1e293b 100%)', fallback: '#0f172a' },
          }
          const gradient = gradientMap[data.theme_bg]
          if (gradient) {
            localStorage.setItem('sams_theme_bg', data.theme_bg)
            document.documentElement.style.setProperty('--app-bg', gradient.fallback)
            document.documentElement.style.setProperty('--app-bg-image', gradient.image)
          }
        }
      }
    }
    applyTheme()
  }, [user?.id])

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Session retrieval warning (signing out locally):', error.message)
          try {
            await supabase.auth.signOut({ scope: 'local' })
          } catch (_) {}
          // Clear any leftover localStorage keys starting with sb- to prevent future refresh token loops
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
              localStorage.removeItem(key)
            }
          }
          if (isMounted) setUser(null, null)
          return
        }
        if (isMounted) {
          setUser(session?.user ?? null, session)
          if (session?.user) {
            fetchRole(session.user.id)
          } else {
            setUser(null, null)
          }
        }
      } catch (err: any) {
        console.warn('Auth initialization exception, signing out locally:', err?.message || err)
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (_) {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key)
          }
        }
        if (isMounted) setUser(null, null)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setUser(null, null)
          sessionStorage.removeItem('sams_logged_in_success')
        }
        return
      }

      if (isMounted) {
        setUser(session.user, session)
        fetchRole(session.user.id)
        if (event === 'SIGNED_IN') {
          const hasLoggedSuccess = sessionStorage.getItem('sams_logged_in_success')
          if (!hasLoggedSuccess) {
            sessionStorage.setItem('sams_logged_in_success', 'true')
            logAuditEvent({
              action: 'LOGIN_SUCCESS',
              user_id: session.user.id,
              user_email: session.user.email,
            }).catch(console.error)
          }
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUser, fetchRole])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/portal" />} />

        <Route path="/portal" element={user ? <Portal /> : <Navigate to="/login" />} />
        <Route path="/homevisit/dashboard" element={user ? <HomeVisitLayout><HomeVisitDashboard /></HomeVisitLayout> : <Navigate to="/login" />} />
        <Route path="/homevisit/students" element={user ? <HomeVisitLayout><HomeVisitStudents /></HomeVisitLayout> : <Navigate to="/login" />} />
        <Route path="/homevisit/visit/:studentId" element={user ? <HomeVisitLayout><HomeVisitForm /></HomeVisitLayout> : <Navigate to="/login" />} />

        {/* Student Support System (SAMS v13) */}
        <Route path="/studentsupport" element={user ? <StudentSupportLayout><StudentSupportPortal /></StudentSupportLayout> : <Navigate to="/login" />} />
        <Route path="/studentsupport/students" element={user ? <StudentSupportLayout><StudentSupportStudents /></StudentSupportLayout> : <Navigate to="/login" />} />
        <Route path="/studentsupport/sdq/:studentId" element={user ? <SdqForm /> : <Navigate to="/login" />} />
        <Route path="/studentsupport/eq/:studentId" element={user ? <EqForm /> : <Navigate to="/login" />} />
        <Route path="/studentsupport/profile/:studentId" element={user ? <Student360 /> : <Navigate to="/login" />} />
        <Route path="/studentsupport/profile/:studentId/portfolio" element={user ? <StudentPortfolio /> : <Navigate to="/login" />} />
        <Route path="/studentsupport/cases" element={user ? <StudentSupportLayout><CaseManagement /></StudentSupportLayout> : <Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route path="/" element={user ? <DashboardLayout><RootDashboard /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/teachers" element={user ? <DashboardLayout><Teachers /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/classrooms" element={user ? <DashboardLayout><Classrooms /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/students" element={user && (role === 'ADMIN' || role === 'SUPER_ADMIN') ? <DashboardLayout><Students /></DashboardLayout> : <Navigate to="/" />} />
        <Route path="/parents" element={user ? <DashboardLayout><Parents /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/subjects" element={user ? <DashboardLayout><Subjects /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/schedules" element={user && (role === 'ADMIN' || role === 'SUPER_ADMIN') ? <DashboardLayout><Schedules /></DashboardLayout> : <Navigate to="/" />} />
        <Route path="/homeroom" element={user ? <DashboardLayout><Homeroom /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/attendance" element={user ? <DashboardLayout><Attendance /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <DashboardLayout><Reports /></DashboardLayout> : <Navigate to="/login" />} />

        {/* New Features Routes */}
        <Route path="/academic-years" element={user ? <DashboardLayout><AcademicYears /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/portfolio/:studentId" element={user ? <DashboardLayout><StudentPortfolio /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/studentscan" element={user ? <StudentScan /> : <Navigate to="/login" />} />

        <Route path="/leaves" element={user ? <DashboardLayout><LeaveRequests /></DashboardLayout> : <Navigate to="/login" />} />

        <Route path="/settings" element={user ? <DashboardLayout><AppSettings /></DashboardLayout> : <Navigate to="/login" />} />

        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
