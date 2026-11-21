import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  ChevronRight,
  Home as HomeIcon,
  Heart,
  Sun,
  Moon,
  Globe,
  Users,
  BookOpen,
  School,
  ClipboardCheck,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { samsConfirm } from '../../components/common/SamsDialog';
import LottieDefault from 'lottie-react';
import animationData from '../../../A.json';

const Lottie = (LottieDefault as any).default || LottieDefault;

const translations = {
  th: {
    siteTitle: 'School Portal Ckw',
    subTitle: 'เลือกแอปพลิเคชันที่ต้องการใช้งาน',
    tagline: 'แพลตฟอร์มดิจิทัลสำหรับการบริหารจัดการโรงเรียน',
    desc: 'ระบบบริการดิจิทัลเพื่อการศึกษา ยกระดับการบริหารจัดการโรงเรียนสู่ระบบการทำงานอัจฉริยะ',
    menuTitle: 'ตั้งค่า & บัญชีผู้ใช้',
    languageLabel: 'ภาษาของระบบ (Language)',
    themeLabel: 'โหมดการแสดงผล (Theme)',
    lightMode: 'โหมดสว่าง (Light)',
    darkMode: 'โหมดมืด (Dark)',
    stats: {
      students: 'นักเรียนทั้งหมด',
      teachers: 'ครูและบุคลากร',
      rooms: 'ห้องเรียนทั้งหมด',
      activeSystems: 'ระบบที่เปิดใช้งาน'
    },
    apps: {
      sams: {
        title: 'ระบบเช็คชื่อ (SAMS)',
        desc: 'จัดการข้อมูลนักเรียน เช็คชื่อเข้าแถว รายวิชา ตารางสอน และรายงานสรุปสถิติประจำวันอย่างรวดเร็ว',
        btn: 'เข้าสู่ระบบ SAMS'
      },
      homevisit: {
        title: 'ระบบเยี่ยมบ้าน',
        desc: 'บันทึกข้อมูลการเยี่ยมบ้าน ระบุพิกัด GPS ประเมินความเสี่ยง และแนบรูปภาพรายงานผลแบบเรียลไทม์',
        btn: 'เข้าสู่ระบบเยี่ยมบ้าน'
      },
      studentsupport: {
        title: 'ระบบดูแลช่วยเหลือนักเรียน',
        desc: 'คัดกรองพฤติกรรม (SDQ) ประเมินความฉลาดทางอารมณ์ (EQ 52 ข้อ) วิเคราะห์ความเสี่ยงและติดตามเคสสะสม',
        btn: 'เข้าสู่ระบบดูแลช่วยเหลือ'
      },
      assignments: {
        title: 'ระบบเช็คงานนักเรียน',
        desc: 'สั่งงาน ติดตามการส่งงาน ชิ้นงานและการบ้านตามรายวิชา ตรวจให้คะแนน พร้อมสรุปรายงานงานค้างส่ง',
        btn: 'เข้าสู่ระบบเช็คงาน'
      }
    },
    logout: 'ออกจากระบบ',
    logoutConfirmTitle: 'ยืนยันการออกจากระบบ',
    logoutConfirmMessage: 'คุณต้องการออกจากระบบ School Portal Ckw ใช่หรือไม่?',
    logoutConfirmBtn: 'ออกจากระบบ',
    cancelBtn: 'ยกเลิก',
    loggingOut: 'กำลังออกจากระบบ...'
  },
  en: {
    siteTitle: 'School Portal Ckw',
    subTitle: 'Select an application to launch',
    tagline: 'Digital Platform For Smart School Management',
    desc: 'Digital services for education, elevating school administration into a smart unified operating system.',
    menuTitle: 'Settings & Account',
    languageLabel: 'System Language',
    themeLabel: 'Appearance Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    stats: {
      students: 'Total Students',
      teachers: 'Teachers & Staff',
      rooms: 'Total Classrooms',
      activeSystems: 'Active Systems'
    },
    apps: {
      sams: {
        title: 'Attendance System (SAMS)',
        desc: 'Manage student profiles, morning/class roll call, schedules, and daily statistical reports.',
        btn: 'Launch SAMS'
      },
      homevisit: {
        title: 'Home Visit System',
        desc: 'Record home visits, pinpoint GPS coordinates, assess risk levels, and attach photos in real-time.',
        btn: 'Launch Home Visit'
      },
      studentsupport: {
        title: 'Student Support System',
        desc: 'Behavioral screening (SDQ), emotional intelligence (EQ) assessments, and case progression tracking.',
        btn: 'Launch Student Support'
      },
      assignments: {
        title: 'Student Assignment System',
        desc: 'Create assignments, track homework submissions by course, grade students, and view pending stats.',
        btn: 'Launch Assignments'
      }
    },
    logout: 'Sign Out',
    logoutConfirmTitle: 'Confirm Sign Out',
    logoutConfirmMessage: 'Are you sure you want to sign out of School Portal Ckw?',
    logoutConfirmBtn: 'Sign Out',
    cancelBtn: 'Cancel',
    loggingOut: 'Signing out...'
  }
};

const Portal = () => {
  const { user, signOut, role } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userName, setUserName] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classrooms: 0,
    activeSystems: 4
  });
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // 1. Language System (TH / EN)
  const [lang, setLang] = useState<'th' | 'en'>(() => {
    return (localStorage.getItem('portal-lang') as 'th' | 'en') || 'th';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
    localStorage.setItem('portal-lang', nextLang);
  };

  const t = translations[lang];

  // 2. Dark Mode System
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

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch teacher's name or fall back to email prefix
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        let { data, error } = await supabase
          .from('teachers')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data) {
          const fallback = await supabase
            .from('teachers')
            .select('first_name, last_name')
            .eq('id', user.id)
            .maybeSingle();
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data && data.first_name) {
          setUserName(`${data.first_name} ${data.last_name}`.trim());
        } else if (user?.email) {
          setUserName(user.email.split('@')[0]);
        }
      }
    };
    fetchUserName();
  }, [user]);

  // Fetch actual stats from Supabase
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsStatsLoading(true);
        const [
          { count: studentsCount },
          { count: teachersCount },
          { count: classroomsCount }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('teachers').select('*', { count: 'exact', head: true }),
          supabase.from('classrooms').select('*', { count: 'exact', head: true })
        ]);
        setStats({
          students: studentsCount || 0,
          teachers: teachersCount || 0,
          classrooms: classroomsCount || 0,
          activeSystems: 4
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    const confirmed = await samsConfirm({
      title: t.logoutConfirmTitle,
      message: t.logoutConfirmMessage,
      confirmText: t.logoutConfirmBtn,
      cancelText: t.cancelBtn,
      variant: 'danger'
    });
    if (!confirmed) return;

    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
    navigate('/login');
  };

  // Application cards list
  const apps = [
    {
      id: 'sams',
      title: t.apps.sams.title,
      shortTitle: lang === 'th' ? 'ระบบเช็คชื่อ' : 'SAMS',
      desc: t.apps.sams.desc,
      btn: t.apps.sams.btn,
      path: '/',
      icon: GraduationCap,
      colorClass: 'from-purple-500 to-indigo-600 shadow-purple-500/25 dark:shadow-indigo-500/15',
      borderColor: 'group-hover:border-purple-400 dark:group-hover:border-indigo-500',
      tag: 'Core'
    },
    {
      id: 'homevisit',
      title: t.apps.homevisit.title,
      shortTitle: lang === 'th' ? 'เยี่ยมบ้าน' : 'Home Visit',
      desc: t.apps.homevisit.desc,
      btn: t.apps.homevisit.btn,
      path: '/homevisit/dashboard',
      icon: HomeIcon,
      colorClass: 'from-fuchsia-500 to-purple-600 shadow-fuchsia-500/25 dark:shadow-purple-500/15',
      borderColor: 'group-hover:border-fuchsia-400 dark:group-hover:border-purple-500',
      tag: 'Advisor'
    },
    {
      id: 'studentsupport',
      title: t.apps.studentsupport.title,
      shortTitle: lang === 'th' ? 'ดูแลช่วยเหลือ' : 'Support',
      desc: t.apps.studentsupport.desc,
      btn: t.apps.studentsupport.btn,
      path: '/studentsupport',
      icon: Heart,
      colorClass: 'from-violet-600 to-purple-700 shadow-violet-600/25 dark:shadow-violet-500/15',
      borderColor: 'group-hover:border-violet-400 dark:group-hover:border-purple-600',
      tag: 'Care'
    },
    {
      id: 'assignments',
      title: t.apps.assignments.title,
      shortTitle: lang === 'th' ? 'เช็คงาน' : 'Assignments',
      desc: t.apps.assignments.desc,
      btn: t.apps.assignments.btn,
      path: '/assignments',
      icon: BookOpen,
      colorClass: 'from-amber-500 to-amber-600 shadow-amber-500/25 dark:shadow-amber-500/15',
      borderColor: 'group-hover:border-amber-400 dark:group-hover:border-amber-500',
      tag: 'Academic'
    }
  ];

  const userInitial = userName ? userName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300 bg-[#F8FAFC] dark:bg-[#0f172a] text-slate-800 dark:text-slate-100">

      {/* Background Lottie Animation with Theme-Adaptive Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        {theme === 'dark' ? (
          <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen dark:mix-blend-normal">
            <Lottie
              animationData={animationData}
              loop={true}
              autoplay={true}
              initialSegment={[60, 112]}
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, transform: 'scale(1.15)' }}
              rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-95 transition-all duration-500"
            style={{ backgroundImage: 'url(/portal-light-bg.png)' }}
          />
        )}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px]" />
        <div className="absolute inset-0 bg-[#F8FAFC]/40 dark:bg-[#0f172a]/80 backdrop-blur-[1px] transition-colors duration-300" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Logout Overlay */}
        {isSigningOut && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4">
            <div className="rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/20 dark:bg-slate-900/30 p-8 text-center shadow-2xl backdrop-blur-xl max-w-xs w-full">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-600" />
              <p className="text-lg font-extrabold text-slate-800 dark:text-white leading-relaxed">{t.loggingOut}</p>
            </div>
          </div>
        )}

        {/* Minimal Compact Header (Left School Logo + Right Unified Avatar Menu) */}
        <header className="pt-3 pb-2 sm:py-4 flex items-center justify-between gap-3 sticky top-0 z-40 w-full">

          {/* Left: School Logo (Visible on Mobile & Desktop) + Brand Title on Desktop */}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-white/80 dark:border-slate-700/80 shadow-md p-1 flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
              <img
                src="/school-logo.png"
                alt="โรงเรียนเชียงของวิทยาคม"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {t.siteTitle}
              </span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
                โรงเรียนเชียงของวิทยาคม
              </span>
            </div>
          </div>

          {/* Right: Circular Profile Avatar Button with Unified Settings & Account Popover */}
          <div className="relative flex items-center gap-2 ml-auto" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(prev => !prev)}
              aria-label="User profile and settings menu"
              className="relative w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 via-purple-600 to-indigo-600 p-0.5 shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <div className="w-full h-full rounded-full bg-white/95 dark:bg-slate-900/95 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm">
                {userInitial}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </button>

            {/* Unified Profile & Settings Popover Card (Right-aligned) */}
            {isProfileOpen && (
              <div className="absolute right-0 top-13 w-76 sm:w-80 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 z-50">
                {/* 1. User Profile Info */}
                <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-black text-slate-900 dark:text-white break-words leading-snug">
                      {userName || 'ผู้ใช้งานระบบ'}
                    </p>
                    {user?.email && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" />
                      {role || 'USER'}
                    </span>
                  </div>
                </div>

                {/* 2. Language Switch */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {t.languageLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLang('th');
                        localStorage.setItem('portal-lang', 'th');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        lang === 'th'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>ภาษาไทย (TH)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLang('en');
                        localStorage.setItem('portal-lang', 'en');
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        lang === 'en'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>English (EN)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Theme Switch */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {t.themeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        theme === 'light'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* 4. Sign Out Button */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Compact Hero Section (Hidden on mobile phones, visible on sm/desktop) */}
        <section className="hidden sm:flex mt-4 md:mt-6 mb-6 md:mb-8 text-center flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-purple-200 dark:to-white max-w-2xl leading-snug">
            {t.tagline}
          </h2>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 max-w-xl font-semibold leading-relaxed">
            {t.desc}
          </p>
        </section>

        {/* Quick Statistics (Compact & Non-truncated labels) */}
        <section className="mt-2 sm:mt-0 mb-5 sm:mb-8 md:mb-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">

            {/* Stat 1: Total Students */}
            <div className="bg-white/85 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl md:rounded-3xl p-3 sm:p-4 border border-white/60 dark:border-slate-800/50 shadow-sm flex items-center gap-2.5 sm:gap-3.5 transform hover:scale-[1.01] transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {t.stats.students}
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-tight mt-0.5">
                  {isStatsLoading ? (
                    <span className="inline-block w-10 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.students.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 2: Total Teachers */}
            <div className="bg-white/85 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl md:rounded-3xl p-3 sm:p-4 border border-white/60 dark:border-slate-800/50 shadow-sm flex items-center gap-2.5 sm:gap-3.5 transform hover:scale-[1.01] transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {t.stats.teachers}
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-tight mt-0.5">
                  {isStatsLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.teachers.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 3: Total Rooms */}
            <div className="bg-white/85 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl md:rounded-3xl p-3 sm:p-4 border border-white/60 dark:border-slate-800/50 shadow-sm flex items-center gap-2.5 sm:gap-3.5 transform hover:scale-[1.01] transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <School className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {t.stats.rooms}
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-tight mt-0.5">
                  {isStatsLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.classrooms.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 4: Active Systems */}
            <div className="bg-white/85 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl md:rounded-3xl p-3 sm:p-4 border border-white/60 dark:border-slate-800/50 shadow-sm flex items-center gap-2.5 sm:gap-3.5 transform hover:scale-[1.01] transition-all">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-fuchsia-500/10 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] sm:text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {t.stats.activeSystems}
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-tight mt-0.5">
                  {isStatsLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    `${stats.activeSystems} / ${stats.activeSystems}`
                  )}
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Apps Grid Layout */}
        <section className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {apps.map((app) => {
              const IconComponent = app.icon;
              return (
                <Link
                  key={app.id}
                  to={app.path}
                  className={`group relative bg-white/85 dark:bg-[#1E293B]/75 backdrop-blur-lg rounded-2xl sm:rounded-[1.75rem] p-4 sm:p-6 shadow-md hover:shadow-xl border border-white/70 dark:border-slate-800/60 ${app.borderColor} transition-all duration-300 overflow-hidden transform hover:-translate-y-1 flex flex-col h-auto sm:h-full items-center sm:items-stretch justify-center sm:justify-between outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  {/* Color Corner Blob */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-indigo-500/0 rounded-bl-full -mr-2 -mt-2 group-hover:scale-125 transition-transform duration-500 hidden sm:block" />

                  {/* Desktop Layout Wrapper */}
                  <div className="hidden sm:flex relative z-10 flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.colorClass} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/10 uppercase tracking-widest">
                        {app.tag}
                      </span>
                    </div>

                    <div className="text-left flex-1">
                      <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {app.title}
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed mb-5 font-semibold">
                        {app.desc}
                      </p>
                    </div>

                    <div className="flex items-center text-xs md:text-sm text-purple-600 dark:text-purple-400 font-extrabold group-hover:gap-1.5 transition-all mt-auto py-1">
                      <span>{app.btn}</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Mobile App Icon Layout Wrapper */}
                  <div className="sm:hidden flex flex-col items-center gap-2 py-1 w-full text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.colorClass} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                      {app.shortTitle}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-4 mt-auto flex flex-col items-center border-t border-slate-200/30 dark:border-slate-800/30 z-10">
          <p className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 text-center leading-none">
            © {new Date().getFullYear()} School Portal Ckw. All rights reserved. Powered by Pichet Sripichai Smart School Operating System. v2.4.0
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Portal;
