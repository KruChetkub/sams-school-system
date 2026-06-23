import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getAnalyticsData, getPendingClassroomChecksToday, getCheckedHomeroomClassroomsToday, getAttendanceTrendToday, getAttendanceDailyRates, getClassroomReport, getMonthlyAttendanceCompare, getAttendanceStatusSummaryByDate, getHomeroomStatusSummaryByDate } from '../services/dashboardService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { Users, GraduationCap, BookOpen, Library, TrendingUp, Calendar as CalIcon, ClipboardCheck, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const GaugeChart = ({ rate, color, target }: { rate: number, color: string, target: number }) => {
  const radius = 70;
  const strokeWidth = 16;
  const cx = 100;
  const cy = 90;
  const circumference = Math.PI * radius;
  const safeRate = Math.min(Math.max(rate, 0), 100);
  const strokeDashoffset = circumference - (safeRate / 100) * circumference;

  const safeTarget = Math.min(Math.max(target, 0), 100);
  const targetAngle = Math.PI - (safeTarget / 100) * Math.PI;
  const targetX1 = cx + Math.cos(targetAngle) * (radius - strokeWidth / 2 - 4);
  const targetY1 = cy - Math.sin(targetAngle) * (radius - strokeWidth / 2 - 4);
  const targetX2 = cx + Math.cos(targetAngle) * (radius + strokeWidth / 2 + 4);
  const targetY2 = cy - Math.sin(targetAngle) * (radius + strokeWidth / 2 + 4);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="200" height="100" viewBox="0 0 200 100" className="overflow-visible">
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <line x1={targetX1} y1={targetY1} x2={targetX2} y2={targetY2} stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <text x={targetX2 + 5} y={targetY2 - 5} fill="#94a3b8" fontSize="10" fontWeight="bold">เป้า</text>
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-3xl sm:text-4xl font-black" style={{ color }}>{safeRate}%</span>
      </div>
    </div>
  )
}

const StackedBar = ({ data }: { data: any[] }) => {
  const safeData = data || [];
  const total = safeData.reduce((sum, d) => sum + (d.name !== 'ยังไม่มีข้อมูล' ? d.value : 0), 0);
  if (total === 0) return <div className="text-slate-400 dark:text-slate-500 text-center py-10 flex flex-col items-center justify-center h-full"><span className="text-2xl mb-2 opacity-50">📊</span>ยังไม่มีข้อมูลเพียงพอ</div>;

  return (
    <div className="w-full flex flex-col h-full justify-center">
      <div className="h-10 sm:h-12 flex w-full rounded-full overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-4 sm:mb-6">
        {safeData.filter(d => d.name !== 'ยังไม่มีข้อมูล' && d.value > 0).map((d, i) => {
          const widthPct = (d.value / total) * 100;
          return (
            <div key={i} className="h-full transition-all duration-1000 hover:brightness-110 flex items-center justify-center border-r border-white/20 last:border-0" style={{ width: `${widthPct}%`, backgroundColor: d.fill || d.color }}>
              {widthPct > 8 && <span className="text-white text-[10px] sm:text-xs font-bold opacity-95">{Math.round(widthPct)}%</span>}
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {safeData.filter(d => d.name !== 'ยังไม่มีข้อมูล').map((d, i) => (
          <div key={i} className="flex flex-col items-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-1.5 mb-1 truncate max-w-full">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: d.fill || d.color }}></div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{d.name}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">{d.value}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">คน</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { selectedYear } = useAcademicYearStore()
  const academicYearId = selectedYear?.id
  const [now, setNow] = useState(new Date())
  const [selectedSummaryDate, setSelectedSummaryDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSummaryDateInput, setSelectedSummaryDateInput] = useState('')
  const [selectedSummaryDateError, setSelectedSummaryDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false)
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

  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['dashboard_stats', academicYearId], queryFn: () => getDashboardStats(academicYearId) })
  const { data: pendingChecks, isLoading: loadingPendingChecks } = useQuery({
    queryKey: ['dashboard_pending_checks_today', academicYearId],
    queryFn: () => getPendingClassroomChecksToday(academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: checkedHomeroomToday, isLoading: loadingHomeroomToday } = useQuery({
    queryKey: ['dashboard_homeroom_checked_today', academicYearId],
    queryFn: () => getCheckedHomeroomClassroomsToday(academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  })
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['dashboard_analytics', 'month', academicYearId],
    queryFn: () => getAnalyticsData('month', academicYearId),
    enabled: showAdvancedAnalytics,
  })
  const { data: trendToday, isLoading: loadingTrendToday } = useQuery({
    queryKey: ['dashboard_attendance_trend_today', academicYearId],
    queryFn: () => getAttendanceTrendToday(academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: showAdvancedAnalytics,
  })
  const { data: classroomWeekRows = [], isLoading: loadingClassroomWeekRows } = useQuery({
    queryKey: ['dashboard_classroom_report_week', academicYearId],
    queryFn: () => getClassroomReport('week', academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: showAdvancedAnalytics,
  })
  const { data: dailyRates = [], isLoading: loadingDailyRates } = useQuery({
    queryKey: ['dashboard_attendance_daily_rates_7d', academicYearId],
    queryFn: () => getAttendanceDailyRates(7, academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: showAdvancedAnalytics,
  })
  const { data: monthlyCompare, isLoading: loadingMonthlyCompare } = useQuery({
    queryKey: ['dashboard_monthly_attendance_compare', academicYearId],
    queryFn: () => getMonthlyAttendanceCompare(academicYearId),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: showAdvancedAnalytics,
  })
  const { data: dailyStatusSummary, isLoading: loadingDailyStatusSummary } = useQuery({
    queryKey: ['dashboard_attendance_status_summary', selectedSummaryDate, academicYearId],
    queryFn: () => getAttendanceStatusSummaryByDate(selectedSummaryDate, academicYearId),
    refetchOnWindowFocus: false,
    staleTime: 15000,
  })
  const { data: homeroomStatusSummary, isLoading: loadingHomeroomStatusSummary } = useQuery({
    queryKey: ['dashboard_homeroom_status_summary', selectedSummaryDate, academicYearId],
    queryFn: () => getHomeroomStatusSummaryByDate(selectedSummaryDate, academicYearId),
    refetchOnWindowFocus: false,
    staleTime: 15000,
  })

  if (loadingStats || loadingPendingChecks || loadingHomeroomToday || loadingDailyStatusSummary || loadingHomeroomStatusSummary) return <div className="p-8 text-center text-gray-500 mt-20">กำลังโหลดข้อมูล Dashboard...</div>

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

  const topRiskClassrooms = [...classroomWeekRows]
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5)
    .map((room) => ({
      ...room,
      roomLabel: `ห้อง ${room.label}`,
      fill: room.rate < 60 ? '#EF4444' : room.rate < 80 ? '#F59E0B' : '#10B981',
    }))

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
    <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-screen w-full overflow-hidden text-slate-900 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 w-full">
        <div>
          <h1 className="text-[clamp(1.5rem,4vw,1.875rem)] font-black text-slate-900 dark:text-white tracking-tight leading-tight">Executive Dashboard</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">ภาพรวมและสถิติระบบจัดการการเข้าเรียน (SAMS)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold min-h-[40px] sm:min-h-[44px] justify-center">
            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-400/50 shrink-0" />
            ออนไลน์
          </div>
          <div className="rounded-3xl bg-white dark:bg-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[40px] sm:min-h-[44px] flex items-center justify-center">
            {formattedDateTime}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={`${card.bg} p-3.5 sm:p-5 lg:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl ${card.shadow} flex items-center justify-between text-white overflow-hidden relative group transition-all duration-300 ${card.onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
          >
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 sm:translate-x-4 sm:-translate-y-4 group-hover:scale-110 transition-transform duration-500">
              {React.cloneElement(card.icon as React.ReactElement, { size: undefined, className: "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white" })}
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white/80 mb-0.5 sm:mb-1 truncate">{card.title}</p>
              <h3 className="text-[clamp(1.5rem,4vw,2.5rem)] font-black leading-none">{card.value}</h3>
            </div>
            <div className="hidden min-[400px]:flex sm:flex md:flex lg:hidden 2xl:flex w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-white/20 items-center justify-center backdrop-blur-md relative z-10 border border-white/20 shrink-0 ml-2">
              {React.cloneElement(card.icon as React.ReactElement, { size: undefined, className: "w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" })}
            </div>
          </div>
        ))}
      </div>

      {pendingChecks && pendingChecks.pendingClassrooms.length > 0 && (
        <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 dark:bg-rose-950/20 p-4 text-sm text-rose-800 dark:text-rose-300">
          <p className="font-semibold mb-2">ห้องที่ยังไม่เช็คชื่อรายวิชาวันนี้</p>
          <p>{pendingChecks.pendingClassrooms.join(', ')}</p>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-fuchsia-200/70 bg-gradient-to-br from-fuchsia-50 via-rose-50 to-orange-100 dark:from-slate-900 dark:to-slate-950 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">สรุปสถานะนักเรียนตามวันที่เลือก</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">วันที่ {thaiSelectedDate} • รวมทั้งหมด {dailyStatusSummary?.total ?? 0} คน</p>
          </div>
          <div className="relative w-full sm:w-[240px] md:w-[260px]">
            <label htmlFor="dashboard-summary-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"></label>
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
              className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 min-h-[44px] outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm sm:text-base shadow-sm"
            />
            {showDatePicker && (
              <div className="absolute z-20 top-full mt-2 right-0 left-0 mx-auto sm:mx-0 sm:left-auto w-[calc(100vw-2.5rem)] xs:w-[300px] sm:w-[320px] rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11)
                      setCalendarYear((prev) => prev - 1)
                    } else setCalendarMonth((prev) => prev - 1)
                  }} className="w-11 h-11 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-lg transition-colors">‹</button>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{calendarHeader}</div>
                  <button type="button" onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0)
                      setCalendarYear((prev) => prev + 1)
                    } else setCalendarMonth((prev) => prev + 1)
                  }} className="w-11 h-11 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-lg transition-colors">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  {thaiWeekdays.map((day) => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarCells.map((day, index) => (
                    <button
                      key={`${calendarYear}-${calendarMonth}-${index}`}
                      type="button"
                      onClick={() => day && selectCalendarDate(day)}
                      className={`h-11 sm:h-10 w-full rounded-xl transition-colors ${day ? 'hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200' : 'pointer-events-none text-transparent'} ${day === new Date(`${selectedSummaryDate}T00:00:00`).getDate() &&
                          calendarMonth === new Date(`${selectedSummaryDate}T00:00:00`).getMonth() &&
                          calendarYear === new Date(`${selectedSummaryDate}T00:00:00`).getFullYear()
                          ? 'bg-blue-600 text-white font-bold'
                          : ''
                        }`}
                    >
                      {day || ''}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <button type="button" onClick={closeDatePicker} className="rounded-lg px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300 min-h-[44px] flex items-center justify-center">ปิด</button>
                  <div className="text-[10px] text-right">เลือกวันที่ไทยเพื่อคำนวณ</div>
                </div>
              </div>
            )}
            <p className={`mt-1 text-xs ${selectedSummaryDateError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {selectedSummaryDateError || ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-100 dark:from-slate-850 dark:to-slate-900 p-4">
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">1. สรุปรายวิชา</p>
            <div className="grid grid-cols-2 gap-3">
              {selectedDateStatusCards.map((card) => (
                <div key={`classroom-${card.title}`} className={`${card.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-md sm:shadow-lg`}>
                  <p className="text-xs sm:text-sm font-semibold text-white/85">{card.title}</p>
                  <p className="mt-1 text-[clamp(1.5rem,4vw,2.25rem)] font-black leading-none">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-100 dark:from-slate-850 dark:to-slate-900 p-4">
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">2. สรุปเข้าแถว</p>
            <div className="grid grid-cols-2 gap-3">
              {selectedDateHomeroomCards.map((card) => (
                <div key={`homeroom-${card.title}`} className={`${card.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-md sm:shadow-lg`}>
                  <p className="text-xs sm:text-sm font-semibold text-white/85">{card.title}</p>
                  <p className="mt-1 text-[clamp(1.5rem,4vw,2.25rem)] font-black leading-none">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        {!showAdvancedAnalytics ? (
          <div className="rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <TrendingUp size={48} className="text-slate-300 dark:text-slate-650 mb-4 sm:mb-5 relative z-10 group-hover:text-indigo-400 transition-colors duration-300" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-2 relative z-10">ข้อมูลวิเคราะห์ขั้นสูง</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 sm:mb-8 relative z-10">
              แสดงอัตราการเข้าเรียนวันนี้เทียบกับเมื่อวาน, 5 อันดับห้องเรียนที่มีความเสี่ยง, และอัตราการเข้าเรียนเฉลี่ยรายเดือน
            </p>
            <button
              onClick={() => setShowAdvancedAnalytics(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 relative z-10 hover:-translate-y-0.5 min-h-[44px]"
            >
              <TrendingUp size={18} />
              โหลดข้อมูลวิเคราะห์ขั้นสูง
            </button>
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-4 relative z-10">ระบบไม่ได้โหลดข้อมูลส่วนนี้อัตโนมัติเพื่อประหยัดทรัพยากร</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 mt-2 gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={24} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                ข้อมูลวิเคราะห์ขั้นสูง
              </h2>
              <button
                onClick={() => setShowAdvancedAnalytics(false)}
                className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-slate-850 px-4 py-2.5 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow flex items-center gap-1.5 min-h-[44px] sm:min-h-0"
              >
                ซ่อนข้อมูล
              </button>
            </div>

            {(loadingAnalytics || loadingTrendToday || loadingClassroomWeekRows || loadingDailyRates || loadingMonthlyCompare) ? (
              <div className="p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="font-semibold text-slate-600 dark:text-slate-200 text-lg">กำลังประมวลผลข้อมูลวิเคราะห์...</p>
                <p className="text-sm text-slate-400 dark:text-slate-550 mt-2">กำลังดึงข้อมูลและคำนวณสถิติ อาจใช้เวลาสักครู่</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp size={100} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 relative z-10">อัตราเข้าเรียนวันนี้ (รายวิชา)</p>
                    <div className="flex items-end gap-3 mb-2 relative z-10">
                      <h3 className="text-[clamp(2rem,5vw,3rem)] font-black text-slate-800 dark:text-white leading-none">{trendToday?.todayRate ?? 0}%</h3>
                      <div className={`flex items-center gap-1 text-sm font-bold mb-1 ${(trendToday?.deltaRate ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {(trendToday?.deltaRate ?? 0) >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        {Math.abs(trendToday?.deltaRate ?? 0)}%
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium relative z-10">เทียบกับเมื่อวาน ({trendToday?.yesterdayRate ?? 0}%)</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp size={100} />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 relative z-10">อัตราการเข้าเรียนเฉลี่ย (เดือนนี้)</p>
                    <div className="flex flex-col items-center justify-center mt-2 relative z-10">
                      <GaugeChart rate={gaugeRate} color={gaugeColor} target={gaugeTarget} />
                      <div className="mt-4 flex items-center justify-center gap-3 w-full">
                        <div className="flex flex-col items-center px-4 border-r border-slate-100 dark:border-slate-850">
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">เทียบเดือนก่อน</p>
                          <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-black ${gaugeDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {gaugeDelta >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            {Math.abs(gaugeDelta)}%
                          </div>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">เป้า {gaugeTarget}%</p>
                          <p className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">
                            {gaugeRate >= gaugeTarget ? 'ผ่านเกณฑ์ 🎉' : 'ต้องระวัง ⚠️'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 sm:p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
                        <AlertTriangle size={20} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Top 5 ห้องเสี่ยง (สัปดาห์นี้)</p>
                    </div>
                    {topRiskClassrooms.length > 0 ? (
                      <div className="space-y-4">
                        {topRiskClassrooms.map((room) => (
                          <div key={room.classroomId} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                            <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[80px] sm:max-w-none">{room.roomLabel}</span>
                            <div className="flex items-center gap-2 sm:gap-3 w-[70%] sm:w-[65%]">
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${room.rate}%`, backgroundColor: room.fill }} />
                              </div>
                              <span className="text-[10px] sm:text-xs font-black w-9 text-right" style={{ color: room.fill }}>{room.rate}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 pb-4">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                          <AlertTriangle size={24} className="opacity-20 dark:opacity-40" />
                        </div>
                        <p className="text-sm font-medium">ยังไม่มีข้อมูลเพียงพอ</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 px-1 sm:px-2">แนวโน้มการเข้าเรียน 7 วันล่าสุด</p>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', details: 'dark:bg-slate-900', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 700 }}
                            formatter={(value: number) => [`${value}%`, 'อัตราเข้าเรียน']}
                          />
                          <Area type="monotone" dataKey="rate" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4F46E5' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 px-1 sm:px-2">สัดส่วนสถานะการเข้าเรียน (เดือนนี้)</p>
                    <div className="h-[280px] w-full flex items-center justify-center p-1 sm:p-2">
                      <StackedBar data={analytics?.pieData} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
