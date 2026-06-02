import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard, Users, ShieldAlert, Menu, X, ArrowLeft, LogOut, Heart, Sparkles
} from 'lucide-react';

type StudentSupportRole = 'TEACHER' | 'EXECUTIVE' | 'ADMIN';

const normalizeRole = (role?: string | null): StudentSupportRole | null => {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'EXECUTIVE') return normalized;
  if (normalized === 'TEACHER' || normalized === 'ADVISOR') return 'TEACHER';
  return null;
};

const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  // match active route exactly or prefix match (excluding exact dashboard / root match)
  const isActive = location.pathname === to || (to !== '/studentsupport' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'}`}
    >
      <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-gray-500'} />
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

  const userDisplayName = userRole === 'ADMIN' ? 'ผู้ดูแลระบบ' : (teacherDisplayName || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้งาน'));

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#090d16] text-white">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0d1527] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#111c34]">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight flex items-center gap-1.5">
              <Heart size={20} className="text-indigo-400 shrink-0" />
              ดูแลช่วยเหลือนักเรียน
            </h2>
            <p className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
              <Sparkles size={8} /> ยินดีต้อนรับ {userDisplayName}
            </p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-white/5 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* แดชบอร์ดแรกภาพรวมคัดกรอง - แสดงสำหรับทุกคน */}
          <NavItem to="/studentsupport" icon={LayoutDashboard} onClick={closeSidebar}>
            {userRole === 'EXECUTIVE' || userRole === 'ADMIN' ? 'ภาพรวมสถิติโรงเรียน' : 'ภาพรวมคัดกรอง'}
          </NavItem>

          {/* รายชื่อคัดกรองเฉพาะสำหรับครูที่ปรึกษาประจำชั้น */}
          {userRole !== 'EXECUTIVE' && userRole !== 'ADMIN' && (
            <NavItem to="/studentsupport/students" icon={Users} onClick={closeSidebar}>
              คัดกรองนักเรียนรายบุคคล
            </NavItem>
          )}

          {/* เมนูจัดการเคสช่วยเหลือ - แสดงสำหรับทุกคน */}
          <NavItem to="/studentsupport/cases" icon={ShieldAlert} onClick={closeSidebar}>
            จัดการเคสช่วยเหลือ
          </NavItem>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-white/5 bg-[#0a101f]">
          <div className="mb-5 px-2">
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-black text-indigo-300 capitalize">
              {userRole?.toLowerCase() || 'Loading...'}
            </span>
          </div>

          <Link to="/portal" className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={16} /> กลับสู่ SAMS Portal
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-400 bg-white/5 border border-rose-500/10 hover:bg-rose-500/10 rounded-xl transition-all shadow-sm">
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#0d1527] border-b border-white/5 p-4 flex items-center gap-3 z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:bg-white/5 rounded-xl transition-colors">
            <Menu size={26} />
          </button>
          <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Student Support</h2>
        </header>

        {/* Scrollable Workspace Container */}
        <div className="flex-1 overflow-auto bg-[#090d16]">
          {children}
        </div>
      </main>
    </div>
  );
}
