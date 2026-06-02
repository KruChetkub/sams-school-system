import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { 
  getParentStudents, 
  getStudentAttendanceSummary, 
  getStudentLeaveHistory,
  getStudentHomeVisitInfo,
  getStudentSupportSummary
} from '../services/parentDashboardService'
import { 
  Activity, Clock, CheckCircle, XCircle, FileText, 
  User, Calendar, HeartHandshake, ShieldAlert, 
  AlertTriangle, Home, BarChart2, BookOpen, Heart, CheckSquare
} from 'lucide-react'
import { behaviorService } from '../services/studentsupport/behaviorService'

export default function ParentDashboard() {
  const { user } = useAuthStore()

  // 1. ดึงข้อมูลนักเรียนทั้งหมดที่เป็นลูกของผู้ปกครองคนนี้
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['parent_students', user?.email],
    queryFn: () => getParentStudents(user?.email || ''),
    enabled: !!user?.email
  })

  // เก็บ ID ของลูกคนที่เลือก
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  
  // กำหนดปุ่มแท็บข้อมูลของลูกที่เลือก
  const [activeInfoTab, setActiveInfoTab] = useState<'attendance' | 'leaves' | 'homevisit' | 'support' | 'behavior'>('attendance')

  // หากโหลดเสร็จแล้ว และยังไม่ได้เลือกนักเรียน ให้เลือกคนแรกเป็นค่าตั้งต้น
  React.useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id)
    }
  }, [students, selectedStudentId])

  const selectedStudent = students?.find(s => s.id === selectedStudentId)

  // 2. ดึงประวัติเข้าเรียน
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['student_attendance', selectedStudentId],
    queryFn: () => getStudentAttendanceSummary(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  // 3. ดึงประวัติการลา
  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ['student_leaves', selectedStudentId],
    queryFn: () => getStudentLeaveHistory(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  // 4. ดึงข้อมูลเยี่ยมบ้าน
  const { data: homeVisit, isLoading: loadingHomeVisit } = useQuery({
    queryKey: ['student_homevisit', selectedStudentId],
    queryFn: () => getStudentHomeVisitInfo(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  // 5. ดึงข้อมูลดูแลช่วยเหลือ
  const { data: support, isLoading: loadingSupport } = useQuery({
    queryKey: ['student_support', selectedStudentId],
    queryFn: () => getStudentSupportSummary(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  // 6. ดึงข้อมูลคะแนนความประพฤติและประวัติพฤติกรรม
  const { data: behaviorSummary, isLoading: loadingBehaviorSummary } = useQuery({
    queryKey: ['student_behavior_summary', selectedStudentId],
    queryFn: () => behaviorService.getStudentBehaviorSummary(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  const { data: behaviorPoints, isLoading: loadingBehaviorPoints } = useQuery({
    queryKey: ['student_behavior_points', selectedStudentId],
    queryFn: () => behaviorService.getStudentBehaviorPoints(selectedStudentId!),
    enabled: !!selectedStudentId
  })

  const isLoadingData = loadingAttendance || loadingLeaves || loadingHomeVisit || loadingSupport || loadingBehaviorSummary || loadingBehaviorPoints

  if (loadingStudents) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <span className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลผู้ปกครอง...</span>
        </div>
      </div>
    )
  }

  // หากไม่มีข้อมูลเด็กเชื่อมโยง
  if (!students || students.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-12 text-center bg-white border border-gray-150 rounded-3xl shadow-sm space-y-6">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800">ไม่พบข้อมูลบุตรหลานในระบบ</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            บัญชีผู้ปกครองของคุณยังไม่ได้เชื่อมโยงกับข้อมูลของนักเรียนคนใด กรุณาแจ้งผู้ดูแลระบบเพื่อบันทึกข้อมูลอีเมลผู้ปกครองในส่วนจัดการนักเรียน
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl text-xs text-left text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">คำแนะนำสำหรับผู้ดูแลระบบ (Admin):</p>
          <p>1. ไปที่เมนู "จัดการข้อมูลนักเรียน" หรือ "จัดการข้อมูลผู้ปกครอง"</p>
          <p>2. ค้นหานักเรียนที่ต้องการเชื่อมโยง</p>
          <p>3. กำหนดอีเมลผู้ปกครองให้ตรงกับอีเมลที่ล็อกอินนี้: <strong>{user?.email}</strong></p>
        </div>
      </div>
    )
  }

  // คำนวณสถิติของเด็กที่เลือก
  const homeroomList = attendanceData?.homeroom || []
  const subjectList = attendanceData?.subject || []

  // การเช็คชื่อโฮมรูม
  const homeroomPresentCount = homeroomList.filter(h => h.status === 'PRESENT').length
  const homeroomLateCount = homeroomList.filter(h => h.status === 'LATE').length
  const homeroomAbsentCount = homeroomList.filter(h => h.status === 'ABSENT').length
  const homeroomLeaveCount = homeroomList.filter(h => h.status === 'LEAVE').length

  // การเข้าเรียนรายวิชา
  const subjectPresentCount = subjectList.filter(s => s.status === 'PRESENT').length
  const subjectLateCount = subjectList.filter(s => s.status === 'LATE').length
  const subjectAbsentCount = subjectList.filter(s => s.status === 'ABSENT').length
  const subjectLeaveCount = subjectList.filter(s => s.status === 'LEAVE').length

  const totalLeavesCount = leaves?.length || 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Selector for multiple children */}
      {students.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">เลือกบุตรหลานที่ต้องการดูข้อมูล:</span>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {students.map((std) => (
              <button
                key={std.id}
                onClick={() => setSelectedStudentId(std.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                  selectedStudentId === std.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-150 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {std.prefix}{std.first_name} {std.last_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero card showing chosen student */}
      <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/20 shadow-inner z-10 shrink-0">
          <User size={48} className="text-indigo-200" />
        </div>
        <div className="z-10 text-center md:text-left space-y-2.5">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Parent Portal • ข้อมูลนักเรียนในความดูแล</p>
          <h1 className="text-3xl font-black">
            {selectedStudent?.prefix}{selectedStudent?.first_name} {selectedStudent?.last_name}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 text-sm">
            <span className="bg-white/15 px-3 py-1 rounded-lg border border-white/10 font-semibold">
              ชั้น ม.{selectedStudent?.classrooms?.level}/{selectedStudent?.classrooms?.room}
            </span>
            <span className="bg-white/15 px-3 py-1 rounded-lg border border-white/10 font-semibold">
              รหัสประจำตัว: {selectedStudent?.student_code}
            </span>
            {selectedStudent?.nickname && (
              <span className="bg-white/15 px-3 py-1 rounded-lg border border-white/10 font-semibold">
                ชื่อเล่น: {selectedStudent?.nickname}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hidden sm:block">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">เข้าเรียนวิชา</p>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mt-1">{subjectPresentCount} <span className="text-xs font-normal text-gray-400">ครั้ง</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl hidden sm:block">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">มาสาย (วิชา/แถว)</p>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mt-1">{subjectLateCount + homeroomLateCount} <span className="text-xs font-normal text-gray-400">ครั้ง</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl hidden sm:block">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">ขาดเรียน/แถว</p>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mt-1">{subjectAbsentCount + homeroomAbsentCount} <span className="text-xs font-normal text-gray-400">ครั้ง</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hidden sm:block">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">ประวัติใบลา</p>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mt-1">{totalLeavesCount} <span className="text-xs font-normal text-gray-400">ฉบับ</span></h3>
          </div>
        </div>
      </div>

      {/* Tabs navigation for student detailed data */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveInfoTab('attendance')}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeInfoTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ประวัติเช็คชื่อเรียน
        </button>
        <button
          onClick={() => setActiveInfoTab('leaves')}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeInfoTab === 'leaves'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ประวัติการลา
        </button>
        <button
          onClick={() => setActiveInfoTab('behavior')}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeInfoTab === 'behavior'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          คะแนนความประพฤติ/วินัย
        </button>
        <button
          onClick={() => setActiveInfoTab('homevisit')}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeInfoTab === 'homevisit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ข้อมูลเยี่ยมบ้าน
        </button>
        <button
          onClick={() => setActiveInfoTab('support')}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition whitespace-nowrap ${
            activeInfoTab === 'support'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ประเมินพฤติกรรม (SDQ/Risk)
        </button>
      </div>

      {/* Detailed Content based on active tab */}
      {isLoadingData ? (
        <div className="flex justify-center items-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Attendance Tab */}
          {activeInfoTab === 'attendance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Homeroom List */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" />
                  <span>การเข้าแถวโฮมรูมตอนเช้า</span>
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {homeroomList.map((h) => (
                    <div key={h.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-700">
                          {new Date(h.attendance_date).toLocaleDateString('th-TH', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        h.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                        h.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                        h.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {h.status === 'PRESENT' ? 'มาเรียน' :
                         h.status === 'LATE' ? 'สาย' :
                         h.status === 'ABSENT' ? 'ขาด' : 'ลา'}
                      </span>
                    </div>
                  ))}
                  {homeroomList.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      ยังไม่มีประวัติเช็คชื่อเข้าแถว
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Attendance List */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>การเข้าเรียนแต่ละรายวิชา</span>
                </h3>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {subjectList.map((s) => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-800">
                          {s.attendance_sessions?.subjects?.subject_name || 'ไม่ระบุวิชา'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(s.checkin_time).toLocaleDateString('th-TH')} • {new Date(s.checkin_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        s.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                        s.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {s.status === 'PRESENT' ? 'เข้าเรียน' :
                         s.status === 'LATE' ? 'สาย' :
                         s.status === 'ABSENT' ? 'ขาด' : 'ลา'}
                      </span>
                    </div>
                  ))}
                  {subjectList.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm">
                      ยังไม่มีประวัติเช็คชื่อเข้าคาบเรียน
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* 2. Leaves Tab */}
          {activeInfoTab === 'leaves' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>คำร้องขอลาหยุดเรียน ({totalLeavesCount} ฉบับ)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leaves?.map((l) => (
                  <div key={l.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3.5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="bg-indigo-100 text-indigo-850 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-lg">
                        ลา{l.leave_type}
                      </span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 font-bold' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                         l.status === 'REJECTED' ? 'ไม่อนุมัติ' : 'รอการพิจารณา'}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-700">
                        ช่วงวันที่ลา: {new Date(l.start_date).toLocaleDateString('th-TH')} ถึง {new Date(l.end_date).toLocaleDateString('th-TH')}
                      </p>
                      <p className="text-xs text-gray-500 bg-white p-3 border border-gray-100 rounded-xl leading-relaxed mt-2">
                        <span className="font-semibold text-gray-700">เหตุผลประกอบการลา:</span> {l.reason || 'ไม่ได้ระบุ'}
                      </p>
                    </div>
                  </div>
                ))}
                
                {totalLeavesCount === 0 && (
                  <div className="col-span-2 text-center py-12 text-gray-400 text-sm">
                    ยังไม่มีข้อมูลประวัติใบลา
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Home Visit Tab */}
          {activeInfoTab === 'homevisit' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
                <Home className="w-5 h-5 text-amber-600" />
                <span>สถานะการบันทึกข้อมูลเยี่ยมบ้าน</span>
              </h3>

              {!homeVisit ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  ครูที่ปรึกษายังไม่ได้ลงพื้นที่บันทึกข้อมูลเยี่ยมบ้านของนักเรียน
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visited info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold">วันที่บันทึกเข้าเยี่ยม</p>
                      <p className="text-base font-bold text-gray-700 mt-1">
                        {homeVisit.visit_date ? new Date(homeVisit.visit_date).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        }) : 'ยังไม่ได้ระบุวันที่'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold">ผู้ให้ข้อมูลเยี่ยมบ้าน</p>
                      <p className="text-base font-bold text-gray-700 mt-1">
                        {homeVisit.informant || 'ผู้ปกครอง'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold">ระดับความกังวลความปลอดภัย</p>
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mt-1.5 ${
                        homeVisit.home_visit_assessments?.[0]?.risk_level === 'เสี่ยง' || homeVisit.home_visit_assessments?.[0]?.risk_level === 'ช่วยเหลือเร่งด่วน'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {homeVisit.home_visit_assessments?.[0]?.risk_level || 'ปกติ/ปลอดภัย'}
                      </span>
                    </div>
                  </div>

                  {/* Summary of home assessment */}
                  {homeVisit.home_visit_assessments?.[0] && (
                    <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-5 space-y-3">
                      <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4" />
                        สรุปการประเมินสภาพครอบครัวและชีวิตความเป็นอยู่
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {homeVisit.home_visit_assessments[0].notes || 'บันทึกเยี่ยมบ้านเรียบร้อย อยู่ในเกณฑ์ปกติและครอบครัวให้การสนับสนุนการศึกษาเป็นอย่างดี'}
                      </p>
                    </div>
                  )}

                  {/* Gallery */}
                  {homeVisit.home_visit_photos && homeVisit.home_visit_photos.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-700">รูปภาพบันทึกภาพถ่ายเยี่ยมบ้าน</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {homeVisit.home_visit_photos.map((p: any) => (
                          <div key={p.id} className="rounded-xl overflow-hidden aspect-video bg-gray-100 border">
                            <img src={p.photo_url} alt="เยี่ยมบ้าน" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3.5. Behavior Points Tab */}
          {activeInfoTab === 'behavior' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span>คะแนนความประพฤติและวินัยนักเรียน (Behavior Points)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนคงเหลือปัจจุบัน</span>
                    <div className="relative flex items-center justify-center">
                      <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 font-black text-2xl shadow-inner ${
                        (behaviorSummary?.netScore ?? 100) < 50 ? 'border-rose-500 text-rose-650 bg-rose-50' :
                        (behaviorSummary?.netScore ?? 100) < 80 ? 'border-amber-500 text-amber-650 bg-amber-50' :
                        'border-emerald-500 text-emerald-650 bg-emerald-50'
                      }`}>
                        {behaviorSummary?.netScore ?? 100}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold mt-3 px-2.5 py-0.5 rounded-full border ${
                      (behaviorSummary?.netScore ?? 100) < 50 ? 'text-rose-700 bg-rose-50 border-rose-200' :
                      (behaviorSummary?.netScore ?? 100) < 80 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}>
                      {(behaviorSummary?.netScore ?? 100) < 50 ? 'ควรปรับปรุง (PROBLEM)' :
                       (behaviorSummary?.netScore ?? 100) < 80 ? 'เฝ้าระวังพฤติกรรม (RISK)' :
                       'ปกติ (NORMAL)'}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนความดีสะสม</span>
                    <div className="text-3xl font-black text-emerald-600">+{behaviorSummary?.plusSum ?? 0}</div>
                    <span className="text-[10px] text-gray-500 mt-2">คะแนนที่ได้รับบวกเพิ่ม</span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนหักวินัยสะสม</span>
                    <div className="text-3xl font-black text-rose-600">-{behaviorSummary?.minusSum ?? 0}</div>
                    <span className="text-[10px] text-gray-500 mt-2">คะแนนหักเนื่องจากทำผิดระเบียบ</span>
                  </div>
                </div>
              </div>

              {/* Behavior Logs List */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">
                  ประวัติรายการพฤติกรรมสะสม
                </h3>

                {!behaviorPoints || behaviorPoints.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    ยังไม่มีรายการบันทึกพฤติกรรมของนักเรียนในเทอมนี้
                  </div>
                ) : (
                  <div className="space-y-4">
                    {behaviorPoints.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center gap-4 hover:bg-gray-50 transition-all text-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 ${
                            item.type === 'PLUS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' :
                            'bg-rose-100 text-rose-800 border border-rose-250'
                          }`}>
                            {item.type === 'PLUS' ? '+' : '-'}{item.points}
                          </span>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                item.type === 'PLUS' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' :
                                'text-rose-800 bg-rose-50 border-rose-200'
                              }`}>
                                {item.category}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                วันที่เกิดเหตุ: {new Date(item.incident_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400">
                              ผู้บันทึก: ครู{item.teacher?.first_name || ''} {item.teacher?.last_name || 'ผู้ดูแลระบบ'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Student Support Tab */}
          {activeInfoTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Overall Risk Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm text-center">
                <ShieldAlert className="w-10 h-10 mx-auto text-indigo-600" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-800">วิเคราะห์ความเสี่ยงภาพรวม</h3>
                  <p className="text-xs text-gray-400">คำนวณจาก SDQ และ สถิติเข้าเรียน</p>
                </div>
                
                <div className="py-4">
                  {support?.risk ? (
                    <span className={`text-sm font-extrabold px-6 py-2.5 rounded-full inline-block ${
                      support.risk.risk_level === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      support.risk.risk_level === 'RISK' ? 'bg-orange-100 text-orange-850' :
                      support.risk.risk_level === 'MONITOR' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {support.risk.risk_level === 'URGENT' ? 'มีสภาวะเสี่ยงเร่งด่วน' :
                       support.risk.risk_level === 'RISK' ? 'กลุ่มเสี่ยงคัดกรอง' :
                       support.risk.risk_level === 'MONITOR' ? 'เฝ้าระวังใกล้ชิด' : 'ปกติ / แข็งแรง'}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 bg-gray-50 border px-6 py-2 rounded-full inline-block">
                      รอคัดกรองความเสี่ยง
                    </span>
                  )}
                </div>

                {support?.risk?.factors_summary && (
                  <div className="text-xs border-t border-gray-100 pt-4 space-y-2 text-left">
                    <p className="font-semibold text-gray-600 mb-1">ปัจจัยวิเคราะห์ความเสี่ยง:</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <span className="bg-gray-50 p-2 rounded-lg border">
                        SDQ: <strong>{support.risk.factors_summary.sdq || 'ปกติ'}</strong>
                      </span>
                      <span className="bg-gray-50 p-2 rounded-lg border">
                        การมาเรียน: <strong>{support.risk.factors_summary.attendance || 'ปกติ'}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SDQ details */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600" />
                  <span>ผลการคัดกรองแบบประเมิน SDQ (จุดแข็งและจุดอ่อน)</span>
                </h3>

                {support?.sdq && support.sdq.length > 0 ? (
                  <div className="space-y-4">
                    {support.sdq.map((s: any) => (
                      <div key={s.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3.5">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-gray-500">
                            ผู้ทำแบบประเมิน: {
                              s.evaluator_type === 'TEACHER' ? 'คุณครูประจำชั้น' :
                              s.evaluator_type === 'STUDENT' ? 'ตัวนักเรียนประเมินตนเอง' : 'ผู้ปกครอง'
                            }
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.result_difficulties === 'PROBLEM' ? 'bg-rose-100 text-rose-800' :
                            s.result_difficulties === 'RISK' ? 'bg-orange-100 text-orange-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            ผลประเมินพฤติกรรม: {
                              s.result_difficulties === 'PROBLEM' ? 'มีปัญหาพฤติกรรม' :
                              s.result_difficulties === 'RISK' ? 'กลุ่มเสี่ยงพฤติกรรม' : 'ปกติ'
                            }
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold leading-none">ด้านอารมณ์</p>
                            <p className="text-base font-extrabold text-gray-700 mt-1">{s.emotional_score}</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold leading-none">ด้านพฤติกรรม</p>
                            <p className="text-base font-extrabold text-gray-700 mt-1">{s.conduct_score}</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold leading-none">สมาธิสั้น</p>
                            <p className="text-base font-extrabold text-gray-700 mt-1">{s.hyperactivity_score}</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold leading-none">เพื่อนฝูง</p>
                            <p className="text-base font-extrabold text-gray-700 mt-1">{s.peer_score}</p>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 font-semibold leading-none">สัมพันธภาพ</p>
                            <p className="text-base font-extrabold text-gray-700 mt-1">{s.prosocial_score}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    ยังไม่มีผลบันทึกประเมิน SDQ ในปีนี้
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  )
}
