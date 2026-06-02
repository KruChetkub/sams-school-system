import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { Link } from 'react-router-dom'
import { 
  getTeacherByUserId, 
  getTeacherClassrooms, 
  getTeacherHomeroomToday, 
  getTeacherSubjectAttendanceToday,
  getTeacherStudentRiskSummary,
  getTeacherHomeVisitProgress
} from '../services/teacherDashboardService'
import { 
  Users, CheckSquare, ClipboardCheck, AlertTriangle, 
  Home, HeartHandshake, ShieldAlert, Calendar, 
  ArrowRight, BookOpen, Clock, Award, Check, Sparkles, ChevronRight
} from 'lucide-react'
import { useAcademicYearStore } from '../store/academicYearStore'

export default function TeacherDashboard() {
  const { user } = useAuthStore()

  // 1. ดึงข้อมูลครู
  const { data: teacher, isLoading: isTeacherLoading } = useQuery({
    queryKey: ['teacherProfile', user?.id],
    queryFn: () => getTeacherByUserId(user!.id),
    enabled: !!user?.id
  })

  const { selectedYear } = useAcademicYearStore()
  const teacherId = teacher?.id
  const hasTeacherId = !!teacherId

  // 2. ดึงห้องเรียนที่ครูดูแล
  const { data: classrooms, isLoading: isClassroomsLoading } = useQuery({
    queryKey: ['teacherClassrooms', teacherId, selectedYear?.id],
    queryFn: () => getTeacherClassrooms(teacherId!, selectedYear?.id),
    enabled: hasTeacherId
  })

  const classroomIds = classrooms?.map((c: any) => c.id) || []
  const hasClassrooms = classroomIds.length > 0

  const todayDateStr = new Date().toISOString().split('T')[0]
  const todayDayOfWeek = new Date().getDay()

  // 3. ดึงข้อมูลเข้าแถวโฮมรูมวันนี้
  const { data: homeroomStats, isLoading: isHomeroomLoading } = useQuery({
    queryKey: ['teacherHomeroomToday', classroomIds, todayDateStr],
    queryFn: () => getTeacherHomeroomToday(classroomIds, todayDateStr),
    enabled: hasClassrooms
  })

  // 4. ดึงข้อมูลคาบเรียนและสถิติเช็คชื่อวิชาวันนี้
  const { data: subjectStats, isLoading: isSubjectLoading } = useQuery({
    queryKey: ['teacherSubjectToday', teacherId, todayDayOfWeek, todayDateStr, selectedYear?.id],
    queryFn: () => getTeacherSubjectAttendanceToday(teacherId!, todayDayOfWeek, todayDateStr, selectedYear?.id),
    enabled: hasTeacherId
  })

  // 5. ดึงข้อมูลนักเรียนเสี่ยง
  const { data: riskStudents, isLoading: isRiskLoading } = useQuery({
    queryKey: ['teacherRiskStudents', classroomIds, selectedYear?.id],
    queryFn: () => getTeacherStudentRiskSummary(classroomIds, selectedYear?.id),
    enabled: hasClassrooms
  })

  // 6. ดึงข้อมูลความคืบหน้าเยี่ยมบ้าน
  const { data: homeVisitProgress, isLoading: isHomeVisitLoading } = useQuery({
    queryKey: ['teacherHomeVisitProgress', classroomIds, selectedYear?.id],
    queryFn: () => getTeacherHomeVisitProgress(classroomIds, selectedYear?.id),
    enabled: hasClassrooms
  })

  const isLoading = isTeacherLoading || isClassroomsLoading || isHomeroomLoading || isSubjectLoading || isRiskLoading || isHomeVisitLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <Sparkles className="w-4 h-4 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-sm text-gray-400 font-medium">กำลังเตรียมข้อมูลแดชบอร์ดแสนสวย...</span>
        </div>
      </div>
    )
  }

  // คํานวณยอดรวมนักเรียนที่ดูแล
  const totalStudents = classrooms?.length 
    ? homeroomStats?.reduce((acc, curr) => acc + curr.total, 0) || 0 
    : 0

  // คำนวณความคืบหน้าเช็คแถวเฉลี่ย
  const homeroomChecked = homeroomStats?.reduce((acc, curr) => acc + curr.checked, 0) || 0

  // สรุปข้อมูลวิชาเรียนวันนี้
  const totalPeriodsToday = subjectStats?.length || 0
  const checkedPeriodsToday = subjectStats?.filter(s => s.isChecked).length || 0

  const thDays = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์']
  const thMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  const d = new Date()
  const dateFormatted = `${thDays[d.getDay()]}ที่ {${d.getDate()}} ${thMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`.replace('{', '').replace('}', '')

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white font-sans relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative z-10">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1b1947] via-[#751130] to-[#3f197c] p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/10">
        
        {/* Glow decoration effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/25 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4 pointer-events-none" />
        
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none">
          <Award className="w-80 h-80 text-white transform translate-x-12 translate-y-12" />
        </div>
        
        <div className="space-y-3 z-10">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
            <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">ระบบเข้าใช้สำหรับบุคลากร</span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-black tracking-tight drop-shadow-md">
            ยินดีต้อนรับ {teacher?.first_name} {teacher?.last_name}
          </h1>
          <p className="text-rose-100/90 font-medium text-xs md:text-sm flex flex-wrap items-center gap-2.5">
            <Calendar className="w-4 h-4 text-rose-300" />
            <span>{dateFormatted}</span>
            <span>•</span>
            <span className="bg-rose-950/45 px-2.5 py-0.5 rounded-lg border border-rose-800/35">กลุ่มสาระ: {teacher?.department || 'ไม่ระบุ'}</span>
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex flex-col gap-1.5 z-10 min-w-[200px] text-center md:text-left shadow-inner">
          <span className="text-[10px] uppercase font-bold text-rose-200 tracking-wider">ห้องเรียนที่ปรึกษา</span>
          <span className="text-xl font-black tracking-wide text-white">
            {classrooms?.length 
              ? classrooms.map((c: any) => `${c.level}/${c.room}`).join(', ')
              : 'ไม่มีห้องที่ปรึกษา'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Students under care */}
        <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-[0_8px_20px_rgba(244,63,94,0.25)] group-hover:scale-105 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">นักเรียนที่ดูแล</p>
            <h3 className="text-2xl font-black text-white">{totalStudents} <span className="text-xs font-semibold text-gray-500">คน</span></h3>
          </div>
        </div>

        {/* Card 2: Homeroom status */}
        <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform duration-300">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">เข้าแถววันนี้</p>
            <h3 className="text-2xl font-black text-white">
              {homeroomChecked} <span className="text-xs font-semibold text-gray-500">/ {totalStudents} คน</span>
            </h3>
          </div>
        </div>

        {/* Card 3: Teaching hours today */}
        <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-violet-500 to-purple-500 text-white shadow-[0_8px_20px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform duration-300">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">คาบเรียนวันนี้</p>
            <h3 className="text-2xl font-black text-white">
              {checkedPeriodsToday} <span className="text-xs font-semibold text-gray-500">/ {totalPeriodsToday} คาบ</span>
            </h3>
          </div>
        </div>

        {/* Card 4: Students at risk */}
        <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl p-6 rounded-3xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-4 group">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-[0_8px_20px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform duration-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">นักเรียนในกลุ่มเสี่ยง</p>
            <h3 className="text-2xl font-black text-white">
              {riskStudents?.length || 0} <span className="text-xs font-semibold text-gray-500">คน</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Quick action + Schedule) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-3">
              <Sparkles className="w-4 h-4 text-pink-450 animate-pulse" />
              <span>เครื่องมืออำนวยความสะดวกสำหรับคุณครู</span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link 
                to="/homeroom"
                className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl gap-2.5 text-center group"
              >
                <div className="p-3 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-xl shadow-md text-white group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">เช็คชื่อเข้าแถว</span>
              </Link>
              
              <Link 
                to="/attendance"
                className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl gap-2.5 text-center group"
              >
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl shadow-md text-white group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">เช็คชื่อรายวิชา</span>
              </Link>
              
              <Link 
                to="/homevisit/dashboard"
                className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl gap-2.5 text-center group"
              >
                <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl shadow-md text-white group-hover:scale-105 transition-transform">
                  <Home className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">ระบบเยี่ยมบ้าน</span>
              </Link>
              
              <Link 
                to="/studentsupport"
                className="flex flex-col items-center justify-center p-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl gap-2.5 text-center group"
              >
                <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-md text-white group-hover:scale-105 transition-transform">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-300 group-hover:text-white">ดูแลช่วยเหลือนักเรียน</span>
              </Link>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-450" />
                <span>ตารางสอนคาบเรียนวันนี้</span>
              </h2>
              <span className="text-[10px] bg-rose-500/20 border border-rose-500/35 text-rose-350 font-extrabold px-3 py-1 rounded-full">
                {totalPeriodsToday} คาบการสอน
              </span>
            </div>

            {totalPeriodsToday === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Calendar className="w-10 h-10 mx-auto text-gray-500 mb-2" />
                <p className="text-sm font-medium text-gray-400">ไม่มีตารางสอนในวันนี้</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10 space-y-4">
                {subjectStats?.map((periodData) => (
                  <div key={periodData.schedule.id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 p-2 rounded-xl transition duration-150">
                    <div className="flex gap-4">
                      <div className="bg-gradient-to-tr from-pink-500/20 to-indigo-500/20 text-white border border-pink-500/20 rounded-2xl font-bold flex flex-col justify-center items-center h-14 w-14 shrink-0 shadow-sm text-sm">
                        <span className="text-[9px] text-pink-450 font-bold leading-none">คาบ</span>
                        <span className="text-lg font-black leading-tight mt-0.5">{periodData.schedule.period}</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-sm sm:text-base">
                          {periodData.schedule.subject?.subject_name} ({periodData.schedule.subject?.subject_code})
                        </h4>
                        <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                            ชั้น ม.{periodData.schedule.classroom?.level}/{periodData.schedule.classroom?.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            {periodData.schedule.start_time.substring(0, 5)} - {periodData.schedule.end_time.substring(0, 5)} น.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2.5 sm:pt-0 shrink-0">
                      {periodData.isChecked ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-350 border border-emerald-500/35 text-[10px] font-bold px-3 py-1 rounded-xl shadow-inner flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            เช็คชื่อแล้ว
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            มา ({periodData.stats.present}) | สาย ({periodData.stats.late}) | ขาด ({periodData.stats.absent})
                          </span>
                        </div>
                      ) : (
                        <span className="bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-350 border border-amber-500/35 text-[10px] font-bold px-3 py-1 rounded-xl flex items-center gap-1 animate-pulse">
                          รอเช็คชื่อ
                        </span>
                      )}
                      
                      <Link
                        to="/attendance"
                        className="text-xs bg-white/5 hover:bg-indigo-650/20 text-indigo-300 hover:text-white font-bold px-3.5 py-2 border border-white/10 hover:border-indigo-500/30 rounded-xl transition flex items-center gap-1"
                      >
                        <span>เปิดห้อง</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Home Visit + Risk alerts) */}
        <div className="space-y-8">
          
          {/* Home Visit Progress */}
          <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <Home className="w-4.5 h-4.5 text-rose-450" />
              <span>ความคืบหน้าการเยี่ยมบ้าน</span>
            </h2>
            
            {!classrooms?.length ? (
              <div className="py-6 text-center text-sm text-gray-500">
                คุณยังไม่ได้เป็นที่ปรึกษาห้องเรียนใดๆ
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">บันทึกเยี่ยมบ้านแล้ว</span>
                  <span className="font-extrabold text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-500/35">
                    {homeVisitProgress?.visited} / {homeVisitProgress?.total} คน
                  </span>
                </div>
                
                {/* Custom Gradient Progress bar */}
                <div className="w-full bg-pink-500/10 h-3.5 rounded-full overflow-hidden border border-pink-500/20">
                  <div 
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 h-full rounded-full transition-all duration-750 shadow-sm" 
                    style={{ 
                      width: `${homeVisitProgress?.total ? (homeVisitProgress.visited / homeVisitProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-xxs text-gray-455">
                  <span className="font-bold text-pink-400">คิดเป็น {homeVisitProgress?.total ? Math.round((homeVisitProgress.visited / homeVisitProgress.total) * 100) : 0}%</span>
                  <Link to="/homevisit/dashboard" className="text-indigo-300 hover:text-white font-bold flex items-center gap-0.5 transition-colors">
                    <span>ดูรายละเอียด</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Risk Alerts */}
          <div className="bg-white/5 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-[2rem] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-450 animate-bounce" />
                <span>แจ้งเตือนกลุ่มช่วยเหลือ (Risk)</span>
              </h2>
            </div>

            {riskStudents?.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                ยังไม่มีข้อมูลนักเรียนกลุ่มเสี่ยง/มีปัญหา
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
                {riskStudents?.map((r) => (
                  <div 
                    key={r.id} 
                    className={`p-4 rounded-2xl border flex justify-between items-start gap-2.5 transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${
                      r.risk_level === 'URGENT' 
                        ? 'bg-gradient-to-r from-rose-500/20 to-red-500/5 border-rose-500/20 hover:border-rose-400/50' 
                        : 'bg-gradient-to-r from-amber-500/20 to-orange-500/5 border-amber-500/20 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-extrabold text-white text-sm">
                          {r.student?.prefix}{r.student?.first_name} {r.student?.last_name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          ชั้น ม.{r.student?.classrooms?.level}/{r.student?.classrooms?.room} • รหัส {r.student?.student_code}
                        </p>
                      </div>
                      
                      {/* Risk factor badges */}
                      <div className="flex flex-wrap gap-1">
                        {r.factors_summary?.sdq && (
                          <span className="text-[9px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-bold shadow-xxs">
                            SDQ: {r.factors_summary.sdq}
                          </span>
                        )}
                        {r.factors_summary?.attendance && (
                          <span className="text-[9px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-bold shadow-xxs">
                            การมาเรียน: {r.factors_summary.attendance}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
                        r.risk_level === 'URGENT' 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/35' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/35'
                      }`}>
                        {r.risk_level === 'URGENT' ? 'เร่งด่วน (แดง)' : 'กลุ่มเสี่ยง (ส้ม)'}
                      </span>
                      
                      <Link 
                        to={`/studentsupport/profile/${r.student_id}`}
                        className="text-[10px] font-extrabold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hover:bg-white/10 text-indigo-300 hover:text-white transition shadow-xxs flex items-center gap-0.5"
                      >
                        <span>ดูประวัติ</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

      </div>
    </div>
  )
}
