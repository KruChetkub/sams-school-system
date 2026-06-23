import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Users, ShieldAlert, Menu, X, ArrowLeft, LogOut, Heart, Sparkles, Globe, Sun, Moon
} from 'lucide-react';

type StudentSupportRole = 'TEACHER' | 'EXECUTIVE' | 'ADMIN';

const normalizeRole = (role?: string | null): StudentSupportRole | null => {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'EXECUTIVE') return normalized;
  if (normalized === 'TEACHER' || normalized === 'ADVISOR') return 'TEACHER';
  return null;
};

const translations = {
  th: {
    title: 'ดูแลช่วยเหลือนักเรียน',
    stats: 'ภาพรวมสถิติโรงเรียน',
    screening: 'ภาพรวมคัดกรอง',
    individual: 'คัดกรองนักเรียนรายบุคคล',
    cases: 'จัดการเคสช่วยเหลือ',
    switchApp: 'สลับแอปพลิเคชัน',
    logout: 'ออกจากระบบ',
    admin: 'ผู้ดูแลระบบ',
    user: 'ผู้ใช้งาน'
  },
  en: {
    title: 'Student Support Care',
    stats: 'School Stats Overview',
    screening: 'Screening Overview',
    individual: 'Individual Screening',
    cases: 'Case Management',
    switchApp: 'Switch Application',
    logout: 'Sign Out',
    admin: 'Administrator',
    user: 'User'
  }
};

const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  // match active route exactly or prefix match (excluding exact dashboard / root match)
  const isActive = location.pathname === to || (to !== '/studentsupport' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-150 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)] dark:shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-medium'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-500'} />
      {children}
    </Link>
  );
};

export default function StudentSupportLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teacherDisplayName, setTeacherDisplayName] = useState('');
  const [userRole, setUserRole] = useState<StudentSupportRole | null>(normalizeRole(role));

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

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // ดึงชื่อคุณครูประจำชั้น
        let { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('first_name, last_name, role')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (!teacher) {
          const { data: fallbackTeacher } = await supabase
            .from('teachers')
            .select('first_name, last_name, role')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (fallbackTeacher) teacher = fallbackTeacher;
        }

        if (teacherErr) throw teacherErr;

        if (teacher) {
          const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
          setTeacherDisplayName(fullName);
          const teacherRole = normalizeRole(teacher.role);
          if (teacherRole) {
            setUserRole(teacherRole);
            return;
          }
        }

        const storeRole = normalizeRole(role);
        if (storeRole) {
          setUserRole(storeRole);
          return;
        }

        const { data: userProfile, error: userErr } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (userErr) throw userErr;

        const userProfileRole = normalizeRole(userProfile?.role);
        if (userProfileRole) {
          setUserRole(userProfileRole);
        }
      } catch (err) {
        console.error('Error loading layout user data:', err);
      }
    };

    loadUserData();
  }, [user?.id, role]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userDisplayName = userRole === 'ADMIN' ? t.admin : (teacherDisplayName || (user?.email ? user.email.split('@')[0] : t.user));

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-white transition-colors duration-300 student-support-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0d1527] border-r border-slate-200 dark:border-white/5 flex flex-col transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-indigo-50/50 dark:bg-[#111c34]">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight flex items-center gap-1.5">
              <Heart size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              {t.title}
            </h2>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-slate-400 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* แดชบอร์ดแรกภาพรวมคัดกรอง - แสดงสำหรับทุกคน */}
          <NavItem to="/studentsupport" icon={LayoutDashboard} onClick={closeSidebar}>
            {userRole === 'EXECUTIVE' || userRole === 'ADMIN' ? t.stats : t.screening}
          </NavItem>

          {/* รายชื่อคัดกรองเฉพาะสำหรับครูที่ปรึกษาประจำชั้น */}
          {userRole !== 'EXECUTIVE' && userRole !== 'ADMIN' && (
            <NavItem to="/studentsupport/students" icon={Users} onClick={closeSidebar}>
              {t.individual}
            </NavItem>
          )}

          {/* เมนูจัดการเคสช่วยเหลือ - แสดงสำหรับทุกคน */}
          <NavItem to="/studentsupport/cases" icon={ShieldAlert} onClick={closeSidebar}>
            {t.cases}
          </NavItem>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a101f]">
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

          <Link to="/portal" className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={18} /> {t.switchApp}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shadow-sm cursor-pointer">
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-[#0d1527] border-b border-slate-200 dark:border-white/5 p-4 flex items-center gap-3 z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
            <Menu size={26} />
          </button>
          <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight">{t.title}</h2>
        </header>

        {/* Scrollable Workspace Container */}
        <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-[#090d16]">
          {children}
        </div>
      </main>
    </div>
  );
}
