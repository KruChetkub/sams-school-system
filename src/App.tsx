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

import { LogOut, Users, Home, Settings, BookOpen, GraduationCap, Library, Calendar, CheckSquare, ClipboardCheck, HeartHandshake, QrCode, ScanLine, FileText, LayoutDashboard, Menu, X, AlertCircle, PieChart, AppWindow, CalendarRange, Filter, Globe, Sun, Moon } from 'lucide-react'

const translations = {
  th: {
    home: 'หน้าหลัก',
    rollCall: 'เช็คชื่อเข้าแถว',
    attendance: 'เช็คชื่อรายวิชา',
    teachers: 'จัดการบุคลากร',
    classrooms: 'จัดการห้องเรียน',
    subjects: 'จัดการวิชาเรียน',
    students: 'จัดการข้อมูลนักเรียน',
    schedules: 'จัดการตารางเรียน',
    settings: 'ตั้งค่าระบบ',
    reports: 'รายงานสรุป',
    switchApp: 'สลับแอปพลิเคชัน',
    logout: 'ออกจากระบบ',
    academicYear: 'เลือกปีการศึกษา / ภาคเรียน',
    loading: 'กำลังโหลด...',
    welcome: 'ยินดีต้อนรับ',
    user: 'ผู้ใช้งาน',
    logoutConfirm: 'ออกจากระบบ',
    logoutQuestion: 'คุณต้องการออกจากระบบใช่หรือไม่?',
    cancel: 'ยกเลิก',
    signingOut: 'กำลังออกจากระบบ...',
    signingOutSession: 'กำลังปิดเซสชันผู้ใช้งาน',
    parents: 'จัดการข้อมูลผู้ปกครอง'
  },
  en: {
    home: 'Home Dashboard',
    rollCall: 'Homeroom Roll Call',
    attendance: 'Subject Attendance',
    teachers: 'Staff Management',
    classrooms: 'Classroom Management',
    subjects: 'Subject Management',
    students: 'Student Database',
    schedules: 'Schedule Planner',
    settings: 'System Settings',
    reports: 'Analytics Reports',
    switchApp: 'Switch Application',
    logout: 'Sign Out',
    academicYear: 'Select Academic Year / Semester',
    loading: 'Loading...',
    welcome: 'Welcome',
    user: 'User',
    logoutConfirm: 'Sign Out',
    logoutQuestion: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    signingOut: 'Signing out...',
    signingOutSession: 'Closing user session',
    parents: 'Parent Database'
  }
}

// NavItem Component to handle active state and auto-close
const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
        ? 'bg-blue-50 dark:bg-indigo-950/40 text-blue-700 dark:text-indigo-300 font-semibold shadow-sm border border-blue-100 dark:border-indigo-900/50'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-indigo-400 font-medium'
        }`}
    >
      <Icon size={20} className={isActive ? 'text-blue-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'} />
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

  // Language & Theme Sync
  const [lang, setLang] = useState<'th' | 'en'>(() => {
    return (localStorage.getItem('portal-lang') as 'th' | 'en') || 'th'
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('portal-theme') as 'light' | 'dark') || 'dark'
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('portal-theme', theme)
  }, [theme])

  // Sync state changes from localStorage (if changed in other tabs/pages)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedTheme = localStorage.getItem('portal-theme') as 'light' | 'dark'
      const storedLang = localStorage.getItem('portal-lang') as 'th' | 'en'
      if (storedTheme && storedTheme !== theme) setTheme(storedTheme)
      if (storedLang && storedLang !== lang) setLang(storedLang)
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [theme, lang])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const toggleLanguage = () => {
    const nextLang = lang === 'th' ? 'en' : 'th'
    setLang(nextLang)
    localStorage.setItem('portal-lang', nextLang)
  }

  const t = translations[lang]
  const userDisplayName = teacherDisplayName || (user?.email ? user.email.split('@')[0] : t.user)

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
    <div className="flex h-screen overflow-hidden font-sans bg-[#F8FAFC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Logout Confirmation Modal */}
      {isSigningOut && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4">
          <div className="rounded-3xl border border-white/35 bg-white/20 px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/35 border-t-white" />
            <p className="text-lg font-bold text-white">{t.signingOut}</p>
            <p className="mt-1 text-sm text-white/80">{t.signingOutSession}</p>
          </div>
        </div>
      )}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
          <div className="bg-[#fff9e6] dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden border-[6px] border-[#ffb700] dark:border-indigo-600/80 animate-in fade-in zoom-in duration-200">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#ffb700] dark:bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-white dark:border-slate-850">
                <AlertCircle size={40} className="text-white" strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t.logoutConfirm}</h3>
              <p className="text-gray-600 dark:text-slate-350 font-medium mb-8">{t.logoutQuestion}</p>

              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-fit cursor-pointer"
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
        w-72 bg-white dark:bg-slate-900 shadow-2xl lg:shadow-sm border-r border-gray-100 dark:border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">SAMS</h2>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        {/* Academic Year Selector (Premium Design) */}
        {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
          <div className="px-5 py-4 border-b border-gray-150 dark:border-slate-800/80 bg-gradient-to-r from-pink-50/20 via-indigo-50/10 to-blue-50/20 dark:from-indigo-950/10 dark:to-slate-900/10 space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold tracking-wide">
              <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{t.academicYear}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <select
                  value={selectedYear?.id || ''}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2.5 py-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-150 transition cursor-pointer appearance-none"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {lang === 'th' ? `ปี ${y.year}` : `Year ${y.year}`} {y.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                    </option>
                  ))}
                  {years.length === 0 && <option value="">{t.loading}</option>}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedSemester?.id || ''}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-2.5 py-2 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-150 transition cursor-pointer appearance-none"
                  disabled={!selectedYear}
                >
                  {selectedYear?.semesters?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label || (lang === 'th' ? `ภาคเรียนที่ ${s.semester_number}` : `Semester ${s.semester_number}`)} {s.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                    </option>
                  ))}
                  {selectedYear && (!selectedYear.semesters || selectedYear.semesters.length === 0) && (
                    <option value="">{lang === 'th' ? 'ยังไม่มีภาคเรียน' : 'No Semester'}</option>
                  )}
                  {!selectedYear && <option value="">{lang === 'th' ? 'เลือกปีการศึกษา' : 'Select Year'}</option>}
                </select>
                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/" icon={Home} onClick={closeSidebar}>{t.home}</NavItem>

          {/* เมนูใช้งานรายวัน (สำหรับครูและแอดมิน) */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <>
              <NavItem to="/homeroom" icon={CheckSquare} onClick={closeSidebar}>{t.rollCall}</NavItem>
              <NavItem to="/attendance" icon={ClipboardCheck} onClick={closeSidebar}>{t.attendance}</NavItem>
            </>
          )}

          {/* เมนูจัดการข้อมูล (แยกหมวดหมู่) */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <>
                  <NavItem to="/teachers" icon={Users} onClick={closeSidebar}>{t.teachers}</NavItem>
                  <NavItem to="/classrooms" icon={BookOpen} onClick={closeSidebar}>{t.classrooms}</NavItem>
                  <NavItem to="/subjects" icon={Library} onClick={closeSidebar}>{t.subjects}</NavItem>
                  <NavItem to="/students" icon={GraduationCap} onClick={closeSidebar}>{t.students}</NavItem>
                  <NavItem to="/schedules" icon={Calendar} onClick={closeSidebar}>{t.schedules}</NavItem>
                </>
              )}
              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <NavItem to="/parents" icon={HeartHandshake} onClick={closeSidebar}>{t.parents}</NavItem>
              )}
            </div>
          )}

          {/* ตั้งค่าระบบ */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
              <NavItem to="/academic-years" icon={CalendarRange} onClick={closeSidebar}>{t.academicYear}</NavItem>
              <NavItem to="/settings" icon={Settings} onClick={closeSidebar}>{t.settings}</NavItem>
            </div>
          )}

          {/* รายงานสรุป — แสดงทั้ง ADMIN และ TEACHER ที่ล่างสุด */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'TEACHER') && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-800">
              <NavItem to="/reports" icon={PieChart} onClick={closeSidebar}>{t.reports}</NavItem>
            </div>
          )}
        </nav>
        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20">
          <div className="flex gap-2 mb-3">
            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 border border-gray-250 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Globe size={16} />
              <span>{lang === 'th' ? 'EN' : 'TH'}</span>
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 border border-gray-250 dark:border-slate-700 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-indigo-600" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-blue-700 dark:text-indigo-300 bg-blue-50 dark:bg-indigo-950/40 border border-blue-100 dark:border-indigo-900/50 hover:bg-blue-100 dark:hover:bg-indigo-900/70 rounded-xl transition-all shadow-sm"
          >
            <AppWindow size={18} /> {t.switchApp}
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-white dark:bg-slate-800 border border-red-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-slate-750 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 rounded-xl transition-colors"
            >
              <Menu size={26} />
            </button>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">SAMS</h2>
          </div>
        </header>

        {/* Scrollable Content */}
        <div id="main-scroll-container" className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#0f172a]">
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
    let isMounted = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Session retrieval warning (signing out locally):', error.message)
          try {
            await supabase.auth.signOut({ scope: 'local' })
          } catch (_) { }
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
        } catch (_) { }
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

        {/* Public Routes */}
        <Route path="/public/sdq/:studentId" element={<SdqForm isPublic={true} />} />

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
