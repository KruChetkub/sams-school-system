import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  Sun,
  Moon,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';

export const AssignmentLayout: React.FC = () => {
  const { user, role, signOut } = useAuthStore();
  const { selectedYear, selectedSemester } = useAcademicYearStore();
  const location = useLocation();

  // Dark / Light Theme
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Background Soft Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-15%] right-[-5%] w-[45%] h-[45%] rounded-full bg-amber-500/10 dark:bg-amber-600/10 blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-30 sticky top-0 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Left: App Logo & Breadcrumb Navigation */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Back to Portal Button */}
            <Link
              to="/portal"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[40px]"
              title="กลับหน้า Portal รวมระบบ"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portal</span>
            </Link>

            {/* Title / Logo */}
            <Link to="/assignments" className="flex items-center gap-3 min-w-0 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left overflow-hidden">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  ระบบเช็คงานนักเรียน
                </h1>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate hidden xs:block">
                  Student Assignment Management
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Academic Year Pill, Theme Switch, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Active Academic Year Pill */}
            {selectedYear && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  ปี {selectedYear.year} {selectedSemester?.semester ? `เทอม ${selectedSemester.semester}` : ''}
                </span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors min-h-[40px]"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left text-xs leading-none">
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[100px]">
                  {user?.email?.split('@')[0] || 'Teacher'}
                </span>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">
                  {role || 'ครูผู้สอน'}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut()}
              title="ออกจากระบบ"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors min-h-[40px]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 dark:border-slate-800/60 py-4 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
        ระบบบริหารจัดการสถานศึกษาอัจฉริยะ · Student Assignment System V20
      </footer>
    </div>
  );
};

export default AssignmentLayout;

