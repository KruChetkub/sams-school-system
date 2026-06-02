import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdvisorDashboard from './AdvisorDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type StudentSupportRole = 'TEACHER' | 'EXECUTIVE' | 'ADMIN';

const normalizeRole = (role?: string | null): StudentSupportRole | null => {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'EXECUTIVE') return normalized;
  if (normalized === 'TEACHER' || normalized === 'ADVISOR') return 'TEACHER';
  return null;
};

export default function StudentSupportPortal() {
  const navigate = useNavigate();
  const authRole = useAuthStore((state) => state.role);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<StudentSupportRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('กรุณาเข้าสู่ระบบพอร์ทัลก่อนใช้งาน');
          setLoading(false);
          return;
        }

        // ค้นหาตำแหน่งและบทบาทจากตารางครู (teachers)
        let { data: teacher, error: teacherErr } = await supabase
          .from('teachers')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!teacher) {
          const { data: fallbackTeacher } = await supabase
            .from('teachers')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (fallbackTeacher) teacher = fallbackTeacher;
        }

        if (teacherErr) throw teacherErr;

        const teacherRole = normalizeRole(teacher?.role);
        if (teacherRole) {
          setRole(teacherRole);
          return;
        }

        const storeRole = normalizeRole(authRole);
        if (storeRole) {
          setRole(storeRole);
          return;
        }

        const { data: userProfile, error: userErr } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (userErr) throw userErr;
        
        const userRole = normalizeRole(userProfile?.role);
        if (userRole) {
          setRole(userRole);
        } else {
          // หากไม่พบอาจเป็นผู้ใช้ทั่วไป/นักเรียน 
          setError('ไม่พบสิทธิ์ของบุคลากรทางการศึกษาในบัญชีของคุณ');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [authRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-400 font-bold">กำลังเชื่อมต่อฐานข้อมูล RLS System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md text-center space-y-5 shadow-2xl relative">
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 p-3 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
          
          <h2 className="text-lg font-black pt-4">สิทธิ์การเข้าใช้งานจำกัด</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            {error}
          </p>

          <button
            onClick={() => navigate('/portal')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/25"
          >
            <ArrowLeft size={16} /> กลับหน้าพอร์ทัลหลัก
          </button>
        </div>
      </div>
    );
  }

  // ผู้ใช้งานเป็น EXECUTIVE หรือ ADMIN
  if (role === 'EXECUTIVE' || role === 'ADMIN') {
    return <ExecutiveDashboard />;
  }

  // ผู้ใช้งานเป็น TEACHER (ครูที่ปรึกษาประจำชั้น)
  return <AdvisorDashboard />;
}
