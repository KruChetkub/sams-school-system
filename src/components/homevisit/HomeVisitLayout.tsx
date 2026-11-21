import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useAcademicYearStore } from '../../store/academicYearStore'
import { supabase } from '../../lib/supabase'
import { samsConfirm } from '../common/SamsDialog'
import { Users, LayoutDashboard, Menu, X, ArrowLeft, LogOut, Globe, Sun, Moon, FileSpreadsheet, FileText, Filter } from 'lucide-react'

const translations = {
  th: {
    title: 'ระบบเยี่ยมบ้าน',
    dashboard: 'ภาพรวม (Dashboard)',
    students: 'รายชื่อนักเรียน',
    analysis: 'วิเคราะห์สรุปการเยี่ยมบ้าน (Excel)',
    summary: 'สรุปการเยี่ยมบ้านนักเรียน (Word)',
    switchApp: 'สลับแอปพลิเคชัน',
    logout: 'ออกจากระบบ',
    admin: 'แอดมิน',
    user: 'ผู้ใช้งาน'
  },
  en: {
    title: 'Home Visit System',
    dashboard: 'Dashboard Overview',
    students: 'Student Roster',
    analysis: 'Home Visit Analysis (Excel)',
    summary: 'Home Visit Summary (Word)',
    switchApp: 'Switch Application',
    logout: 'Sign Out',
    admin: 'Admin',
    user: 'User'
  }
}

const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/homevisit/dashboard' || location.pathname === '/homevisit/dashboard');

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shadow-sm border border-emerald-100 dark:border-emerald-900/50' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'} />
      {children}
    </Link>
  )
}

export default function HomeVisitLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuthStore()
  const queryClient = useQueryClient()
  const {
    years,
    selectedYear,
    selectedSemester,
    initializeStore,
    setSelectedYear,
    setSelectedSemester
  } = useAcademicYearStore()
  const location = useLocation()
  const isFormPage = location.pathname.includes('/homevisit/visit/')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [teacherDisplayName, setTeacherDisplayName] = useState('')

  useEffect(() => {
    if (years.length === 0) {
      initializeStore()
    }
  }, [years.length, initializeStore])

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId)
    queryClient.invalidateQueries()
  }

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId)
    queryClient.invalidateQueries()
  }

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
  const userDisplayName = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? t.admin : (teacherDisplayName || (user?.email ? user.email.split('@')[0] : t.user))

  const closeSidebar = () => setIsSidebarOpen(false)

  const handleLogout = async () => {
    const confirmed = await samsConfirm({
      title: lang === 'th' ? 'ยืนยันการออกจากระบบ' : 'Confirm Sign Out',
      message: lang === 'th' ? 'คุณต้องการออกจากระบบใช่หรือไม่?' : 'Are you sure you want to sign out?',
      confirmText: t.logout,
      cancelText: lang === 'th' ? 'ยกเลิก' : 'Cancel',
      variant: 'danger'
    })
    if (!confirmed) return
    await signOut()
  }

  useEffect(() => {
    const loadTeacherName = async () => {
      if (!user?.id || role === 'ADMIN' || role === 'SUPER_ADMIN') {
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
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 home-visit-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl lg:shadow-sm border-r border-gray-100 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 tracking-tight">{t.title}</h2>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Academic Year & Semester Selector */}
        <div className="px-5 py-4 border-b border-gray-150 dark:border-slate-800/80 bg-gradient-to-r from-emerald-50/30 via-teal-50/20 to-emerald-50/30 dark:from-emerald-950/20 dark:to-slate-900/20 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-bold tracking-wide">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'th' ? 'เลือกปีการศึกษา / ภาคเรียน' : 'Academic Year / Semester'}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="relative">
              <select
                value={selectedYear?.id || ''}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-7 py-2 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-150 transition cursor-pointer appearance-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {lang === 'th' ? `ปีการศึกษา ${y.year}` : `Year ${y.year}`} {y.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedSemester?.id || ''}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-7 py-2 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-150 transition cursor-pointer appearance-none"
                disabled={!selectedYear}
              >
                {selectedYear?.semesters?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || (lang === 'th' ? `ภาคเรียนที่ ${s.semester_number}` : `Semester ${s.semester_number}`)} {s.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/homevisit/dashboard" icon={LayoutDashboard} onClick={closeSidebar}>{t.dashboard}</NavItem>
          <NavItem to="/homevisit/students" icon={Users} onClick={closeSidebar}>{t.students}</NavItem>
          <NavItem to="/homevisit/analysis" icon={FileSpreadsheet} onClick={closeSidebar}>{t.analysis}</NavItem>
          <NavItem to="/homevisit/summary" icon={FileText} onClick={closeSidebar}>{t.summary}</NavItem>
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
          <Link to="/portal" className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={18} /> {t.switchApp}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-white dark:bg-slate-800 border border-red-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-slate-750 rounded-xl transition-all shadow-sm cursor-pointer">
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        {!isFormPage && (
          <header className="lg:hidden bg-white dark:bg-slate-900 shadow-sm border-b border-gray-100 dark:border-slate-800 p-4 flex items-center gap-3 z-30 shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors">
              <Menu size={26} />
            </button>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">{t.title}</h2>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-slate-950/20 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
