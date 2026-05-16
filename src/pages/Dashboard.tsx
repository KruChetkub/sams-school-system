import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getAnalyticsData, getPendingClassroomChecksToday, getCheckedHomeroomClassroomsToday, getAttendanceTrendToday, getAttendanceDailyRates, getClassroomReport, getMonthlyAttendanceCompare } from '../services/dashboardService'
import { Users, GraduationCap, BookOpen, Library, TrendingUp, Calendar as CalIcon, ClipboardCheck, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine, Line } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

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

  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['dashboard_stats'], queryFn: getDashboardStats })
  const { data: pendingChecks, isLoading: loadingPendingChecks } = useQuery({
    queryKey: ['dashboard_pending_checks_today'],
    queryFn: getPendingClassroomChecksToday,
    refetchInterval: 30000,
  })
  const { data: checkedHomeroomToday, isLoading: loadingHomeroomToday } = useQuery({
    queryKey: ['dashboard_homeroom_checked_today'],
    queryFn: getCheckedHomeroomClassroomsToday,
    refetchInterval: 30000,
  })
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({ 
    queryKey: ['dashboard_analytics', 'month'], 
    queryFn: () => getAnalyticsData('month') 
  })
  const { data: trendToday, isLoading: loadingTrendToday } = useQuery({
    queryKey: ['dashboard_attendance_trend_today'],
    queryFn: getAttendanceTrendToday,
    refetchInterval: 30000,
  })
  const { data: classroomWeekRows = [], isLoading: loadingClassroomWeekRows } = useQuery({
    queryKey: ['dashboard_classroom_report_week'],
    queryFn: () => getClassroomReport('week'),
    refetchInterval: 30000,
  })
  const { data: dailyRates = [], isLoading: loadingDailyRates } = useQuery({
    queryKey: ['dashboard_attendance_daily_rates_7d'],
    queryFn: () => getAttendanceDailyRates(7),
    refetchInterval: 30000,
  })
  const { data: monthlyCompare, isLoading: loadingMonthlyCompare } = useQuery({
    queryKey: ['dashboard_monthly_attendance_compare'],
    queryFn: getMonthlyAttendanceCompare,
    refetchInterval: 30000,
  })

  if (loadingStats || loadingAnalytics || loadingPendingChecks || loadingHomeroomToday || loadingTrendToday || loadingClassroomWeekRows || loadingDailyRates || loadingMonthlyCompare) return <div className="p-8 text-center text-gray-500 mt-20">กำลังโหลดข้อมูล Dashboard...</div>

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">อัตราเข้าเรียนวันนี้ เทียบเมื่อวาน</p>
          <div className="mt-3 grid grid-cols-[110px_1fr] gap-4 items-center">
            <div className="relative h-[96px] w-[96px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'present', value: trendToday?.todayRate ?? 0, fill: '#10B981' },
                      { name: 'rest', value: Math.max(0, 100 - (trendToday?.todayRate ?? 0)), fill: '#E2E8F0' },
                    ]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-800">
                {trendToday?.todayRate ?? 0}%
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">วันนี้ {trendToday?.todayPresent ?? 0}/{trendToday?.todayTotal ?? 0} • เมื่อวาน {trendToday?.yesterdayRate ?? 0}%</p>
                <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                  (trendToday?.deltaRate || 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {(trendToday?.deltaRate || 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {trendToday?.deltaRate || 0}%
                </div>
              </div>
              <div className="mt-2 h-14 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={dailyRates}>
                    <defs>
                      <linearGradient id="dailyRateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Area type="monotone" dataKey="rate" stroke="#4F46E5" strokeWidth={2} fill="url(#dailyRateFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">แนวโน้ม 7 วันล่าสุด</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-sm font-semibold text-slate-600">Top 5 ห้องเสี่ยง (% มาเรียนต่ำสุด 7 วันล่าสุด)</p>
          </div>
          {topRiskClassrooms.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีข้อมูลเพียงพอ</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="h-[230px] w-full min-w-0">
                <ResponsiveContainer width="99%" height={230} minWidth={0} minHeight={180}>
                  <BarChart
                    data={topRiskClassrooms}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis type="category" dataKey="roomLabel" width={85} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip
                      formatter={(value: any, _name: any, props: any) => [`${value}%`, 'อัตรามาเรียน']}
                      labelFormatter={(_label: any, payload: any) => {
                        const row = payload?.[0]?.payload
                        if (!row) return ''
                        return `${row.roomLabel} • มา ${row.present} / รวม ${row.total}`
                      }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}
                    />
                    <ReferenceLine x={80} stroke="#6366F1" strokeDasharray="5 5" ifOverflow="extendDomain" />
                    <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                      {topRiskClassrooms.map((entry) => (
                        <Cell key={entry.classroomId} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>สีแดง/ส้ม = เสี่ยงสูง</span>
                <span>เส้นประ = เป้าหมาย 80%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 min-w-0 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" /> สถิติการมาเรียนรายสัปดาห์
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">เปรียบเทียบจำนวนนักเรียนที่มา ขาด และสาย ในแต่ละวัน</p>
            </div>
          </div>
          <div className="h-[350px] w-full min-w-0">
            <ResponsiveContainer width="99%" height={350} minWidth={0} minHeight={280}>
              <BarChart data={weeklyTrendData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} tick={{ fill: '#6366F1', fontWeight: 600 }} />
                <RechartsTooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: any) => {
                    if (name === 'อัตรามาเรียน') return [`${value}%`, name]
                    return [value, name]
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="present" name="มาเรียน" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="absent" name="ขาดเรียน" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="late" name="มาสาย" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="presentRate" name="อัตรามาเรียน" stroke="#4F46E5" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gauge Chart */}
        <div className="min-w-0 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalIcon className="text-blue-500" /> อัตราการเข้าเรียนเฉลี่ย
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">สัดส่วนการมาเรียนในเดือนนี้</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full min-w-0 relative mt-4">
            <ResponsiveContainer width="99%" height={250} minWidth={0} minHeight={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'rate', value: gaugeRate, fill: gaugeColor },
                    { name: 'rest', value: Math.max(0, 100 - gaugeRate), fill: '#E2E8F0' }
                  ]}
                  cx="50%"
                  cy="85%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={96}
                  dataKey="value"
                  stroke="none"
                />
                <ReferenceLine
                  segment={[
                    {
                      x: 50 + Math.cos((Math.PI * (180 - (gaugeTarget * 1.8))) / 180) * 84,
                      y: 85 - Math.sin((Math.PI * (180 - (gaugeTarget * 1.8))) / 180) * 84
                    },
                    {
                      x: 50 + Math.cos((Math.PI * (180 - (gaugeTarget * 1.8))) / 180) * 104,
                      y: 85 - Math.sin((Math.PI * (180 - (gaugeTarget * 1.8))) / 180) * 104
                    }
                  ]}
                  stroke="#6366F1"
                  strokeWidth={3}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-800">{gaugeRate}%</span>
              <span className="text-xs font-semibold text-slate-500 mt-1">เป้าหมาย {gaugeTarget}%</span>
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                gaugeDelta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {gaugeDelta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {gaugeDelta}% เทียบเดือนก่อน
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {analytics?.pieData?.map((item: any, i: number) => (
                <div key={i} className="text-center bg-slate-50 rounded-xl p-2">
                  <div className="text-xs font-bold text-slate-500 mb-1">{item.name}</div>
                  <div className={`text-lg font-black ${legendTextClass(item.name)}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
