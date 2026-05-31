import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudents } from '../../services/studentService';
import { getHomeVisitsByTeacher } from '../../services/homevisit/visitService';
import { getClassrooms } from '../../services/classroomService';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { Search, MapPin, CheckCircle, Clock, ArrowLeft, Users } from 'lucide-react';

export default function StudentsList() {
  const { user, role } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

  // 1. ดึงห้องเรียนทั้งหมด เพื่อหาว่าครูคนนี้ประจำชั้นห้องไหน
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ['classrooms'],
    queryFn: getClassrooms
  });

  // 2. ดึงนักเรียนทั้งหมด
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents
  });

  // 3. ดึงประวัติการเยี่ยมบ้านที่ครูคนนี้เคยทำไว้
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['home_visits', user?.id, role],
    queryFn: () => getHomeVisitsByTeacher(user?.id || '', role),
    enabled: !!user?.id
  });

  // เลื่อนหน้าจอขึ้นบนสุดทันทีเมื่อมีการสลับห้องเรียนหรือกดย้อนกลับ
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedClassroomId]);

  const isLoading = isLoadingStudents || isLoadingVisits || isLoadingClassrooms;

  // กรองนักเรียน
  const filteredStudents = students.filter(s => {
    // 1. กรองสิทธิ์การมองเห็น (Role-based filtering)
    if (role === 'TEACHER') {
      const teacherClassroomIds = classrooms.filter(c => c.advisor_id === user?.id).map(c => c.id);
      if (!s.classroom_id || !teacherClassroomIds.includes(s.classroom_id)) {
        return false;
      }
    } else if (role === 'ADMIN') {
      // ถ้าแอดมินเลือกห้อง ให้แสดงเฉพาะนักเรียนห้องนั้น
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

  return (
    <div className="max-w-5xl mx-auto">
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
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : role === 'ADMIN' && !selectedClassroomId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(cls => {
            // นับจำนวนนักเรียนในห้อง (คร่าวๆ จากข้อมูลที่มี)
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
          })}
          {classrooms.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              ยังไม่มีข้อมูลห้องเรียนในระบบ
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {filteredStudents.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              ไม่พบรายชื่อนักเรียนที่ค้นหา
            </div>
          )}
        </div>
      )}
    </div>
  );
}
