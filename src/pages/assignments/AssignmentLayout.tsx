import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  LayoutDashboard,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Filter,
  Globe,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { supabase } from '../../lib/supabase';
import { samsConfirm } from '../../components/common/SamsDialog';

const translations = {
  th: {
    title: 'ระบบเช็คงานนักเรียน',
    dashboard: 'ภาพรวมรายวิชาที่สอน',
    activeCourse: 'รายการชิ้นงาน / การบ้าน',
    grading: 'เช็คงาน & ให้คะแนน',
    filterLabel: 'เลือกปีการศึกษา / ภาคเรียน',
    switchApp: 'สลับแอปพลิเคชัน',
    logout: 'ออกจากระบบ',
    admin: 'ผู้ดูแลระบบ',
    user: 'ผู้ใช้งาน'
  },
  en: {
    title: 'Student Assignments',
    dashboard: 'Courses Overview',
    activeCourse: 'Assignment List',
    grading: 'Check & Grade Work',
    filterLabel: 'Academic Year / Semester',
    switchApp: 'Switch Application',
    logout: 'Sign Out',
    admin: 'Administrator',
    user: 'User'
  }
};

const NavItem = ({
  to,
  icon: Icon,
  children,
  onClick,
  exact = false
}: {
  to: string;
  icon: any;
  children: React.ReactNode;
  onClick: () => void;
  exact?: boolean;
}) => {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive
          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30 shadow-xs'
          : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white font-medium'
      }`}
    >
      <Icon
        size={20}
        className={isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-gray-500'}
      />
      <span className="truncate">{children}</span>
    </Link>
  );
};

export const AssignmentLayout: React.FC = () => {
  const { user, role, signOut } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    years,
    selectedYear,
    selectedSemester,
    initializeStore,
    setSelectedYear,
    setSelectedSemester
  } = useAcademicYearStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [teacherDisplayName, setTeacherDisplayName] = useState('');

  useEffect(() => {
    if (years.length === 0) {
      initializeStore();
    }
  }, [years.length, initializeStore]);

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    queryClient.invalidateQueries();
  };

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId);
    queryClient.invalidateQueries();
  };

  // Language & Theme Sync
  const [lang, setLang] = useState<'th' | 'en'>(() => {
    return (localStorage.getItem('portal-lang') as 'th' | 'en') || 'th';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('portal-theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('portal-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedTheme = localStorage.getItem('portal-theme') as 'light' | 'dark';
      const storedLang = localStorage.getItem('portal-lang') as 'th' | 'en';
      if (storedTheme && storedTheme !== theme) setTheme(storedTheme);
      if (storedLang && storedLang !== lang) setLang(storedLang);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [theme, lang]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
    localStorage.setItem('portal-lang', nextLang);
  };

  useEffect(() => {
    const loadTeacherName = async () => {
      if (!user?.id || role === 'ADMIN' || role === 'SUPER_ADMIN') {
        setTeacherDisplayName('');
        return;
      }
      const { data } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        setTeacherDisplayName(fullName);
      } else {
        setTeacherDisplayName('');
      }
    };
    loadTeacherName();
  }, [user?.id, role]);

  const t = translations[lang];
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    const confirmed = await samsConfirm({
      title: lang === 'th' ? 'ยืนยันการออกจากระบบ' : 'Confirm Sign Out',
      message: lang === 'th' ? 'คุณต้องการออกจากระบบใช่หรือไม่?' : 'Are you sure you want to sign out?',
      confirmText: t.logout,
      cancelText: lang === 'th' ? 'ยกเลิก' : 'Cancel',
      variant: 'danger'
    });
    if (!confirmed) return;
    await signOut();
    navigate('/login');
  };

  const isSubjectListRoute = location.pathname.includes('/assignments/subject/');
  const isGradingRoute = location.pathname.includes('/grading');
  void teacherDisplayName;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#F8FAFC] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 assignment-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Left Sidebar (matching SAMS StudentSupport & HomeVisit layout) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0d1527] border-r border-slate-200 dark:border-white/5 flex flex-col transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between bg-amber-50/50 dark:bg-[#111c34]">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 tracking-tight flex items-center gap-2">
              <BookOpen size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.title}</span>
            </h2>
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-slate-400 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Academic Year & Semester Selector */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-amber-50/40 via-orange-50/20 to-amber-50/40 dark:from-amber-950/20 dark:to-slate-900/30 space-y-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 font-bold tracking-wide">
            <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.filterLabel}</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="relative">
              <select
                value={selectedYear?.id || ''}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#111c34] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-7 py-2 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition cursor-pointer appearance-none"
              >
                {years.map((y) => (
                  <option
                    key={y.id}
                    value={y.id}
                    className="bg-white dark:bg-[#0d1527] text-slate-900 dark:text-white"
                  >
                    {lang === 'th' ? `ปีการศึกษา ${y.year}` : `Year ${y.year}`}
                    {y.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedSemester?.id || ''}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#111c34] border border-slate-200 dark:border-white/10 rounded-xl pl-3 pr-7 py-2 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition cursor-pointer appearance-none"
                disabled={!selectedYear}
              >
                {selectedYear?.semesters?.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-white dark:bg-[#0d1527] text-slate-900 dark:text-white"
                  >
                    {s.label ||
                      (lang === 'th'
                        ? `ภาคเรียนที่ ${s.semester_number}`
                        : `Semester ${s.semester_number}`)}
                    {s.is_active ? ` (${lang === 'th' ? 'ปัจจุบัน' : 'Active'})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/assignments" icon={LayoutDashboard} onClick={closeSidebar} exact>
            {t.dashboard}
          </NavItem>

          {isSubjectListRoute && (
            <NavItem to={location.pathname} icon={Layers} onClick={closeSidebar}>
              {t.activeCourse}
            </NavItem>
          )}

          {isGradingRoute && (
            <NavItem to={location.pathname} icon={CheckCircle2} onClick={closeSidebar}>
              {t.grading}
            </NavItem>
          )}
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
              {theme === 'dark' ? (
                <Sun size={16} className="text-amber-500" />
              ) : (
                <Moon size={16} className="text-indigo-600" />
              )}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          <Link
            to="/portal"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft size={18} /> {t.switchApp}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-white/5 border border-rose-200 dark:border-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-[#0d1527] border-b border-slate-200 dark:border-white/5 p-4 flex items-center gap-3 z-30 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
          >
            <Menu size={26} />
          </button>
          <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 tracking-tight">
            {t.title}
          </h2>
        </header>

        {/* Scrollable Workspace Container */}
        <div className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-[#090d16]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssignmentLayout;
