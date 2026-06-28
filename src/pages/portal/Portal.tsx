import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  LogOut,
  ChevronRight,
  Home as HomeIcon,
  Heart,
  Search,
  Sun,
  Moon,
  Globe,
  Users,
  BookOpen,
  School,
  ClipboardCheck,
  Bell,
  Settings,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import LottieDefault from 'lottie-react';
import animationData from '../../../A.json';

const Lottie = (LottieDefault as any).default || LottieDefault;

const translations = {
  th: {
    siteTitle: 'School Portal Ckw',
    subTitle: 'เลือกแอปพลิเคชันที่ต้องการใช้งาน',
    tagline: 'แพลตฟอร์มดิจิทัลสำหรับการบริหารจัดการโรงเรียน',
    desc: 'ระบบบริการดิจิทัลเพื่อการศึกษา ยกระดับการบริหารจัดการโรงเรียนสู่ระบบการทำงานอัจฉริยะ',
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
      }
    },
    logout: 'ออกจากระบบ (Sign Out)',
    loggingOut: 'กำลังออกจากระบบ...'
  },
  en: {
    siteTitle: 'School Portal Ckw',
    subTitle: 'Select an application to launch',
    tagline: 'Digital Platform For Smart School Management',
    desc: 'Digital services for education, elevating school administration into a smart unified operating system.',
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
      }
    },
    logout: 'Sign Out',
    loggingOut: 'Signing out...'
  }
};

const Portal = () => {
  const { user, signOut, role } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userName, setUserName] = useState('');

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classrooms: 0,
    activeSystems: 3
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
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fetch teacher's name or fall back to email prefix
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('teachers')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data && data.first_name) {
          setUserName(`${data.first_name} ${data.last_name}`);
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
          activeSystems: 3
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
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
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
    }
  ];



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
        {/* Soft blur backdrops in gradient purple */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[100px]" />
        {/* Responsive Overlay to ensure text readability */}
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

        {/* Header - Glassmorphism Navigation Bar */}
        <header className="py-4 md:py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sticky top-0 z-40 w-full">

          {/* Left Pill: Logo & Title (Desktop only: hidden md:flex) */}
          <div className="hidden md:flex bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-4 py-3 rounded-2xl md:rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-sm items-center gap-3.5 flex-1 md:flex-initial">
            <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-black text-xl shrink-0">
              C
            </div>
            <div className="text-left">
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {t.siteTitle}
              </h1>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {t.subTitle}
              </p>
            </div>
          </div>

          {/* Right Action Menu: Search, Lang, Theme, Profile */}
          <div className="flex flex-nowrap items-center justify-between md:justify-start gap-1.5 sm:gap-2 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-2 sm:px-3 py-2 rounded-2xl md:rounded-[2rem] border border-white/50 dark:border-slate-800/50 shadow-sm mx-auto md:mx-0 w-full sm:w-auto overflow-hidden">

            {/* Lang Button (Accessible Touch Size >=44px) */}
            <button
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl md:rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Globe className="w-5 h-5" />
              <span className="ml-1 text-xs font-bold uppercase">{lang === 'th' ? 'EN' : 'TH'}</span>
            </button>

            {/* Dark Mode Button (Accessible Touch Size >=44px) */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl md:rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-purple-500"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* User Profile Info */}
            <div className="h-11 pl-2 pr-3 sm:pl-2.5 sm:pr-4 flex items-center gap-1.5 sm:gap-2.5 rounded-xl md:rounded-full bg-slate-100 dark:bg-slate-800/70 border border-slate-200/40 dark:border-slate-700/30 min-w-0 flex-1 sm:flex-initial">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-xs shadow-inner shrink-0">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left leading-none min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">{userName || 'User'}</p>
                <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest block mt-0.5">{role || 'GUEST'}</span>
              </div>
            </div>

            {/* Logout Button (Visible on all screens) */}
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex-shrink-0 flex w-11 h-11 items-center justify-center rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors shadow-sm outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-4 sm:mt-6 md:mt-12 mb-4 sm:mb-8 md:mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[10px] md:text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart School Operating System</span>
          </div>

          <h2 className="text-xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-purple-200 dark:to-white max-w-3xl leading-[1.15]">
            {t.tagline}
          </h2>

          <p className="mt-3 text-xs sm:text-base text-slate-800 dark:text-slate-300 max-w-xl font-semibold leading-relaxed hidden sm:block">
            {t.desc}
          </p>
        </section>

        {/* Quick Statistics (Real Data from Supabase) */}
        <section className="mb-10 md:mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">

            {/* Stat 1: Total Students */}
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 border border-white/50 dark:border-slate-800/40 shadow-sm flex items-center gap-3.5 transform hover:scale-[1.02] transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider truncate">{t.stats.students}</p>
                <p className="text-lg md:text-2xl font-black text-slate-950 dark:text-white leading-tight">
                  {isStatsLoading ? (
                    <span className="inline-block w-12 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.students.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 2: Total Teachers */}
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 border border-white/50 dark:border-slate-800/40 shadow-sm flex items-center gap-3.5 transform hover:scale-[1.02] transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider truncate">{t.stats.teachers}</p>
                <p className="text-lg md:text-2xl font-black text-slate-950 dark:text-white leading-tight">
                  {isStatsLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.teachers.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 3: Total Rooms */}
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 border border-white/50 dark:border-slate-800/40 shadow-sm flex items-center gap-3.5 transform hover:scale-[1.02] transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider truncate">{t.stats.rooms}</p>
                <p className="text-lg md:text-2xl font-black text-slate-950 dark:text-white leading-tight">
                  {isStatsLoading ? (
                    <span className="inline-block w-8 h-5 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                  ) : (
                    stats.classrooms.toLocaleString()
                  )}
                </p>
              </div>
            </div>

            {/* Stat 4: Active Systems */}
            <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 border border-white/50 dark:border-slate-800/40 shadow-sm flex items-center gap-3.5 transform hover:scale-[1.02] transition-all">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 dark:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-400 uppercase tracking-wider truncate">{t.stats.activeSystems}</p>
                <p className="text-lg md:text-2xl font-black text-slate-950 dark:text-white leading-tight">
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
        <section className="mb-12">
          <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {apps.map((app) => {
              const IconComponent = app.icon;
              return (
                <Link
                  key={app.id}
                  to={app.path}
                  className={`group relative bg-white/80 dark:bg-[#1E293B]/70 backdrop-blur-lg rounded-2xl sm:rounded-[1.75rem] p-3 sm:p-6 shadow-md hover:shadow-xl border border-white/70 dark:border-slate-800/60 ${app.borderColor} transition-all duration-300 overflow-hidden transform hover:-translate-y-1.5 flex flex-col h-auto sm:h-full items-center sm:items-stretch justify-center sm:justify-between outline-none focus:ring-2 focus:ring-purple-500`}
                >
                  {/* Color Corner Blob */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-indigo-500/0 rounded-bl-full -mr-2 -mt-2 group-hover:scale-125 transition-transform duration-500 hidden sm:block" />

                  {/* Desktop Layout Wrapper */}
                  <div className="hidden sm:flex relative z-10 flex-col h-full">
                    {/* Badge / Tag */}
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.colorClass} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/10 uppercase tracking-widest">
                        {app.tag}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="text-left flex-1">
                      <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {app.title}
                      </h3>
                      <p className="text-slate-800 dark:text-slate-300 text-xs md:text-sm leading-relaxed mb-6 font-semibold">
                        {app.desc}
                      </p>
                    </div>

                    {/* Action trigger button */}
                    <div className="flex items-center text-xs md:text-sm text-purple-600 dark:text-purple-400 font-extrabold group-hover:gap-1.5 transition-all mt-auto py-1">
                      <span>{app.btn}</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Mobile App Icon Layout Wrapper */}
                  <div className="sm:hidden flex flex-col items-center gap-1.5 w-full text-center">
                    {/* App Icon (Squircle) */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.colorClass} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    {/* App Name */}
                    <span className="text-[10px] font-black text-slate-900 dark:text-white leading-tight tracking-tight break-words line-clamp-2 max-w-full">
                      {app.shortTitle}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-6 mt-auto flex flex-col items-center gap-4 border-t border-slate-200/30 dark:border-slate-800/30 z-10">
          <p className="text-[10px] md:text-xs font-semibold text-slate-400 dark:text-slate-500 text-center mt-2 leading-none">
            © {new Date().getFullYear()} School Portal Ckw. All rights reserved. Powered by Pichet Sripichai Smart School Operating System. v2.4.0
          </p>
        </footer>

      </div>
    </div>
  );
};

export default Portal;
