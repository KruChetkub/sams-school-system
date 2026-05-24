import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getAnalyticsData, getPendingClassroomChecksToday, getCheckedHomeroomClassroomsToday, getAttendanceTrendToday, getAttendanceDailyRates, getClassroomReport, getMonthlyAttendanceCompare, getAttendanceStatusSummaryByDate, getHomeroomStatusSummaryByDate } from '../services/dashboardService'
import { Users, GraduationCap, BookOpen, Library, TrendingUp, Calendar as CalIcon, ClipboardCheck, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, Line } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())
  const [selectedSummaryDate, setSelectedSummaryDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSummaryDateInput, setSelectedSummaryDateInput] = useState('')
  const [selectedSummaryDateError, setSelectedSummaryDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const dateTimeFormatter = new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  })

  const formattedDateTime = dateTimeFormatter.format(now)

  const formatThaiInputDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const yearBE = date.getFullYear() + 543
    return `${day}/${month}/${yearBE}`
  }

  const parseThaiInputDate = (input: string) => {
    const parts = input.split('/').map((p) => p.trim())
    if (parts.length !== 3) return null
    const [dayStr, monthStr, yearStr] = parts
    if (!/^[0-9]{1,2}$/.test(dayStr) || !/^[0-9]{1,2}$/.test(monthStr) || !/^[0-9]{4}$/.test(yearStr)) return null
    const day = Number(dayStr)
    const month = Number(monthStr)
    const yearCE = Number(yearStr) - 543
    if (yearCE < 1900) return null
    const date = new Date(yearCE, month - 1, day)
    if (date.getFullYear() !== yearCE || date.getMonth() !== month - 1 || date.getDate() !== day) return null
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    setSelectedSummaryDateInput(formatThaiInputDate(selectedSummaryDate))
    setSelectedSummaryDateError('')
  }, [selectedSummaryDate])

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const calendarCells = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const calendarHeader = `${thaiMonths[calendarMonth]} ${calendarYear + 543}`

  const openDatePicker = () => {
    const date = new Date(`${selectedSummaryDate}T00:00:00`)
    setCalendarMonth(date.getMonth())
    setCalendarYear(date.getFullYear())
    setShowDatePicker(true)
  }

  const closeDatePicker = () => setShowDatePicker(false)

  const selectCalendarDate = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day)
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setSelectedSummaryDate(isoDate)
    setShowDatePicker(false)
  }

  const commitThaiDateInput = () => {
    const parsed = parseThaiInputDate(selectedSummaryDateInput)
    if (parsed) {
      setSelectedSummaryDate(parsed)
      setSelectedSummaryDateError('')
      const parsedDate = new Date(`${parsed}T00:00:00`)
      setCalendarMonth(parsedDate.getMonth())
      setCalendarYear(parsedDate.getFullYear())
      return
    }
    setSelectedSummaryDateError('รูปแบบวันที่ไม่ถูกต้อง โปรดใช้ วว/ดด/ปปปป')
  }

  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['dashboard_stats'], queryFn: getDashboardStats })
  const { data: pendingChecks, isLoading: loadingPendingChecks } = useQuery({
    queryKey: ['dashboard_pending_checks_today'],
    queryFn: getPendingClassroomChecksToday,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: checkedHomeroomToday, isLoading: loadingHomeroomToday } = useQuery({
    queryKey: ['dashboard_homeroom_checked_today'],
    queryFn: getCheckedHomeroomClassroomsToday,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({ 
    queryKey: ['dashboard_analytics', 'month'], 
    queryFn: () => getAnalyticsData('month') 
  })
  const { data: trendToday, isLoading: loadingTrendToday } = useQuery({
    queryKey: ['dashboard_attendance_trend_today'],
    queryFn: getAttendanceTrendToday,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: classroomWeekRows = [], isLoading: loadingClassroomWeekRows } = useQuery({
    queryKey: ['dashboard_classroom_report_week'],
    queryFn: () => getClassroomReport('week'),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: dailyRates = [], isLoading: loadingDailyRates } = useQuery({
    queryKey: ['dashboard_attendance_daily_rates_7d'],
    queryFn: () => getAttendanceDailyRates(7),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: monthlyCompare, isLoading: loadingMonthlyCompare } = useQuery({
    queryKey: ['dashboard_monthly_attendance_compare'],
    queryFn: getMonthlyAttendanceCompare,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: dailyStatusSummary, isLoading: loadingDailyStatusSummary } = useQuery({
    queryKey: ['dashboard_attendance_status_summary', selectedSummaryDate],
    queryFn: () => getAttendanceStatusSummaryByDate(selectedSummaryDate),
    refetchOnWindowFocus: false,
    staleTime: 15000,
  })
  const { data: homeroomStatusSummary, isLoading: loadingHomeroomStatusSummary } = useQuery({
    queryKey: ['dashboard_homeroom_status_summary', selectedSummaryDate],
    queryFn: () => getHomeroomStatusSummaryByDate(selectedSummaryDate),
    refetchOnWindowFocus: false,
    staleTime: 15000,
  })
  if (loadingStats || loadingAnalytics || loadingPendingChecks || loadingHomeroomToday || loadingDailyStatusSummary || loadingHomeroomStatusSummary) return <div className="p-8 text-center text-gray-500 mt-20">กำลังโหลดข้อมูล Dashboard...</div>

  const cards = [
    { title: 'จำนวนนักเรียนทั้งหมด', value: stats?.students, icon: <GraduationCap size={32} className="text-white" />, bg: 'bg-gradient-to-br from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
    { title: 'บุคลากรทางการศึกษา', value: stats?.teachers, icon: <Users size={32} className="text-white" />, bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200' },
    { title: 'ห้องเรียนที่เปิดสอน', value: stats?.classrooms, icon: <BookOpen size={32} className="text-white" />, bg: 'bg-gradient-to-br from-purple-500 to-purple-600', shadow: 'shadow-purple-200' },
    { title: 'รายวิชาในระบบ', value: stats?.subjects, icon: <Library size={32} className="text-white" />, bg: 'bg-gradient-to-br from-orange-400 to-orange-600', shadow: 'shadow-orange-200', onClick: () => navigate('/reports#subject') },
    { title: 'ห้องที่เช็คเข้าแถววันนี้', value: checkedHomeroomToday?.checkedClassroomCount ?? 0, icon: <CalIcon size={32} className="text-white" />, bg: 'bg-gradient-to-br from-cyan-500 to-sky-700', shadow: 'shadow-cyan-200', onClick: () => navigate('/reports#homeroom') },
    { title: 'ห้องที่ยังไม่เช็คชื่อวันนี้', value: pendingChecks?.pendingClassroomCount ?? 0, icon: <ClipboardCheck size={32} className="text-white" />, bg: 'bg-gradient-to-br from-rose-500 to-rose-700', shadow: 'shadow-rose-200', onClick: () => navigate('/attendance') },
  ]

  const totalAttendance = analytics?.pieData?.reduce((acc: number, curr: any) => acc + (curr.name !== 'ยังไม่มีข้อมูล' ? curr.value : 0), 0) || 0;
  const presentCount = analytics?.pieData?.find((d: any) => d.name === 'มาเรียน')?.value || 0;
  const percentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  
  const gaugeRate = monthlyCompare?.currentMonthRate ?? percentage
  const gaugeDelta = monthlyCompare?.deltaRate ?? 0
  const gaugeColor = gaugeRate >= 80 ? '#10B981' : gaugeRate >= 60 ? '#F59E0B' : '#EF4444'
  const gaugeTarget = 85

  const legendTextClass = (name: string) => {
    if (name === 'มาเรียน') return 'text-emerald-600'
    if (name === 'ขาดเรียน') return 'text-red-600'
    if (name === 'มาสาย') return 'text-amber-600'
    return 'text-slate-600'
  }

  const topRiskClassrooms = [...classroomWeekRows]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map((room) => ({
      ...room,
      roomLabel: `ห้อง ${room.label}`,
      fill: room.rate < 60 ? '#EF4444' : room.rate < 80 ? '#F59E0B' : '#10B981',
    }))

  const weeklyTrendData = (analytics?.chartData || []).map((d: any) => {
    const total = (d.present || 0) + (d.absent || 0) + (d.late || 0)
    const presentRate = total > 0 ? Math.round(((d.present || 0) / total) * 100) : 0
    return { ...d, total, presentRate }
  })

  const thaiSelectedDate = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'buddhist',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(`${selectedSummaryDate}T00:00:00`))

  const selectedDateStatusCards = [
    { title: 'มา', value: dailyStatusSummary?.present ?? 0, bg: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'สาย', value: dailyStatusSummary?.late ?? 0, bg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { title: 'ขาด', value: dailyStatusSummary?.absent ?? 0, bg: 'bg-gradient-to-br from-rose-500 to-red-600' },
    { title: 'ลา', value: dailyStatusSummary?.leave ?? 0, bg: 'bg-gradient-to-br from-sky-500 to-cyan-700' },
  ]
  const selectedDateHomeroomCards = [
    { title: 'มา', value: homeroomStatusSummary?.present ?? 0, bg: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'สาย', value: homeroomStatusSummary?.late ?? 0, bg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { title: 'ขาด', value: homeroomStatusSummary?.absent ?? 0, bg: 'bg-gradient-to-br from-rose-500 to-red-600' },
    { title: 'ลา', value: homeroomStatusSummary?.leave ?? 0, bg: 'bg-gradient-to-br from-sky-500 to-cyan-700' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">ภาพรวมและสถิติระบบจัดการการเข้าเรียน (SAMS)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-700 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-400/50" />
            ออนไลน์
          </div>
          <div className="rounded-3xl bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
            {formattedDateTime}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            onClick={card.onClick}
            className={`${card.bg} p-6 rounded-[2rem] shadow-xl ${card.shadow} flex items-center justify-between text-white overflow-hidden relative group ${card.onClick ? 'cursor-pointer hover:-translate-y-1 transition-all duration-300' : ''}`}
          >
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              {React.cloneElement(card.icon as React.ReactElement, { size: 100 })}
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-white/80 mb-1">{card.title}</p>
              <h3 className="text-5xl font-black">{card.value}</h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md relative z-10 border border-white/20">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {pendingChecks && pendingChecks.pendingClassrooms.length > 0 && (
        <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold mb-2">ห้องที่ยังไม่เช็คชื่อรายวิชาวันนี้</p>
          <p>{pendingChecks.pendingClassrooms.join(', ')}</p>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-rose-50 to-orange-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">สรุปสถานะนักเรียนตามวันที่เลือก</h2>
            <p className="text-sm text-slate-500">วันที่ {thaiSelectedDate} • รวมทั้งหมด {dailyStatusSummary?.total ?? 0} คน</p>
          </div>
          <div className="w-full md:w-[260px]">
            <label htmlFor="dashboard-summary-date" className="block text-sm font-medium text-slate-700 mb-2"></label>
            <input
              id="dashboard-summary-date"
              type="text"
              inputMode="numeric"
              placeholder="วว/ดด/ปปปป"
              value={selectedSummaryDateInput}
              onFocus={openDatePicker}
              onClick={openDatePicker}
              onChange={(e) => {
                const value = e.target.value
                setSelectedSummaryDateInput(value)
              }}
              onBlur={commitThaiDateInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitThaiDateInput()
                }
              }}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            {showDatePicker && (
              <div className="absolute z-20 top-full mt-2 w-full rounded-3xl border border-slate-200 bg-white shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11)
                      setCalendarYear((prev) => prev - 1)
                    } else setCalendarMonth((prev) => prev - 1)
                  }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">‹</button>
                  <div className="text-sm font-semibold text-slate-700">{calendarHeader}</div>
                  <button type="button" onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0)
                      setCalendarYear((prev) => prev + 1)
                    } else setCalendarMonth((prev) => prev + 1)
                  }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
                  {thaiWeekdays.map((day) => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarCells.map((day, index) => (
                    <button
                      key={`${calendarYear}-${calendarMonth}-${index}`}
                      type="button"
                      onClick={() => day && selectCalendarDate(day)}
                      className={`h-10 rounded-xl ${day ? 'hover:bg-blue-50 text-slate-700' : 'pointer-events-none text-transparent'} ${
                        day === new Date(`${selectedSummaryDate}T00:00:00`).getDate() &&
                        calendarMonth === new Date(`${selectedSummaryDate}T00:00:00`).getMonth() &&
                        calendarYear === new Date(`${selectedSummaryDate}T00:00:00`).getFullYear()
                          ? 'bg-blue-600 text-white'
                          : ''
                      }`}
                    >
                      {day || ''}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <button type="button" onClick={closeDatePicker} className="rounded-lg px-3 py-2 hover:bg-slate-100">ปิด</button>
                  <div>เลือกวันที่ไทยแล้วเก็บเป็นระบบ</div>
                </div>
              </div>
            )}
            <p className={`mt-1 text-xs ${selectedSummaryDateError ? 'text-red-500' : 'text-slate-500'}`}>
              {selectedSummaryDateError || ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">1. สรุปรายวิชา</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDateStatusCards.map((card) => (
                <div key={`classroom-${card.title}`} className={`${card.bg} rounded-2xl p-4 text-white shadow-lg`}>
                  <p className="text-sm font-semibold text-white/85">{card.title}</p>
                  <p className="mt-1 text-3xl font-black">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-100 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">2. สรุปเข้าแถว</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDateHomeroomCards.map((card) => (
                <div key={`homeroom-${card.title}`} className={`${card.bg} rounded-2xl p-4 text-white shadow-lg`}>
                  <p className="text-sm font-semibold text-white/85">{card.title}</p>
                  <p className="mt-1 text-3xl font-black">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        ฟีเจอร์วิเคราะห์ขั้นสูง (อัตราเข้าเรียนวันนี้เทียบเมื่อวาน, Top 5 ห้องเสี่ยง, อัตราการเข้าเรียนเฉลี่ย) ถูกซ่อนไว้ชั่วคราว
      </div>

      {/* Advanced analytics hidden temporarily */}
    </div>
  )
}
