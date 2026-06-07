import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../../services/studentService';
import { getHomeVisitsByTeacher } from '../../services/homevisit/visitService';
import { getClassrooms } from '../../services/classroomService';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { Link } from 'react-router-dom';
import { Search, MapPin, CheckCircle, Clock, ArrowLeft, Users, User, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function StudentsList() {
  const { user, role } = useAuthStore();
  const { selectedYear } = useAcademicYearStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'table'>('list');

  // 1. ดึงห้องเรียนทั้งหมด เพื่อหาว่าครูคนนี้ประจำชั้นห้องไหน
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ['classrooms', selectedYear?.id],
    queryFn: () => getClassrooms(selectedYear?.id)
  });

  // 2. ดึงนักเรียนทั้งหมด
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', selectedYear?.id],
    queryFn: () => getStudents(selectedYear?.id)
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('');

  const { data: allTeachers } = useQuery({
    queryKey: ['all_teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: role === 'ADMIN' || role === 'SUPER_ADMIN'
  });

  const selectedTeacher = React.useMemo(() => {
    if (!allTeachers || !selectedTeacherId) return null;
    return allTeachers.find(t => t.id === selectedTeacherId) || null;
  }, [allTeachers, selectedTeacherId]);

  const teacherDepartments = React.useMemo(() => {
    if (!allTeachers) return [];
    const depts = new Set(allTeachers.map(t => t.department).filter(Boolean));
    return Array.from(depts);
  }, [allTeachers]);

  const filteredTeachers = React.useMemo(() => {
    if (!allTeachers) return [];
    return allTeachers.filter(t => {
      const matchesSearch = `${t.first_name || ''} ${t.last_name || ''} ${t.teacher_code || ''}`.toLowerCase().includes(teacherSearch.toLowerCase());
      const matchesDept = teacherDeptFilter ? t.department === teacherDeptFilter : true;
      return matchesSearch && matchesDept;
    });
  }, [allTeachers, teacherSearch, teacherDeptFilter]);

  const activeTeacherUserId = role === 'TEACHER'
    ? user?.id
    : (selectedTeacher ? selectedTeacher.user_id : undefined);

  const simulatedRole = activeTeacherUserId ? 'TEACHER' : role;
  const queryUserId = activeTeacherUserId || user?.id || '';

  // 3. ดึงประวัติการเยี่ยมบ้านที่ครูคนนี้เคยทำไว้
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['home_visits', queryUserId, simulatedRole],
    queryFn: () => getHomeVisitsByTeacher(queryUserId, simulatedRole),
    enabled: !!queryUserId
  });

  // เลื่อนหน้าจอขึ้นบนสุดทันทีเมื่อมีการสลับห้องเรียนหรือกดย้อนกลับ
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedClassroomId]);

  const isLoading = isLoadingStudents || isLoadingVisits || isLoadingClassrooms;

  const activeTeacherClassroomIds = React.useMemo(() => {
    if (!activeTeacherUserId) return [];
    return classrooms.filter(c => c.advisor_id === activeTeacherUserId).map(c => c.id);
  }, [classrooms, activeTeacherUserId]);

  // กรองนักเรียน
  const filteredStudents = students.filter(s => {
    // 1. กรองสิทธิ์การมองเห็น (Role-based filtering)
    if (activeTeacherUserId) {
      if (!s.classroom_id || !activeTeacherClassroomIds.includes(s.classroom_id)) {
        return false;
      }
    } else {
      // ถ้าแอดมินเลือกห้อง ให้แสดงเฉพาะนักเรียนห้องนั้น (School-wide mode)
      if (selectedClassroomId && s.classroom_id !== selectedClassroomId) {
        return false;
      }
    }

    // 2. กรองคำค้นหา
    if (!searchTerm) return true;
    const name = `${s.first_name} ${s.last_name} ${s.student_code}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // ดูสถานะเยี่ยมบ้าน
  const getVisitStatus = (studentId: string) => {
    const visit = visits.find(v => v.student_id === studentId);
    if (!visit) return { status: 'NOT_VISITED', label: 'ยังไม่เยี่ยม', color: 'bg-gray-100 text-gray-600' };
    if (visit.status === 'COMPLETED') return { status: 'COMPLETED', label: 'เยี่ยมแล้ว', color: 'bg-emerald-100 text-emerald-700' };
    if (visit.status === 'SCHEDULED') return { status: 'SCHEDULED', label: 'นัดหมายแล้ว', color: 'bg-amber-100 text-amber-700' };
    return { status: 'NOT_VISITED', label: 'ยังไม่เยี่ยม', color: 'bg-gray-100 text-gray-600' };
  };

  const GRADIENTS = [
    'bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-200 shadow-indigo-100/50',
    'bg-gradient-to-br from-emerald-50 to-teal-100 border-teal-200 shadow-teal-100/50',
    'bg-gradient-to-br from-rose-50 to-pink-100 border-pink-200 shadow-pink-100/50',
    'bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200 shadow-orange-100/50',
    'bg-gradient-to-br from-purple-50 to-fuchsia-100 border-fuchsia-200 shadow-fuchsia-100/50',
    'bg-gradient-to-br from-cyan-50 to-sky-100 border-sky-200 shadow-sky-100/50',
  ];

  const getCardStyle = (advisorId?: string) => {
    if (!advisorId) return 'bg-white border-gray-100 shadow-sm'; // ไม่มีครู ให้สีเหมือนเดิม

    let hash = 0;
    for (let i = 0; i < advisorId.length; i++) {
      hash = advisorId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[index];
  };

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (isAdmin && selectedTeacherId === null) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden min-h-[160px] flex items-center">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">การเยี่ยมบ้านนักเรียน (Home Visit)</h1>
            <p className="text-white/80 font-medium">
              เลือกภาพรวมทั้งโรงเรียน หรือเลือกครูที่ปรึกษาเพื่อตรวจสอบและลงบันทึกข้อมูลการเยี่ยมบ้าน
            </p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-15">
            <MapPin size={120} />
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => setSelectedTeacherId('school')}
            className="group bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-emerald-100 text-sm font-semibold">การเยี่ยมบ้าน</p>
              <h3 className="text-2xl font-black mt-1">ภาพรวมโรงเรียนทั้งหมด</h3>
              <p className="text-emerald-100/90 text-xs mt-2 font-medium">ดูรายชื่อแยกตามห้องเรียนและจัดการข้อมูลทุกห้องเรียน</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
              <MapPin size={28} />
            </div>
          </button>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold">บุคลากรครูที่ปรึกษา</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{allTeachers?.length || 0} คน</h3>
              <p className="text-gray-400 text-xs mt-2 font-medium">เลือกครูที่ปรึกษาเพื่อจำลองหรือจัดการเยี่ยมบ้านในความดูแล</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users size={28} />
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">เลือกครูผู้สอน</h2>
            <p className="text-sm text-gray-500 mt-1">ค้นหาครูและคลิกการ์ดเพื่อทำรายการเยี่ยมบ้านแทนครูท่านนั้น</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสครู..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
            </div>

            {/* Department Filter */}
            <select
              value={teacherDeptFilter}
              onChange={(e) => setTeacherDeptFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white cursor-pointer"
            >
              <option value="">ทุกกลุ่มสาระ / แผนก</option>
              {teacherDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teacher Grid */}
        {allTeachers === undefined ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
            <p>กำลังโหลดรายชื่อครูผู้สอน...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center text-gray-400">
            <AlertCircle size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">ไม่พบข้อมูลครูตามตัวเลือกที่ค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTeachers.map((teacher) => {
              const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`
              const advisorRoomsCount = classrooms?.filter(c => c.advisor_id === teacher.user_id).length || 0;
              return (
                <button
                  key={teacher.id}
                  onClick={() => {
                    setSelectedTeacherId(teacher.id);
                    setSelectedClassroomId(null);
                  }}
                  className="group text-left bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-52 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-bl-full transition-all group-hover:scale-125" />

                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-base transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                        {initials || <User size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-mono text-gray-400 font-medium">
                          {teacher.teacher_code || 'ไม่มีรหัสครู'}
                        </p>
                        <h3 className="font-bold text-gray-800 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          ครู{teacher.first_name} {teacher.last_name}
                        </h3>
                      </div>
                    </div>

                    {/* Info lines */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100">
                          {teacher.department || 'ไม่ระบุกลุ่มสาระ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-emerald-500 group-hover:text-emerald-600">
                    <span>{advisorRoomsCount > 0 ? `ครูที่ปรึกษา ${advisorRoomsCount} ห้อง` : 'ไม่มีห้องเรียนในดูแล'}</span>
                    <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {isAdmin && selectedTeacherId !== null && (
        <div className="flex justify-start">
          <button
            onClick={() => {
              setSelectedTeacherId(null);
              setSelectedClassroomId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> ย้อนกลับไปหน้าเลือกครูผู้สอน
          </button>
        </div>
      )}

      {/* Perspective Banner */}
      {selectedTeacher && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-800 text-sm">กำลังทำหน้าที่แทนครูที่ปรึกษา</h4>
              <p className="text-xs text-amber-700 font-medium">
                คุณกำลังดูข้อมูลและบันทึกการเยี่ยมบ้านของนักเรียนในฐานะ <span className="underline font-bold">ครู{selectedTeacher.first_name} {selectedTeacher.last_name}</span> {selectedTeacher.department ? `(${selectedTeacher.department})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTeacherId('school');
              setSelectedClassroomId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            เปลี่ยนเป็นภาพรวมโรงเรียน
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            {role === 'ADMIN' && selectedClassroomId && (
              <button
                onClick={() => setSelectedClassroomId(null)}
                className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex items-center justify-center"
                title="กลับไปหน้าเลือกห้อง"
              >
                <ArrowLeft size={22} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {role === 'ADMIN' && !selectedClassroomId ? 'เลือกห้องเรียนเพื่อดูข้อมูล' : 'รายชื่อนักเรียน'}
            </h1>
          </div>
          <p className="text-gray-500 mt-1 ml-1">
            {role === 'ADMIN' && !selectedClassroomId
              ? 'รายชื่อครูที่ปรึกษาแยกตามห้อง'
              : 'เลือกลงบันทึกการเยี่ยมบ้านของนักเรียน'
            }
          </p>
        </div>

        {(!role || role === 'TEACHER' || (role === 'ADMIN' && selectedClassroomId)) && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle (Desktop only) */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <span>☰</span> รายการ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'card' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <span>▦</span> การ์ด
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-50' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <span>⊞</span> ตาราง
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสนักเรียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : role === 'ADMIN' && !selectedClassroomId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const list = activeTeacherUserId
              ? classrooms.filter(c => c.advisor_id === activeTeacherUserId)
              : classrooms;
            return list.map(cls => {
              const studentCount = students.filter(s => s.classroom_id === cls.id).length;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassroomId(cls.id)}
                  className={`${getCardStyle(cls.advisor_id)} rounded-2xl p-5 border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}
                >
                  {/* Decorative element for gradient cards */}
                  {cls.advisor_id && (
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/40 rounded-full blur-2xl group-hover:bg-white/60 transition-all"></div>
                  )}

                  <div className="flex items-center gap-4 mb-2 relative z-10">
                    <div className="bg-white/80 backdrop-blur-sm text-gray-800 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">
                      {cls.level}/{cls.room}
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium flex items-center gap-1 mb-1">
                        <Users size={12} /> ครูที่ปรึกษา
                      </div>
                      <div className="font-bold text-gray-900 text-lg drop-shadow-sm">
                        {cls.advisor ? `${cls.advisor.first_name} ${cls.advisor.last_name}` : <span className="text-gray-400 italic">ยังไม่ระบุ</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-900/10 relative z-10">
                    <div className="text-sm font-semibold text-gray-700">
                      นักเรียน {studentCount} คน
                    </div>
                    <div className="text-gray-800 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      เปิดดูรายชื่อ <ArrowLeft size={16} className="rotate-180" />
                    </div>
                  </div>
                </div>
              );
            });
          })()}
          {(() => {
            const list = activeTeacherUserId
              ? classrooms.filter(c => c.advisor_id === activeTeacherUserId)
              : classrooms;
            return list.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                ยังไม่มีข้อมูลห้องเรียนในระบบ
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile View: Always Cards/Grid */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredStudents.map(student => {
              const vStatus = getVisitStatus(student.id);
              const isCompleted = vStatus.status === 'COMPLETED';
              const cardStyle = isCompleted
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100/50'
                : 'bg-white border-gray-200';

              return (
                <div key={student.id} className={`${cardStyle} rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{student.student_code}</span>
                        {student.classroom && (
                          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                            {student.classroom.level}/{student.classroom.room}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-bold mt-2 text-lg truncate ${isCompleted ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {student.prefix}{student.first_name} {student.last_name}
                      </h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${vStatus.color}`}>
                      {vStatus.label}
                    </span>
                  </div>

                  <Link
                    to={`/homevisit/visit/${student.id}`}
                    className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all ${isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                  >
                    {isCompleted ? <><MapPin size={16} /> ตรวจสอบ / แก้ไข</> : <><MapPin size={16} /> บันทึกการเยี่ยมบ้าน</>}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop View Mode: List (Default) */}
          {viewMode === 'list' && (
            <div className="hidden md:flex flex-col gap-3">
              {filteredStudents.map(student => {
                const vStatus = getVisitStatus(student.id);
                const isCompleted = vStatus.status === 'COMPLETED';
                const cardStyle = isCompleted
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100/50'
                  : 'bg-white border-gray-200';

                return (
                  <div key={student.id} className={`${cardStyle} rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                        {student.first_name?.[0] || <User size={16} />}
                      </div>
                      <div>
                        <h3 className={`font-bold text-base ${isCompleted ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {student.prefix}{student.first_name} {student.last_name}
                        </h3>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-xs text-gray-500 font-semibold">รหัส: {student.student_code}</span>
                          {student.classroom && (
                            <span className="text-xs text-gray-500 font-semibold">• ชั้น {student.classroom.level}/{student.classroom.room}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${vStatus.color}`}>
                        {vStatus.label}
                      </span>
                      <Link
                        to={`/homevisit/visit/${student.id}`}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isCompleted
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          }`}
                      >
                        {isCompleted ? <><MapPin size={14} /> ตรวจสอบ / แก้ไข</> : <><MapPin size={14} /> บันทึกการเยี่ยมบ้าน</>}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop View Mode: Card */}
          {viewMode === 'card' && (
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => {
                const vStatus = getVisitStatus(student.id);
                const isCompleted = vStatus.status === 'COMPLETED';
                const cardStyle = isCompleted
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-emerald-100/50'
                  : 'bg-white border-gray-200';

                return (
                  <div key={student.id} className={`${cardStyle} rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex gap-2 items-center mb-2">
                          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{student.student_code}</span>
                          {student.classroom && (
                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                              {student.classroom.level}/{student.classroom.room}
                            </span>
                          )}
                        </div>
                        <h3 className={`font-bold mt-2 text-lg truncate ${isCompleted ? 'text-emerald-900' : 'text-gray-900'}`}>
                          {student.prefix}{student.first_name} {student.last_name}
                        </h3>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${vStatus.color}`}>
                        {vStatus.label}
                      </span>
                    </div>

                    <Link
                      to={`/homevisit/visit/${student.id}`}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl transition-all ${isCompleted
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                    >
                      {isCompleted ? <><MapPin size={16} /> ตรวจสอบ / แก้ไข</> : <><MapPin size={16} /> บันทึกการเยี่ยมบ้าน</>}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop View Mode: Table */}
          {viewMode === 'table' && (
            <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">รหัสนักเรียน</th>
                    <th className="px-6 py-4">ชื่อ - นามสกุล</th>
                    <th className="px-6 py-4">ชั้น/ห้อง</th>
                    <th className="px-6 py-4 text-center">สถานะ</th>
                    <th className="px-6 py-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map(student => {
                    const vStatus = getVisitStatus(student.id);
                    const isCompleted = vStatus.status === 'COMPLETED';
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-gray-500">{student.student_code}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {student.prefix}{student.first_name} {student.last_name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-600">
                          {student.classroom ? `${student.classroom.level}/${student.classroom.room}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${vStatus.color}`}>
                            {vStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/homevisit/visit/${student.id}`}
                            className={`inline-flex items-center gap-1.5 font-bold py-2 px-4 rounded-xl text-xs transition-all ${isCompleted
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              }`}
                          >
                            {isCompleted ? <><MapPin size={12} /> ตรวจสอบ</> : <><MapPin size={12} /> บันทึก</>}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              ไม่พบรายชื่อนักเรียนที่ค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
}
