import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, LogOut, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import LottieDefault from 'lottie-react';
import animationData from '../../../A.json';

const Lottie = (LottieDefault as any).default || LottieDefault;

const Portal = () => {
  const { user, signOut, role } = useAuthStore();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userName, setUserName] = useState('');

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

  const handleLogout = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0f172a]">
      {/* Background Lottie Animation */}
      <div className="absolute inset-0 z-0 opacity-90 pointer-events-none">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          initialSegment={[60, 112]}
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, transform: 'scale(1.15)' }}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid slice' }}
        />
      </div>

      {/* Content wrapper to ensure z-index stays above background */}
      <div className="relative z-10 flex flex-col flex-1 h-full">
        {/* Logout Overlay */}
        {isSigningOut && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-md p-4">
            <div className="rounded-3xl border border-white/35 bg-white/20 px-8 py-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/35 border-t-white" />
              <p className="text-lg font-bold text-white">กำลังออกจากระบบ...</p>
            </div>
          </div>
        )}

        {/* Header - Transparent with Glassmorphism Pills */}
        <header className="px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-10">
          
          {/* Left Side: Logo and Title in a Glass Pill */}
          <div className="bg-white/80 backdrop-blur-xl px-6 py-3 rounded-3xl border border-white/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white font-black text-2xl">S</div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">School Portal Ckw</h1>
              <p className="text-xs md:text-sm font-semibold text-gray-600">เลือกแอปพลิเคชันที่ต้องการใช้งาน</p>
            </div>
          </div>

          {/* Right Side: User Info & Logout in a Glass Pill */}
          <div className="bg-white/80 backdrop-blur-xl px-5 py-3 rounded-3xl border border-white/60 shadow-sm flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-gray-900">{userName}</p>
              <p className="text-[10px] md:text-xs font-bold text-blue-700 uppercase tracking-wider">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-xl transition-all shadow-sm"
            >
              <LogOut size={18} /> <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 flex flex-col justify-center items-center">
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto w-full">

            {/* Card 1: SAMS */}
            <Link to="/" className="w-full md:w-[calc(50%-12px)] lg:w-[calc(50%-12px)] max-w-md group relative bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/60 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-60 group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">ระบบเช็คชื่อ (SAMS)</h3>
                <p className="text-gray-500 mb-8 flex-1">
                  จัดการข้อมูลนักเรียน เช็คชื่อเข้าแถว รายวิชา ตารางสอน และออกรายงานสรุปสถิติการมาเรียน
                </p>

                <div className="flex items-center text-blue-600 font-bold group-hover:gap-2 transition-all">
                  เข้าสู่ระบบ SAMS <ChevronRight size={20} className="ml-1" />
                </div>
              </div>
            </Link>

            {/* Card 2: Home Visit */}
            <Link to="/homevisit/dashboard" className="w-full md:w-[calc(50%-12px)] lg:w-[calc(50%-12px)] max-w-md group relative bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/60 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -mr-8 -mt-8 opacity-60 group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                  <HomeIcon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">ระบบเยี่ยมบ้าน</h3>
                <p className="text-gray-600 mb-8 flex-1 leading-relaxed">
                  บันทึกข้อมูลการเยี่ยมบ้านนักเรียน พิกัด GPS แบบประเมินความเสี่ยงและแนบภาพถ่ายสภาพความเป็นอยู่
                </p>

                <div className="flex items-center text-emerald-600 font-bold group-hover:gap-2 transition-all">
                  เข้าสู่ระบบเยี่ยมบ้าน <ChevronRight size={20} className="ml-1" />
                </div>
              </div>
            </Link>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Portal;
