import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalyticsData, getClassroomReport, getHomeroomClassroomDetailReport, getHomeroomReport, getStudentDetailReport, getStudentReport, getSubjectDetailReport, getSubjectReport } from '../services/dashboardService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { BarChart3, Users, User, Download, RefreshCw, Calendar as CalendarIcon, FileSpreadsheet, FileText, Library, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Reports() {
  const { selectedYear, selectedSemester } = useAcademicYearStore()
  const [activeTab, setActiveTab] = useState(() => {
    return window.location.hash.replace('#', '') || 'overview'
  })
  const [activeTimeFilter, setActiveTimeFilter] = useState('month')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [selectedHomeroomClassroomId, setSelectedHomeroomClassroomId] = useState<string | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentTablePage, setStudentTablePage] = useState(1)
  const [subjectHistoryPage, setSubjectHistoryPage] = useState(1)
  const [homeroomHistoryPage, setHomeroomHistoryPage] = useState(1)
  const historyPageSize = 10
  const studentPageSize = 10

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) setActiveTab(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard_analytics', activeTimeFilter, selectedYear?.id],
    queryFn: () => getAnalyticsData(activeTimeFilter, selectedYear?.id)
  })
  const { data: classroomRows = [], isLoading: loadingClassroom } = useQuery({
    queryKey: ['report_classroom', activeTimeFilter, selectedYear?.id],
    queryFn: () => getClassroomReport(activeTimeFilter, selectedYear?.id),
    enabled: activeTab === 'classroom'
  })
  const { data: homeroomRows = [], isLoading: loadingHomeroom } = useQuery({
    queryKey: ['report_homeroom', activeTimeFilter, selectedYear?.id],
    queryFn: () => getHomeroomReport(activeTimeFilter, selectedYear?.id),
    enabled: activeTab === 'homeroom'
  })
  const { data: homeroomClassroomDetail, isLoading: loadingHomeroomClassroomDetail } = useQuery({
    queryKey: ['report_homeroom_classroom_detail', selectedHomeroomClassroomId, activeTimeFilter, selectedYear?.id, selectedSemester?.id],
    queryFn: () => getHomeroomClassroomDetailReport(selectedHomeroomClassroomId as string, activeTimeFilter, selectedYear?.id, selectedSemester?.id),
    enabled: activeTab === 'homeroom' && !!selectedHomeroomClassroomId
  })
  const { data: studentRows = [], isLoading: loadingStudent } = useQuery({
    queryKey: ['report_student', activeTimeFilter, selectedYear?.id],
    queryFn: () => getStudentReport(activeTimeFilter, undefined, selectedYear?.id),
    enabled: activeTab === 'student'
  })
  const { data: studentDetail, isLoading: loadingStudentDetail } = useQuery({
    queryKey: ['report_student_detail', selectedStudentId, activeTimeFilter, selectedYear?.id, selectedSemester?.id],
    queryFn: () => getStudentDetailReport(selectedStudentId as string, activeTimeFilter, selectedYear?.id, selectedSemester?.id),
    enabled: activeTab === 'student' && !!selectedStudentId
  })
  const { data: subjectRows = [], isLoading: loadingSubject } = useQuery({
    queryKey: ['report_subject', activeTimeFilter, selectedYear?.id, selectedSemester?.id],
    queryFn: () => getSubjectReport(activeTimeFilter, selectedYear?.id, selectedSemester?.id),
    enabled: activeTab === 'subject'
  })
  const { data: subjectDetail, isLoading: loadingSubjectDetail } = useQuery({
    queryKey: ['report_subject_detail', selectedSubjectId, activeTimeFilter],
    queryFn: () => getSubjectDetailReport(selectedSubjectId as string, activeTimeFilter),
    enabled: activeTab === 'subject' && !!selectedSubjectId
  })

  const totalAttendance = analytics?.pieData?.reduce((acc: number, curr: any) => acc + (curr.name !== 'ยังไม่มีข้อมูล' ? curr.value : 0), 0) || 0;
  const presentCount = analytics?.pieData?.find((d: any) => d.name === 'มาเรียน')?.value || 0;
  const percentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  const totalItems = analytics?.rawAttendance?.length || 0;

  useEffect(() => {
    setSubjectHistoryPage(1)
    setHomeroomHistoryPage(1)
  }, [selectedStudentId, activeTimeFilter])

  useEffect(() => {
    setStudentTablePage(1)
  }, [studentSearch, activeTimeFilter, activeTab])

  const filteredStudentRows = studentRows.filter((r) => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return true
    const fullName = `${r.prefix ? `${r.prefix} ` : ''}${r.fullName}`.toLowerCase()
    return (
      r.studentCode.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      (r.classroom || '').toLowerCase().includes(q)
    )
  })

  const studentTotalPages = Math.max(1, Math.ceil(filteredStudentRows.length / studentPageSize))
  const pagedStudentRows = filteredStudentRows.slice((studentTablePage - 1) * studentPageSize, studentTablePage * studentPageSize)

  const formatThaiDate = (dateString: string) => {
    if (!dateString || dateString === '-') return '-'
    const date = new Date(`${dateString}T00:00:00`)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('th-TH')
  }

  const formatStatusThai = (status: string) => {
    if (status === 'PRESENT') return 'มา'
    if (status === 'ABSENT') return 'ขาด'
    if (status === 'LATE') return 'สาย'
    if (status === 'LEAVE') return 'ลา'
    return status
  }

  const statusClass = (status: string) => {
    if (status === 'PRESENT') return 'bg-emerald-100 text-emerald-700'
    if (status === 'ABSENT') return 'bg-red-100 text-red-700'
    if (status === 'LATE') return 'bg-amber-100 text-amber-700'
    if (status === 'LEAVE') return 'bg-sky-100 text-sky-700'
    return 'bg-slate-100 text-slate-700'
  }

  const subjectSessions = subjectDetail?.sessions || []
  const subjectSessionColumns = subjectSessions.map((session) => ({
    sessionId: session.sessionId,
    sessionDate: session.sessionDate
  }))
  const subjectStudents = (() => {
    const map = new Map<string, { studentId: string; studentCode: string; fullName: string; bySession: Record<string, string> }>()
    subjectSessions.forEach((session) => {
      session.students.forEach((student) => {
        if (!student.studentId) return
        if (!map.has(student.studentId)) {
          map.set(student.studentId, {
            studentId: student.studentId,
            studentCode: student.studentCode || '-',
            fullName: `${student.prefix ? `${student.prefix} ` : ''}${student.fullName}`.trim(),
            bySession: {}
          })
        }
        const current = map.get(student.studentId)
        if (current) current.bySession[session.sessionId] = student.status
      })
    })
    return Array.from(map.values()).sort((a, b) => a.studentCode.localeCompare(b.studentCode))
  })()

  const subjectCardPalettes = [
    {
      shell: 'border-rose-200 bg-rose-50',
      header: 'bg-gradient-to-r from-rose-500 to-pink-500',
      title: 'text-white',
      code: 'text-rose-100',
      room: 'text-rose-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-rose-700'
    },
    {
      shell: 'border-blue-200 bg-blue-50',
      header: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      title: 'text-white',
      code: 'text-blue-100',
      room: 'text-blue-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-blue-700'
    },
    {
      shell: 'border-emerald-200 bg-emerald-50',
      header: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      title: 'text-white',
      code: 'text-emerald-100',
      room: 'text-emerald-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-emerald-700'
    },
    {
      shell: 'border-amber-200 bg-amber-50',
      header: 'bg-gradient-to-r from-amber-500 to-orange-500',
      title: 'text-white',
      code: 'text-amber-100',
      room: 'text-amber-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-amber-700'
    },
    {
      shell: 'border-violet-200 bg-violet-50',
      header: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
      title: 'text-white',
      code: 'text-violet-100',
      room: 'text-violet-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-violet-700'
    },
    {
      shell: 'border-sky-200 bg-sky-50',
      header: 'bg-gradient-to-r from-sky-500 to-indigo-500',
      title: 'text-white',
      code: 'text-sky-100',
      room: 'text-sky-50',
      rate: 'bg-white/20 text-white border border-white/30',
      stats: {
        present: 'bg-white/20 text-white border border-white/30',
        absent: 'bg-white/20 text-white border border-white/30',
        late: 'bg-white/20 text-white border border-white/30',
        total: 'bg-white/20 text-white border border-white/30',
      },
      hint: 'text-sky-700'
    }
  ] as const

  const getSubjectPalette = (subjectKey: string) => {
    let hash = 0
    for (let i = 0; i < subjectKey.length; i++) {
      hash = (hash * 31 + subjectKey.charCodeAt(i)) >>> 0
    }
    return subjectCardPalettes[hash % subjectCardPalettes.length]
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden min-h-[200px] flex items-center">
        <div className="relative z-10 w-full">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <BarChart3 size={16} /> รายงานภาพรวม
            </span>
          </div>
          
          <h1 className="text-4xl font-black mb-2 tracking-tight">สรุปการเช็คชื่อเข้าเรียน</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mb-6">
            <CalendarIcon size={18} /> อัปเดตข้อมูลล่าสุดเมื่อสักครู่นี้
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <FileText size={16} /> {totalItems} รายการบันทึก
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <Users size={16} /> ทั้งหมด
            </div>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-8 border-white/20 flex flex-col items-center justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-yellow-400 border-l-transparent border-b-transparent transform rotate-45 transition-all duration-1000"></div>
          <span className="text-4xl font-black z-10">{isLoading ? '...' : percentage}<span className="text-xl">%</span></span>
          <span className="text-xs font-medium text-white/80 z-10">อัตราเข้าเรียน</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('overview'); window.location.hash = 'overview' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <BarChart3 size={18} /> ภาพรวม
        </button>
        <button 
          onClick={() => { setActiveTab('classroom'); window.location.hash = 'classroom' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'classroom' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Users size={18} /> รายห้องเรียน
        </button>
        <button 
          onClick={() => { setActiveTab('homeroom'); window.location.hash = 'homeroom' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'homeroom' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <CalendarIcon size={18} /> เช็คชื่อเข้าแถว
        </button>
        <button 
          onClick={() => { setActiveTab('student'); window.location.hash = 'student' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'student' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <User size={18} /> รายบุคคล
        </button>
        <button 
          onClick={() => { setActiveTab('subject'); window.location.hash = 'subject' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'subject' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Library size={18} /> รายวิชา
        </button>
        <button 
          onClick={() => { setActiveTab('export'); window.location.hash = 'export' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'export' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Download size={18} /> ออกรายงาน
        </button>
      </div>

      {/* Time Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        {[
          { id: 'today', label: 'วันนี้' },
          { id: 'week', label: 'สัปดาห์นี้' },
          { id: 'month', label: 'เดือนนี้' },
          { id: 'term', label: 'เทอมนี้' },
          { id: 'year', label: 'ทั้งปี' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveTimeFilter(filter.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all border ${
              activeTimeFilter === filter.id 
                ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CalendarIcon size={16} /> {filter.label}
          </button>
        ))}
      </div>



      {/* Views Based on activeTab */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
          <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
          <p>กำลังโหลดข้อมูลการเข้าเรียน...</p>
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 min-w-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="text-indigo-500" /> สถิติการมาเรียนตามวัน
            </h3>
            <div className="h-[350px] w-full min-w-0">
              <ResponsiveContainer width="99%" height={350} minWidth={0} minHeight={280}>
                <BarChart data={analytics?.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="present" name="มาเรียน" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="absent" name="ขาดเรียน" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="late" name="มาสาย" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="min-w-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <User className="text-indigo-500" /> สัดส่วนการเข้าเรียน
            </h3>
            <div className="h-[280px] min-h-[280px] w-full min-w-0 relative mt-4">
              <ResponsiveContainer width="99%" height={280} minWidth={0} minHeight={240}>
                <PieChart>
                  <Pie
                    data={analytics?.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics?.pieData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-800">{percentage}%</span>
                <span className="text-xs font-bold text-gray-500 mt-1">มาเรียนเฉลี่ย</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2">
              {analytics?.pieData?.map((item: any, i: number) => (
                <div key={i} className="text-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-xs font-bold text-gray-500 mb-1">{item.name}</div>
                  <div className="text-xl font-black" style={{ color: item.fill }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'classroom' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Users className="text-indigo-500" size={22} />
            <h2 className="text-lg font-bold text-gray-800">สรุปการเข้าเรียนรายห้องเรียน</h2>
          </div>
          {loadingClassroom ? (
            <div className="p-16 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
          ) : classroomRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-gray-400">
              <AlertCircle size={48} className="mb-3 opacity-40" />
              <p className="font-medium">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">ห้องเรียน</th>
                    <th className="px-6 py-4 text-center font-bold">มาเรียน</th>
                    <th className="px-6 py-4 text-center font-bold">ขาดเรียน</th>
                    <th className="px-6 py-4 text-center font-bold">มาสาย</th>
                    <th className="px-6 py-4 text-center font-bold">รวม</th>
                    <th className="px-6 py-4 text-center font-bold">% มาเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classroomRows.map(r => (
                    <tr key={r.classroomId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{r.label}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{r.present}</td>
                      <td className="px-6 py-4 text-center text-red-500 font-semibold">{r.absent}</td>
                      <td className="px-6 py-4 text-center text-amber-500 font-semibold">{r.late}</td>
                      <td className="px-6 py-4 text-center text-gray-600 font-semibold">{r.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          r.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{r.rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'homeroom' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <CalendarIcon className="text-indigo-500" size={22} />
            <h2 className="text-lg font-bold text-gray-800">สรุปการเช็คชื่อเข้าแถวรายห้องเรียน</h2>
          </div>
          {loadingHomeroom ? (
            <div className="p-16 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
          ) : homeroomRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-gray-400">
              <AlertCircle size={48} className="mb-3 opacity-40" />
              <p className="font-medium">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">ห้องเรียน</th>
                    <th className="px-6 py-4 text-center font-bold">มา</th>
                    <th className="px-6 py-4 text-center font-bold">ขาด</th>
                    <th className="px-6 py-4 text-center font-bold">สาย</th>
                    <th className="px-6 py-4 text-center font-bold">ลา</th>
                    <th className="px-6 py-4 text-center font-bold">รวม</th>
                    <th className="px-6 py-4 text-center font-bold">% มา</th>
                    <th className="px-6 py-4 text-center font-bold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {homeroomRows.map((r) => (
                    <tr key={r.classroomId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-800">{r.label}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{r.present}</td>
                      <td className="px-6 py-4 text-center text-red-500 font-semibold">{r.absent}</td>
                      <td className="px-6 py-4 text-center text-amber-500 font-semibold">{r.late}</td>
                      <td className="px-6 py-4 text-center text-sky-500 font-semibold">{r.leave}</td>
                      <td className="px-6 py-4 text-center text-gray-600 font-semibold">{r.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          r.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{r.rate}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedHomeroomClassroomId(r.classroomId)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                          ดูรายชื่อ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedHomeroomClassroomId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedHomeroomClassroomId(null)} />
              <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {homeroomClassroomDetail ? `รายชื่อเช็คชื่อเข้าแถว ห้อง ${homeroomClassroomDetail.classroomLabel}` : 'กำลังโหลด...'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">สรุปรายบุคคลในช่วงเวลาที่เลือก</p>
                  </div>
                  <button
                    onClick={() => setSelectedHomeroomClassroomId(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
                <div className="p-6">
                  {loadingHomeroomClassroomDetail ? (
                    <div className="py-10 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
                  ) : !homeroomClassroomDetail ? (
                    <div className="py-10 flex flex-col items-center text-gray-400">
                      <AlertCircle size={48} className="mb-3 opacity-40" />
                      <p className="font-medium">ไม่พบข้อมูลห้องเรียน</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                          <tr>
                            <th className="px-6 py-4 text-left font-bold">รหัส</th>
                            <th className="px-6 py-4 text-left font-bold">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-4 text-center font-bold">มา</th>
                            <th className="px-6 py-4 text-center font-bold">ขาด</th>
                            <th className="px-6 py-4 text-center font-bold">สาย</th>
                            <th className="px-6 py-4 text-center font-bold">ลา</th>
                            <th className="px-6 py-4 text-center font-bold">รวม</th>
                            <th className="px-6 py-4 text-center font-bold">% มา</th>
                            <th className="px-6 py-4 text-center font-bold">ล่าสุด</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {homeroomClassroomDetail.students.map((s) => (
                            <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{s.studentCode}</td>
                              <td className="px-6 py-4 font-semibold text-gray-800">{`${s.prefix ? `${s.prefix} ` : ''}${s.fullName}`}</td>
                              <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{s.present}</td>
                              <td className="px-6 py-4 text-center text-red-500 font-semibold">{s.absent}</td>
                              <td className="px-6 py-4 text-center text-amber-500 font-semibold">{s.late}</td>
                              <td className="px-6 py-4 text-center text-sky-500 font-semibold">{s.leave}</td>
                              <td className="px-6 py-4 text-center text-gray-600 font-semibold">{s.total}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  s.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                  s.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>{s.rate}%</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(s.latestStatus || '-')}`}>
                                  {s.latestStatus ? formatStatusThai(s.latestStatus) : '-'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {homeroomClassroomDetail.students.length === 0 && (
                            <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-500">ไม่มีข้อมูลนักเรียนในห้องนี้</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'student' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <User className="text-indigo-500" size={22} />
            <h2 className="text-lg font-bold text-gray-800">สรุปการเข้าเรียนรายบุคคล</h2>
          </div>
          <div className="p-4 border-b border-gray-100 bg-slate-50">
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="ค้นหาตามรหัส / ชื่อ / ห้อง"
              className="w-full md:w-96 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {loadingStudent ? (
            <div className="p-16 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
          ) : filteredStudentRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-gray-400">
              <AlertCircle size={48} className="mb-3 opacity-40" />
              <p className="font-medium">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">รหัส</th>
                    <th className="px-6 py-4 text-left font-bold">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-4 text-left font-bold">ห้อง</th>
                    <th className="px-6 py-4 text-center font-bold">มาเรียน</th>
                    <th className="px-6 py-4 text-center font-bold">ขาด</th>
                    <th className="px-6 py-4 text-center font-bold">สาย</th>
                    <th className="px-6 py-4 text-center font-bold">% มา</th>
                    <th className="px-6 py-4 text-center font-bold">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedStudentRows.map(r => (
                    <tr key={r.studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{r.studentCode}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{`${r.prefix ? `${r.prefix} ` : ''}${r.fullName}`}</td>
                      <td className="px-6 py-4 text-gray-500">{r.classroom}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{r.present}</td>
                      <td className="px-6 py-4 text-center text-red-500 font-semibold">{r.absent}</td>
                      <td className="px-6 py-4 text-center text-amber-500 font-semibold">{r.late}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          r.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          r.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{r.rate}%</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedStudentId(r.studentId)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                        >
                          ดูประวัติ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loadingStudent && filteredStudentRows.length > studentPageSize && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm">
              <span className="text-slate-500">หน้า {studentTablePage} / {studentTotalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setStudentTablePage((p) => Math.max(1, p - 1))}
                  disabled={studentTablePage === 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-50"
                >
                  ก่อนหน้า
                </button>
                <button
                  onClick={() => setStudentTablePage((p) => Math.min(studentTotalPages, p + 1))}
                  disabled={studentTablePage >= studentTotalPages}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-50"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {selectedStudentId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedStudentId(null)} />
              <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">ประวัติรายบุคคล</h3>
                  <button
                    onClick={() => setSelectedStudentId(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
                <div className="p-6">
              {loadingStudentDetail ? (
                <div className="py-10 text-center text-gray-500">กำลังโหลดประวัติรายบุคคล...</div>
              ) : !studentDetail ? (
                <div className="py-10 text-center text-gray-500">ไม่พบข้อมูลนักเรียน</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm text-slate-600">
                        {studentDetail.studentCode} • {`${studentDetail.prefix ? `${studentDetail.prefix} ` : ''}${studentDetail.fullName}`} • ห้อง {studentDetail.classroom}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">สรุปเช็คชื่อรายวิชา</h4>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">มา {studentDetail.classroomAttendanceSummary.present}</div>
                        <div className="rounded-lg bg-red-50 p-2 text-red-700">ขาด {studentDetail.classroomAttendanceSummary.absent}</div>
                        <div className="rounded-lg bg-amber-50 p-2 text-amber-700">สาย {studentDetail.classroomAttendanceSummary.late}</div>
                        <div className="rounded-lg bg-sky-50 p-2 text-sky-700">ลา {studentDetail.classroomAttendanceSummary.leave}</div>
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">รวม {studentDetail.classroomAttendanceSummary.total}</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">สรุปเช็คชื่อเข้าแถว</h4>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">มา {studentDetail.homeroomSummary.present}</div>
                        <div className="rounded-lg bg-red-50 p-2 text-red-700">ขาด {studentDetail.homeroomSummary.absent}</div>
                        <div className="rounded-lg bg-amber-50 p-2 text-amber-700">สาย {studentDetail.homeroomSummary.late}</div>
                        <div className="rounded-lg bg-sky-50 p-2 text-sky-700">ลา {studentDetail.homeroomSummary.leave}</div>
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-700">รวม {studentDetail.homeroomSummary.total}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">ประวัติการเช็คชื่อรายวิชา</div>
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                              <th className="px-4 py-2 text-left">วันที่</th>
                              <th className="px-4 py-2 text-left">วิชา</th>
                              <th className="px-4 py-2 text-center">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentDetail.classroomAttendanceHistory.length === 0 && (
                              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">ไม่มีประวัติในช่วงเวลานี้</td></tr>
                            )}
                            {studentDetail.classroomAttendanceHistory
                              .slice((subjectHistoryPage - 1) * historyPageSize, subjectHistoryPage * historyPageSize)
                              .map((h) => (
                              <tr key={h.id}>
                                <td className="px-4 py-2 text-slate-600">{formatThaiDate(h.date)}</td>
                                <td className="px-4 py-2 text-slate-700">{h.subjectName}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`rounded-full px-2 py-1 font-semibold ${statusClass(h.status)}`}>{formatStatusThai(h.status)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {studentDetail.classroomAttendanceHistory.length > historyPageSize && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
                          <span className="text-slate-500">
                            หน้า {subjectHistoryPage} / {Math.max(1, Math.ceil(studentDetail.classroomAttendanceHistory.length / historyPageSize))}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSubjectHistoryPage((p) => Math.max(1, p - 1))}
                              disabled={subjectHistoryPage === 1}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-700 disabled:opacity-50"
                            >
                              ก่อนหน้า
                            </button>
                            <button
                              onClick={() => setSubjectHistoryPage((p) => Math.min(Math.ceil(studentDetail.classroomAttendanceHistory.length / historyPageSize), p + 1))}
                              disabled={subjectHistoryPage >= Math.ceil(studentDetail.classroomAttendanceHistory.length / historyPageSize)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-700 disabled:opacity-50"
                            >
                              ถัดไป
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">ประวัติการเช็คชื่อเข้าแถว</div>
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase">
                            <tr>
                              <th className="px-4 py-2 text-left">วันที่</th>
                              <th className="px-4 py-2 text-center">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentDetail.homeroomHistory.length === 0 && (
                              <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">ไม่มีประวัติในช่วงเวลานี้</td></tr>
                            )}
                            {studentDetail.homeroomHistory
                              .slice((homeroomHistoryPage - 1) * historyPageSize, homeroomHistoryPage * historyPageSize)
                              .map((h) => (
                              <tr key={h.id}>
                                <td className="px-4 py-2 text-slate-600">{formatThaiDate(h.date)}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`rounded-full px-2 py-1 font-semibold ${statusClass(h.status)}`}>{formatStatusThai(h.status)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {studentDetail.homeroomHistory.length > historyPageSize && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
                          <span className="text-slate-500">
                            หน้า {homeroomHistoryPage} / {Math.max(1, Math.ceil(studentDetail.homeroomHistory.length / historyPageSize))}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setHomeroomHistoryPage((p) => Math.max(1, p - 1))}
                              disabled={homeroomHistoryPage === 1}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-700 disabled:opacity-50"
                            >
                              ก่อนหน้า
                            </button>
                            <button
                              onClick={() => setHomeroomHistoryPage((p) => Math.min(Math.ceil(studentDetail.homeroomHistory.length / historyPageSize), p + 1))}
                              disabled={homeroomHistoryPage >= Math.ceil(studentDetail.homeroomHistory.length / historyPageSize)}
                              className="rounded-lg border border-slate-300 px-2.5 py-1 text-slate-700 disabled:opacity-50"
                            >
                              ถัดไป
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'subject' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Library className="text-indigo-500" size={22} />
            <h2 className="text-lg font-bold text-gray-800">สรุปการเข้าเรียนรายวิชา</h2>
          </div>
          {loadingSubject ? (
            <div className="p-16 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
          ) : subjectRows.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-gray-400">
              <AlertCircle size={48} className="mb-3 opacity-40" />
              <p className="font-medium">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {subjectRows.map((r) => (
                (() => {
                  const palette = getSubjectPalette(`${r.subjectId}-${r.subjectCode}`)
                  return (
                <button
                  key={`${r.subjectId}-${r.classroomLabel}`}
                  onClick={() => setSelectedSubjectId(r.subjectId)}
                  className={`rounded-2xl border overflow-hidden text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${palette.shell}`}
                >
                  <div className={`px-5 py-4 ${palette.header}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-xs font-mono ${palette.code}`}>{r.subjectCode}</p>
                        <h3 className={`text-base font-bold ${palette.title}`}>{r.subjectName}</h3>
                        <p className={`text-sm mt-1 ${palette.room}`}>ห้อง {r.classroomLabel}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${palette.rate}`}>{r.rate}% มาเรียน</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${palette.stats.present}`}>มา {r.present}</span>
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${palette.stats.absent}`}>ขาด {r.absent}</span>
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${palette.stats.late}`}>สาย {r.late}</span>
                      <span className={`px-2.5 py-1 rounded-full font-semibold ${palette.stats.total}`}>รวม {r.total}</span>
                    </div>
                  </div>
                  <div className={`p-4 text-xs font-semibold ${palette.hint}`}>
                    กดการ์ดเพื่อดูตารางรายชื่อนักเรียนและสถานะเช็คชื่อ
                  </div>
                </button>
                  )
                })()
              ))}
            </div>
          )}

          {selectedSubjectId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedSubjectId(null)} />
              <div className="relative z-10 w-full max-w-[95vw] max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {subjectDetail ? `${subjectDetail.subjectCode} — ${subjectDetail.subjectName}` : 'กำลังโหลด...'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">ตารางการเช็คชื่อรายครั้ง แยกตามนักเรียน</p>
                  </div>
                  <button
                    onClick={() => setSelectedSubjectId(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    ปิด
                  </button>
                </div>

                <div className="p-4 overflow-auto max-h-[80vh]">
                  {loadingSubjectDetail ? (
                    <div className="py-12 flex justify-center"><RefreshCw size={32} className="animate-spin text-gray-300" /></div>
                  ) : !subjectDetail || subjectSessions.length === 0 ? (
                    <div className="py-12 flex flex-col items-center text-gray-400">
                      <AlertCircle size={48} className="mb-3 opacity-40" />
                      <p className="font-medium">ไม่พบข้อมูลการเช็คชื่อของวิชานี้ในช่วงเวลาที่เลือก</p>
                    </div>
                  ) : (
                    <table className="w-full min-w-[980px] text-xs border border-slate-300">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2 text-left font-bold">รหัสนักเรียน</th>
                          <th className="border border-slate-300 px-3 py-2 text-left font-bold">ชื่อ-นามสกุล</th>
                          {subjectSessionColumns.map((col) => (
                            <th key={col.sessionId} className="border border-slate-300 px-2 py-2 text-center font-bold whitespace-nowrap">
                              {formatThaiDate(col.sessionDate)}
                            </th>
                          ))}
                          <th className="border border-slate-300 px-3 py-2 text-center font-bold">รวมเช็ค/ครั้ง</th>
                          <th className="border border-slate-300 px-3 py-2 text-center font-bold">คิดเป็น%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectStudents.length === 0 && (
                          <tr>
                            <td colSpan={subjectSessionColumns.length + 4} className="px-4 py-8 text-center text-slate-400">
                              ไม่มีนักเรียนในข้อมูลวิชานี้
                            </td>
                          </tr>
                        )}
                        {subjectStudents.map((student) => {
                          const checkedCount = subjectSessionColumns.filter((col) => {
                            const status = student.bySession[col.sessionId]
                            return status === 'PRESENT' || status === 'LATE' || status === 'LEAVE'
                          }).length
                          const totalSessions = subjectSessionColumns.length
                          const percent = totalSessions > 0 ? Math.round((checkedCount / totalSessions) * 100) : 0
                          return (
                            <tr key={student.studentId} className="hover:bg-slate-50">
                              <td className="border border-slate-300 px-3 py-2 font-mono">{student.studentCode}</td>
                              <td className="border border-slate-300 px-3 py-2">{student.fullName}</td>
                              {subjectSessionColumns.map((col) => {
                                const status = student.bySession[col.sessionId]
                                const statusCellClass =
                                  status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                  status === 'ABSENT' ? 'bg-red-100 text-red-700 border-red-300' :
                                  status === 'LATE' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                  status === 'LEAVE' ? 'bg-sky-100 text-sky-700 border-sky-300' :
                                  'bg-slate-100 text-slate-400 border-slate-200'
                                const statusLabel =
                                  status === 'PRESENT' ? 'มา' :
                                  status === 'ABSENT' ? 'ขาด' :
                                  status === 'LATE' ? 'สาย' :
                                  status === 'LEAVE' ? 'ลา' :
                                  '-'
                                return (
                                  <td key={`${student.studentId}-${col.sessionId}`} className="border border-slate-300 px-2 py-2 text-center">
                                    <span className={`inline-flex min-w-8 items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-bold ${statusCellClass}`}>
                                      {statusLabel}
                                    </span>
                                  </td>
                                )
                              })}
                              <td className="border border-slate-300 px-3 py-2 text-center font-semibold">{checkedCount}</td>
                              <td className="border border-slate-300 px-3 py-2 text-center font-bold text-emerald-700">{percent}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-500 min-h-[400px] flex flex-col items-center justify-center">
          <Download size={64} className="mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-700 mb-6">ส่งออกรายงาน (Export)</h2>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-md">
              <FileSpreadsheet size={20} /> ส่งออกเป็น CSV
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 transition-all shadow-md">
              <FileText size={20} /> ส่งออกเป็น PDF
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}
