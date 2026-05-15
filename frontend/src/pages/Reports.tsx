import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAnalyticsData } from '../services/dashboardService'
import { BarChart3, Users, User, Download, Share2, RefreshCw, Calendar as CalendarIcon, FileSpreadsheet, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeTimeFilter, setActiveTimeFilter] = useState('month')
  const [activeRange, setActiveRange] = useState('30days')

  const { data: analytics, isLoading } = useQuery({ 
    queryKey: ['dashboard_analytics'], 
    queryFn: getAnalyticsData 
  })

  const totalAttendance = analytics?.pieData?.reduce((acc: number, curr: any) => acc + (curr.name !== 'ยังไม่มีข้อมูล' ? curr.value : 0), 0) || 0;
  const presentCount = analytics?.pieData?.find((d: any) => d.name === 'มาเรียน')?.value || 0;
  const percentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  const totalItems = analytics?.rawAttendance?.length || 0;

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
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <BarChart3 size={18} /> ภาพรวม
        </button>
        <button 
          onClick={() => setActiveTab('classroom')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'classroom' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Users size={18} /> รายห้องเรียน
        </button>
        <button 
          onClick={() => setActiveTab('student')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'student' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <User size={18} /> รายบุคคล
        </button>
        <button 
          onClick={() => setActiveTab('export')}
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



      {/* Charts Section */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
          <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
          <p>กำลังโหลดข้อมูลการเข้าเรียน...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BarChart3 className="text-indigo-500" /> สถิติการมาเรียนตามวัน
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <User className="text-indigo-500" /> สัดส่วนการเข้าเรียน
            </h3>
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
      )}
      
    </div>
  )
}
