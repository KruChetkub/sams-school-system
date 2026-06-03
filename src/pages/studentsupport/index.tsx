import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import AdvisorDashboard from './AdvisorDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import { ShieldAlert, ArrowLeft, GraduationCap, School, Users, Search, RefreshCw, AlertCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

type StudentSupportRole = 'TEACHER' | 'EXECUTIVE' | 'ADMIN';

const normalizeRole = (role?: string | null): StudentSupportRole | null => {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'SUPER_ADMIN' || normalized === 'EXECUTIVE') {
    return 'ADMIN'; // Map both to ADMIN/EXECUTIVE representation for selection
  }
  if (normalized === 'TEACHER' || normalized === 'ADVISOR') return 'TEACHER';
  return null;
};

export default function StudentSupportPortal() {
  const navigate = useNavigate();
  const authRole = useAuthStore((state) => state.role);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<StudentSupportRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('');
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const isAdminOrSuperAdmin = authRole === 'ADMIN' || authRole === 'SUPER_ADMIN';

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

  useEffect(() => {
    if (isAdminOrSuperAdmin) {
      const fetchTeachers = async () => {
        setLoadingTeachers(true);
        try {
          const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .order('first_name');
          if (!error && data) {
            setAllTeachers(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingTeachers(false);
        }
      };
      fetchTeachers();
    }
  }, [authRole, isAdminOrSuperAdmin]);

  const teacherDepartments = useMemo(() => {
    if (!allTeachers) return [];
    const depts = new Set(allTeachers.map(t => t.department).filter(Boolean));
    return Array.from(depts);
  }, [allTeachers]);

  const filteredTeachers = useMemo(() => {
    if (!allTeachers) return [];
    return allTeachers.filter(t => {
      const matchesSearch = `${t.first_name || ''} ${t.last_name || ''} ${t.teacher_code || ''}`.toLowerCase().includes(teacherSearch.toLowerCase());
      const matchesDept = teacherDeptFilter ? t.department === teacherDeptFilter : true;
      return matchesSearch && matchesDept;
    });
  }, [allTeachers, teacherSearch, teacherDeptFilter]);

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

  // ถ้าเป็น Admin หรือ Super Admin และยังไม่ได้เลือกครู/ภาพรวมโรงเรียน ให้เลือกก่อน
  if (isAdminOrSuperAdmin && selectedTeacherId === null) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 relative overflow-hidden font-sans">
        {/* Decorative Glow elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* Header Block */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden min-h-[140px] flex items-center">
            <div className="relative z-10 space-y-1.5">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-indigo-500/35 flex items-center gap-1.5 w-fit">
                <GraduationCap size={12} /> Student Support Center
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">ระบบดูแลช่วยเหลือนักเรียน (Student Support)</h1>
              <p className="text-white/60 text-xs md:text-sm font-medium">
                เลือกภาพรวมโรงเรียนหรือเลือกครูที่ปรึกษาเพื่อตรวจสอบและวิเคราะห์ความเสี่ยงรายบุคคล
              </p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 text-indigo-400">
              <ShieldAlert size={120} />
            </div>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedTeacherId('school')}
              className="group bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between cursor-pointer border border-indigo-450/20"
            >
              <div>
                <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">พอร์ทัลผู้บริหาร</p>
                <h3 className="text-2xl font-black mt-1">ภาพรวมโรงเรียนทั้งหมด</h3>
                <p className="text-indigo-100/80 text-xs mt-2 font-medium">ดูสถิติรวม อัตราความเสี่ยง และรายชื่อนักเรียนกลุ่มเสี่ยงทั้งโรงเรียน</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
                <School size={28} />
              </div>
            </button>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl shadow-xl flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">บุคลากรครูที่ปรึกษา</p>
                <h3 className="text-2xl font-black text-white mt-1">{allTeachers?.length || 0} คน</h3>
                <p className="text-gray-400/80 text-xs mt-2 font-medium">ค้นหาครูและคลิกการ์ดเพื่อจำลองการทำหน้าที่จัดการความเสี่ยง</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users size={28} />
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="bg-white/5 rounded-3xl p-6 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">รายชื่อครูผู้สอนในระบบ</h2>
              <p className="text-xs text-gray-400 mt-1">ค้นหาครูและคลิกเพื่อเปิดพอร์ทัลดูแลช่วยเหลือในบทบาทของครูท่านนั้น</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ หรือ รหัสครู..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white placeholder-gray-500"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </div>
              </div>

              {/* Department Filter */}
              <select
                value={teacherDeptFilter}
                onChange={(e) => setTeacherDeptFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#1e293b] border border-white/10 text-xs focus:outline-none focus:border-indigo-500 transition-all text-white cursor-pointer"
              >
                <option value="">ทุกกลุ่มสาระ / แผนก</option>
                {teacherDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Grid */}
          {loadingTeachers ? (
            <div className="bg-white/5 rounded-3xl p-16 shadow-xl border border-white/10 flex flex-col items-center justify-center text-gray-400">
              <RefreshCw size={48} className="mb-4 animate-spin opacity-50 text-indigo-400" />
              <p>กำลังโหลดรายชื่อครูผู้สอน...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-white/5 rounded-3xl p-16 shadow-xl border border-white/10 text-center text-gray-400">
              <AlertCircle size={48} className="mx-auto mb-3 opacity-40 text-indigo-400" />
              <p className="font-medium">ไม่พบข้อมูลครูตามตัวเลือกที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredTeachers.map((teacher) => {
                const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`
                return (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacherId(teacher.id);
                    }}
                    className="group text-left bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-indigo-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-52 relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full transition-all group-hover:scale-125" />

                    <div className="space-y-4">
                      {/* Avatar */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                          {initials || <User size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-gray-500 font-medium">
                            {teacher.teacher_code || 'ไม่มีรหัสครู'}
                          </p>
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            ครู{teacher.first_name} {teacher.last_name}
                          </h3>
                        </div>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xxs font-semibold text-gray-400">
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                            {teacher.department || 'ไม่ระบุกลุ่มสาระ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xxs font-bold text-indigo-400 group-hover:text-indigo-300">
                      <span>เข้าดูการคัดกรองรายห้อง</span>
                      <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedTeacherId === 'school' || (!isAdminOrSuperAdmin && (role === 'EXECUTIVE' || role === 'ADMIN'))) {
    return <ExecutiveDashboard onBack={isAdminOrSuperAdmin ? () => setSelectedTeacherId(null) : undefined} />;
  }

  // หาครูที่ถูกเลือก
  const selectedTeacher = allTeachers.find(t => t.id === selectedTeacherId);
  const simulatedTeacherUserId = selectedTeacher ? (selectedTeacher.user_id || selectedTeacher.id) : undefined;

  // สำหรับ TEACHER หรือ Admin ที่จำลองบทบาทเป็นครู
  return (
    <AdvisorDashboard
      simulatedTeacherUserId={simulatedTeacherUserId}
      onBack={isAdminOrSuperAdmin ? () => setSelectedTeacherId(null) : undefined}
    />
  );
}
