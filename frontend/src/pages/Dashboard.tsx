import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getAnalyticsData } from '../services/dashboardService'
import { Users, GraduationCap, BookOpen, Library, Download, TrendingUp, Calendar as CalIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useQuery({ queryKey: ['dashboard_stats'], queryFn: getDashboardStats })
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({ queryKey: ['dashboard_analytics'], queryFn: getAnalyticsData })

  if (loadingStats || loadingAnalytics) return <div className="p-8 text-center text-gray-500 mt-20">กำลังโหลดข้อมูล Dashboard...</div>

  const cards = [
    { title: 'จำนวนนักเรียนทั้งหมด', value: stats?.students, icon: <GraduationCap size={32} className="text-white" />, bg: 'bg-gradient-to-br from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
    { title: 'บุคลากรทางการศึกษา', value: stats?.teachers, icon: <Users size={32} className="text-white" />, bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-200' },
    { title: 'ห้องเรียนที่เปิดสอน', value: stats?.classrooms, icon: <BookOpen size={32} className="text-white" />, bg: 'bg-gradient-to-br from-purple-500 to-purple-600', shadow: 'shadow-purple-200' },
    { title: 'รายวิชาในระบบ', value: stats?.subjects, icon: <Library size={32} className="text-white" />, bg: 'bg-gradient-to-br from-orange-400 to-orange-600', shadow: 'shadow-orange-200' },
  ]

  const totalAttendance = analytics?.pieData?.reduce((acc: number, curr: any) => acc + (curr.name !== 'ยังไม่มีข้อมูล' ? curr.value : 0), 0) || 0;
  const presentCount = analytics?.pieData?.find((d: any) => d.name === 'มาเรียน')?.value || 0;
  const percentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  
  let statusText = 'ไม่มีข้อมูล'
  let statusColor = 'text-gray-500'
  if (totalAttendance > 0) {
    statusText = percentage >= 80 ? 'ยอดเยี่ยม' : percentage >= 60 ? 'ปานกลาง' : 'ควรปรับปรุง'
    statusColor = percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-orange-500' : 'text-red-500'
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">ภาพรวมและสถิติระบบจัดการการเข้าเรียน (SAMS)</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className={`${card.bg} p-6 rounded-[2rem] shadow-xl ${card.shadow} flex items-center justify-between text-white overflow-hidden relative group`}>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-indigo-500" /> สถิติการมาเรียนรายสัปดาห์
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">เปรียบเทียบจำนวนนักเรียนที่มา ขาด และสาย ในแต่ละวัน</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} />
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
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalIcon className="text-blue-500" /> อัตราการเข้าเรียนเฉลี่ย
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">สัดส่วนการมาเรียนในเดือนนี้</p>
          </div>
          <div className="flex-1 min-h-[250px] relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
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
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-800">{percentage}%</span>
              <span className={`text-sm font-bold ${statusColor} mt-1`}>{statusText}</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2">
            {analytics?.pieData?.map((item: any, i: number) => (
              <div key={i} className="text-center bg-slate-50 rounded-xl p-2">
                <div className="text-xs font-bold text-slate-500 mb-1">{item.name}</div>
                <div className="text-lg font-black" style={{ color: item.fill }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
