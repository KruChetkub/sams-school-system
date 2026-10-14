import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  User,
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { supabase } from '../../lib/supabase';
import {
  getTeacherTeachingCourses,
  getAssignmentSummaryStats,
  createAssignment
} from '../../services/assignmentService';
import type { TeacherCourseClassroom, AssignmentSummaryStats, CreateAssignmentDTO } from '../../types/assignment';
import { AssignmentFormModal } from './components/AssignmentFormModal';
import { AssignmentAlertModal } from './components/AssignmentAlertModal';

export const AssignmentDashboard: React.FC = () => {
  const { user, role } = useAuthStore();
  const { selectedYear, selectedSemester } = useAcademicYearStore();

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  // 1. Teacher selection state for Admin / Super Admin
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('');
  const [currentTeacherProfile, setCurrentTeacherProfile] = useState<any | null>(null);

  // 2. Courses and Stats state
  const [courses, setCourses] = useState<TeacherCourseClassroom[]>([]);
  const [stats, setStats] = useState<AssignmentSummaryStats>({
    totalAssignments: 0,
    totalSubmissions: 0,
    submittedCount: 0,
    gradedCount: 0,
    pendingCount: 0,
    lateCount: 0,
    submissionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState('ALL');

  // Quick Assign Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCourseForAssign, setActiveCourseForAssign] = useState<TeacherCourseClassroom | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert Modal
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'confirm';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // โหลดรายชื่อครูทั้งหมดสำหรับ Admin / Super Admin
  useEffect(() => {
    if (isAdmin) {
      const fetchTeachers = async () => {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .order('first_name');
        if (!error && data) {
          setAllTeachers(data);
        }
      };
      fetchTeachers();
    } else if (user?.id) {
      // สำหรับครูทั่วไป ค้นหา teacher_id จาก user_id
      const fetchMyTeacherId = async () => {
        const { data } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setCurrentTeacherProfile(data);
          setSelectedTeacherId(data.id);
        }
      };
      fetchMyTeacherId();
    }
  }, [isAdmin, user?.id]);

  // ดึงข้อมูลครูที่กำลังเลือกอยู่ (กรณี Admin เลือกครูรายคน)
  const selectedTeacher = useMemo(() => {
    if (selectedTeacherId === 'school') return { first_name: 'ภาพรวม', last_name: 'ทั้งโรงเรียน', department: 'ทุกกลุ่มสาระ' };
    if (!allTeachers.length || !selectedTeacherId) return currentTeacherProfile;
    return allTeachers.find(t => t.id === selectedTeacherId) || null;
  }, [allTeachers, selectedTeacherId, currentTeacherProfile]);

  // แผนก/กลุ่มสาระทั้งหมดสำหรับ Filter ของครู
  const teacherDepartments = useMemo(() => {
    const depts = new Set(allTeachers.map(t => t.department).filter(Boolean));
    return Array.from(depts);
  }, [allTeachers]);

  // รายชื่อครูที่ผ่านการค้นหาและกรอง
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter(t => {
      const matchSearch = `${t.first_name || ''} ${t.last_name || ''} ${t.teacher_code || ''}`
        .toLowerCase()
        .includes(teacherSearch.toLowerCase());
      const matchDept = teacherDeptFilter ? t.department === teacherDeptFilter : true;
      return matchSearch && matchDept;
    });
  }, [allTeachers, teacherSearch, teacherDeptFilter]);

  // โหลดรายวิชาและสถิติเมื่อเลือกครู หรือเปลี่ยนปีการศึกษา/ภาคเรียน
  const fetchCourseData = async () => {
    if (!selectedTeacherId && isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const effectiveTeacherId = selectedTeacherId === 'school' ? undefined : selectedTeacherId;

      // 1. ดึงเฉพาะวิชาและห้องเรียนที่ครูคนนั้นสอนจริงจากตาราง schedules (ไม่มีการซ้ำซ้อน)
      const taughtCourses = await getTeacherTeachingCourses(
        effectiveTeacherId,
        selectedYear?.id,
        selectedSemester?.id
      );
      setCourses(taughtCourses);

      // 2. ดึงสถิติสรุปภาพรวม
      const summaryStats = await getAssignmentSummaryStats({
        academicYearId: selectedYear?.id,
        semesterId: selectedSemester?.id,
        teacherId: effectiveTeacherId || undefined
      });
      setStats(summaryStats);
    } catch (err: any) {
      console.error('Error fetching course data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeacherId !== null) {
      fetchCourseData();
    }
  }, [selectedTeacherId, selectedYear?.id, selectedSemester?.id]);

  // กรองรายวิชาตามคำค้นหาและระดับชั้น
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch =
        c.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${c.classroom_level}/${c.classroom_room}`.includes(searchTerm) ||
        (c.teacher_name && c.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLevel =
        selectedLevelFilter === 'ALL' || c.classroom_level === selectedLevelFilter;

      return matchesSearch && matchesLevel;
    });
  }, [courses, searchTerm, selectedLevelFilter]);

  const availableLevels = useMemo(() => {
    return Array.from(new Set(courses.map(c => c.classroom_level))).sort();
  }, [courses]);

  // จัดการการสั่งงานด่วน
  const handleOpenQuickAssign = (course: TeacherCourseClassroom) => {
    setActiveCourseForAssign(course);
    setIsFormOpen(true);
  };

  const handleCreateAssignment = async (data: CreateAssignmentDTO) => {
    setIsSubmitting(true);
    try {
      await createAssignment({
        ...data,
        teacher_id: data.teacher_id || (selectedTeacherId !== 'school' ? selectedTeacherId : null)
      });
      setIsFormOpen(false);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'สั่งงานใหม่สำเร็จ!',
        message: `บันทึกชิ้นงาน "${data.title}" เรียบร้อยแล้ว ระบบได้เตรียมรายชื่อนักเรียนสำหรับเช็คงานให้โดยอัตโนมัติ`
      });
      fetchCourseData();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถบันทึกชิ้นงานได้'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW 1: SUPER_ADMIN / ADMIN - แสดงหน้ารายชื่อครูผู้สอนก่อนเป็นลำดับแรก
  // =========================================================================
  if (isAdmin && selectedTeacherId === null) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        
        {/* Header Block */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SUPER ADMIN & ADMIN ACCESS</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-snug">
              ระบบเช็คงานนักเรียนตามรายวิชา
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/90 font-medium leading-relaxed">
              เลือกดูภาพรวมทั้งโรงเรียน หรือคลิกเลือกครูผู้สอน เพื่อดูวิชาที่สอนและรายการสั่งงาน
            </p>
          </div>
          <div className="hidden lg:block opacity-20 pr-4">
            <BookOpen size={100} />
          </div>
        </div>

        {/* Selection Cards (Overview & Total Staff) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => setSelectedTeacherId('school')}
            className="group bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-3xl text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">ภาพรวมระบบ</p>
              <h3 className="text-xl sm:text-2xl font-black mt-1">ภาพรวมทุกวิชาทั้งโรงเรียน</h3>
              <p className="text-amber-100/90 text-xs mt-2 font-medium">ดูรายวิชาและงานที่สั่งทั้งหมดของครูทุกคนในโรงเรียน</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform shrink-0">
              <Layers size={28} />
            </div>
          </button>

          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">บุคลากรครูผู้สอน</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">
                {allTeachers.length} คน
              </h3>
              <p className="text-slate-400 text-xs mt-2 font-medium">คลิกเลือกครูผู้สอนด้านล่างเพื่อดูวิชาและชิ้นงานที่สอน</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users size={28} />
            </div>
          </div>
        </div>

        {/* Controls Card: Search & Department Filter */}
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">เลือกลิสต์ครูผู้สอน</h3>
            <p className="text-xs text-slate-500 mt-0.5">ค้นหาและคลิกการ์ดครูผู้สอนเพื่อเปิดดูวิชาที่สอนจริงในตารางสอน</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสครู..."
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
              />
            </div>

            {/* Department Filter */}
            {teacherDepartments.length > 0 && (
              <select
                value={teacherDeptFilter}
                onChange={e => setTeacherDeptFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
              >
                <option value="">ทุกกลุ่มสาระ / แผนก</option>
                {teacherDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Teachers Grid */}
        {filteredTeachers.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-900/40 rounded-3xl p-12 text-center border border-dashed border-slate-300 dark:border-slate-800">
            <AlertCircle size={44} className="mx-auto mb-2 text-slate-400" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">ไม่พบข้อมูลครูตามคำค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredTeachers.map(teacher => {
              const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`;
              return (
                <button
                  key={teacher.id}
                  type="button"
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className="group text-left bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 border border-white/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-48 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                        {initials || <User size={20} />}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-mono font-bold text-slate-400 block truncate">
                          {teacher.teacher_code || 'TEACHER'}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white truncate group-hover:text-amber-600 transition-colors">
                          {teacher.first_name} {teacher.last_name}
                        </h4>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold truncate max-w-full">
                        {teacher.department || 'ไม่ระบุกลุ่มสาระ'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span>เลือกดูวิชาที่สอน</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: แสดงรายวิชาที่ครูท่านนั้นสอนจริง (Courses View)
  // =========================================================================
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Top Admin Switching Banner (ถ้าเป็น Admin หรือ Super Admin) */}
      {isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold leading-none">กำลังดูงานในรายวิชาของ:</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                {selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : 'ครูผู้สอน'}
                {selectedTeacher?.department && (
                  <span className="text-xs font-semibold text-slate-500 ml-2">({selectedTeacher.department})</span>
                )}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedTeacherId(null);
              setCourses([]);
            }}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all shrink-0 min-h-[40px]"
          >
            <ArrowLeft size={14} />
            <span>เปลี่ยนครูผู้สอน</span>
          </button>
        </div>
      )}

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">ชิ้นงานที่สั่ง</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '-' : stats.totalAssignments.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">ตรวจแล้ว</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '-' : stats.gradedCount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">ค้างส่ง (คน)</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {loading ? '-' : stats.pendingCount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">อัตราส่งงาน</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-tight">
              {loading ? '-' : `${stats.submissionRate}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Course Section */}
      <div className="space-y-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>รายวิชาและห้องเรียนที่สอน</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                {filteredCourses.length} รายการ
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ค้นหารหัสวิชา หรือห้อง..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
              />
            </div>

            {availableLevels.length > 0 && (
              <select
                value={selectedLevelFilter}
                onChange={e => setSelectedLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
              >
                <option value="ALL">ทุกระดับชั้น</option>
                {availableLevels.map(lvl => (
                  <option key={lvl} value={lvl}>ชั้น {lvl}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Course Cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">กำลังโหลดรายวิชาที่สอนจริง...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">ไม่พบตารางสอนในภาคเรียนนี้</h4>
            <p className="text-xs text-slate-500 mt-1">
              ครูท่านนี้ยังไม่มีการจัดตารางสอนในภาคเรียนที่เลือก หรือไม่มีรายวิชาตรงตามเงื่อนไขค้นหา
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCourses.map(course => {
              const classroomText = `${course.classroom_level}/${course.classroom_room}`;
              return (
                <div
                  key={`${course.subject_id}_${course.classroom_id}_${course.teacher_id || ''}`}
                  className="group relative bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-black text-xs">
                        {course.subject_code}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>ห้อง {classroomText}</span>
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                      {course.subject_name}
                    </h4>

                    {course.teacher_name && selectedTeacherId === 'school' && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                        <User size={13} />
                        <span>ผู้สอน: {course.teacher_name}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <Link
                      to={`/assignments/subject/${course.subject_id}/classroom/${course.classroom_id}`}
                      className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>รายการงาน</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenQuickAssign(course)}
                      title="สั่งงานใหม่ในห้องนี้"
                      className="w-11 min-h-[42px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Quick Assign Form Modal */}
      {activeCourseForAssign && (
        <AssignmentFormModal
          isOpen={isFormOpen}
          subjectId={activeCourseForAssign.subject_id}
          classroomId={activeCourseForAssign.classroom_id}
          subjectName={activeCourseForAssign.subject_name}
          classroomLabel={`${activeCourseForAssign.classroom_level}/${activeCourseForAssign.classroom_room}`}
          academicYearId={selectedYear?.id}
          semesterId={selectedSemester?.id}
          teacherId={activeCourseForAssign.teacher_id || (selectedTeacherId !== 'school' ? selectedTeacherId : null)}
          onSubmit={handleCreateAssignment}
          onClose={() => setIsFormOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Alert Modal */}
      <AssignmentAlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AssignmentDashboard;
