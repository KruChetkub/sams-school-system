import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Activity, Clock, CheckCircle, XCircle, FileText, User } from 'lucide-react'

// Dummy data fetching for parent dashboard (using admin auth for testing, or real auth)
export default function ParentDashboard() {
  const { user } = useAuthStore()

  // 1. Fetch Student linked to this user
  // (For demonstration in Admin portal, we fetch the first available student to simulate what a parent would see)
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['parent_student', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('students').select(`
        *,
        classrooms(level, room)
      `).limit(1).single()
      return data
    }
  })

  // 2. Fetch Attendance
  const { data: attendance } = useQuery({
    queryKey: ['student_attendance', student?.id],
    queryFn: async () => {
      if (!student) return []
      const { data } = await supabase
        .from('attendance')
        .select('*, attendance_sessions(session_date, start_time, subjects(subject_name))')
        .eq('student_id', student.id)
        .order('checkin_time', { ascending: false })
      return data || []
    },
    enabled: !!student
  })

  // 3. Fetch Leaves
  const { data: leaves } = useQuery({
    queryKey: ['student_leaves', student?.id],
    queryFn: async () => {
      if (!student) return []
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('student_id', student.id)
        .order('start_date', { ascending: false })
      return data || []
    },
    enabled: !!student
  })

  if (loadingStudent) return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูลผู้ปกครอง...</div>

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen rounded-3xl mt-4">
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border-4 border-white/30 shadow-inner z-10">
          <User size={48} className="text-white" />
        </div>
        <div className="z-10 text-center md:text-left">
          <p className="text-blue-100 font-medium mb-1">ยินดีต้อนรับสู่ Parent Portal</p>
          <h1 className="text-3xl font-black mb-2">ข้อมูลบุตรหลาน</h1>
          <p className="text-white text-xl font-medium">
            {student?.first_name} {student?.last_name} 
            <span className="ml-2 bg-white/20 px-3 py-1 rounded-lg text-sm">ม.{student?.classrooms?.level}/{student?.classrooms?.room}</span>
          </p>
          <p className="text-sm bg-black/20 inline-block px-4 py-1.5 rounded-full mt-3 font-medium">รหัสประจำตัว: {student?.student_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-green-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-green-100 p-4 rounded-2xl shadow-inner"><CheckCircle className="text-green-600" size={36} /></div>
          <div><p className="text-gray-500 text-sm font-bold">เข้าเรียน (รายวิชา)</p><p className="text-4xl font-black text-gray-800 mt-1">{attendance?.length || 0}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-red-100 p-4 rounded-2xl shadow-inner"><XCircle className="text-red-600" size={36} /></div>
          <div><p className="text-gray-500 text-sm font-bold">ขาดเรียน / มาสาย</p><p className="text-4xl font-black text-gray-800 mt-1">0</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="bg-orange-100 p-4 rounded-2xl shadow-inner"><FileText className="text-orange-600" size={36} /></div>
          <div><p className="text-gray-500 text-sm font-bold">ประวัติการยื่นใบลา</p><p className="text-4xl font-black text-gray-800 mt-1">{leaves?.length || 0}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance List */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Activity className="text-blue-500"/></div>
            ประวัติการเข้าเรียนล่าสุด
          </h2>
          <div className="space-y-4">
            {attendance?.slice(0,5).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl shadow-sm ${a.status === 'PRESENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {a.status === 'PRESENT' ? <CheckCircle size={24}/> : <XCircle size={24}/>}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{a.attendance_sessions?.subjects?.subject_name}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      {new Date(a.checkin_time).toLocaleDateString('th-TH')} • {new Date(a.checkin_time).toLocaleTimeString('th-TH')} น.
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-black px-4 py-1.5 rounded-full ${a.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {a.status === 'PRESENT' ? 'เข้าเรียน' : 'ขาด/สาย'}
                </span>
              </div>
            ))}
            {attendance?.length === 0 && <p className="text-center text-gray-500 py-8 font-medium">ยังไม่มีประวัติการเข้าเรียน</p>}
          </div>
        </div>

        {/* Leaves List */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg"><Clock className="text-orange-500"/></div>
            สถานะใบลาล่าสุด
          </h2>
          <div className="space-y-4">
            {leaves?.slice(0,5).map((l: any) => (
              <div key={l.id} className="flex flex-col p-5 bg-gray-50 rounded-2xl border border-gray-100 gap-3 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    {l.leave_type}
                  </span>
                  <span className={`text-xs font-bold px-4 py-1.5 rounded-full shadow-sm ${
                    l.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 
                    l.status === 'REJECTED' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {l.status === 'PENDING' ? 'กำลังรออนุมัติ' : l.status === 'APPROVED' ? 'อนุมัติเรียบร้อย' : 'ไม่อนุมัติ'}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-base mt-1">
                    วันที่ {new Date(l.start_date).toLocaleDateString('th-TH')} - {new Date(l.end_date).toLocaleDateString('th-TH')}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 bg-white p-3 rounded-xl border border-gray-100">
                    <span className="font-semibold">เหตุผล:</span> {l.reason}
                  </p>
                </div>
              </div>
            ))}
            {leaves?.length === 0 && <p className="text-center text-gray-500 py-8 font-medium">ยังไม่มีประวัติการยื่นใบลา</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
