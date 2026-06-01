import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, LogOut, ChevronRight, Home as HomeIcon, Heart } from 'lucide-react';
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
        <header className="px-4 md:px-10 py-4 md:py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 md:gap-3 sticky top-0 z-10 w-full">
          
          {/* Left Side: Logo and Title in a Glass Pill */}
          <div className="bg-white/80 backdrop-blur-xl px-4 py-2.5 md:px-6 md:py-3 rounded-2xl md:rounded-3xl border border-white/60 shadow-sm flex items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white font-black text-lg md:text-2xl shrink-0">S</div>
            <div className="text-left">
              <h1 className="text-sm md:text-2xl font-black text-gray-900 leading-tight">School Portal Ckw</h1>
              <p className="hidden md:block text-xs md:text-sm font-semibold text-gray-600 mt-0.5">เลือกแอปพลิเคชันที่ต้องการใช้งาน</p>
            </div>
          </div>

          {/* Right Side: User Info in a Glass Pill (Always display on both mobile and desktop) */}
          <div className="bg-white/80 backdrop-blur-xl px-4 py-2.5 md:px-5 md:py-3 rounded-2xl md:rounded-3xl border border-white/60 shadow-sm flex items-center gap-3 w-full md:w-auto">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-xs md:text-sm shadow-inner border border-blue-200/50 shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left flex-1 md:flex-initial">
              <p className="text-xs md:text-sm font-bold text-gray-900 leading-tight">{userName || 'ผู้ใช้งาน'}</p>
              <p className="text-[9px] md:text-xs font-bold text-blue-700 uppercase tracking-wider leading-none mt-0.5">{role}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-12 flex flex-col justify-center items-center">
          <div className="grid grid-cols-2 gap-4 md:flex md:flex-wrap md:justify-center md:gap-6 max-w-5xl mx-auto w-full">

            {/* Card 1: SAMS */}
            <Link to="/" className="group relative bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-white/60 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 flex flex-col h-full justify-between w-full md:w-[calc(50%-12px)] max-w-md">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-blue-100 rounded-bl-full -mr-4 -mt-4 md:-mr-8 md:-mt-8 opacity-60 group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3 md:mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                    <GraduationCap className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-sm md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-3 leading-tight">ระบบเช็คชื่อ (SAMS)</h3>
                  <p className="hidden md:block text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                    จัดการข้อมูลนักเรียน เช็คชื่อเข้าแถว รายวิชา ตารางสอน และรายงานสรุปสถิติ
                  </p>
                </div>

                <div className="flex items-center text-[11px] md:text-base text-blue-600 font-bold group-hover:gap-2 transition-all mt-auto">
                  <span>เข้าสู่ระบบ SAMS</span> <ChevronRight className="w-3 h-3 md:w-5 md:h-5 ml-0.5 md:ml-1" />
                </div>
              </div>
            </Link>

            {/* Card 2: Home Visit */}
            <Link to="/homevisit/dashboard" className="group relative bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-white/60 hover:border-emerald-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 flex flex-col h-full justify-between w-full md:w-[calc(50%-12px)] max-w-md">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-emerald-100 rounded-bl-full -mr-4 -mt-4 md:-mr-8 md:-mt-8 opacity-60 group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3 md:mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                    <HomeIcon className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-sm md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-3 leading-tight">ระบบเยี่ยมบ้าน</h3>
                  <p className="hidden md:block text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                    บันทึกข้อมูลการเยี่ยมบ้าน พิกัด GPS ประเมินความเสี่ยงและแนบภาพถ่ายสภาพบ้าน
                  </p>
                </div>

                <div className="flex items-center text-[11px] md:text-base text-emerald-600 font-bold group-hover:gap-2 transition-all mt-auto">
                  <span>เข้าสู่ระบบเยี่ยมบ้าน</span> <ChevronRight className="w-3 h-3 md:w-5 md:h-5 ml-0.5 md:ml-1" />
                </div>
              </div>
            </Link>

            {/* Card 3: Student Support (SAMS v13) */}
            <Link to="/studentsupport" className="group relative bg-white/90 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-white/60 hover:border-violet-400 hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 flex flex-col h-full justify-between w-full md:w-[calc(50%-12px)] max-w-md">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-violet-100 rounded-bl-full -mr-4 -mt-4 md:-mr-8 md:-mt-8 opacity-60 group-hover:scale-125 transition-transform duration-500"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3 md:mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-5 h-5 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-sm md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-3 leading-tight">ระบบดูแลช่วยเหลือนักเรียน</h3>
                  <p className="hidden md:block text-gray-500 text-xs md:text-sm leading-relaxed mb-4 md:mb-8">
                    คัดกรองพฤติกรรม (SDQ) ประเมินความฉลาดทางอารมณ์ (EQ 52 ข้อ) วิเคราะห์ความเสี่ยงและติดตามเคสสะสม
                  </p>
                </div>

                <div className="flex items-center text-[11px] md:text-base text-violet-600 font-bold group-hover:gap-2 transition-all mt-auto">
                  <span>เข้าสู่ระบบดูแลช่วยเหลือ</span> <ChevronRight className="w-3 h-3 md:w-5 md:h-5 ml-0.5 md:ml-1" />
                </div>
              </div>
            </Link>

          </div>
        </main>

        {/* Footer - Logout Button at the bottom */}
        <footer className="w-full py-6 md:py-8 mt-auto flex justify-center items-center z-10">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs md:text-sm font-bold text-white bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 border border-red-500/40 rounded-xl transition-all shadow-lg backdrop-blur-md"
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
            <span className="text-red-200 font-semibold">ออกจากระบบ (Sign Out)</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Portal;
