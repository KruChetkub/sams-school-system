import React, { useState } from 'react'
import { BarChart3, Users, User, Download, Share2, RefreshCw, Calendar as CalendarIcon, FileSpreadsheet, FileText } from 'lucide-react'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeTimeFilter, setActiveTimeFilter] = useState('month')
  const [activeRange, setActiveRange] = useState('30days')

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <BarChart3 size={16} /> รายงานภาพรวม
            </span>
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              30 วัน
            </span>
          </div>
          
          <h1 className="text-4xl font-black mb-2 tracking-tight">สรุปการเช็คประจำวัน</h1>
          <p className="text-white/80 font-medium flex items-center gap-2 mb-6">
            <CalendarIcon size={18} /> 15 เมษายน 2569 — 15 พฤษภาคม 2569
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <FileText size={16} /> 2 รายการ
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <Users size={16} /> 1 ห้องเรียน
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 backdrop-blur-sm">
              <RefreshCw size={16} /> เมื่อสักครู่
            </div>
          </div>
        </div>

        {/* Circular Progress (Static for UI) */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-8 border-white/20 flex flex-col items-center justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-yellow-400 border-l-transparent border-b-transparent transform rotate-45"></div>
          <span className="text-4xl font-black z-10">100<span className="text-xl">%</span></span>
          <span className="text-xs font-medium text-white/80 z-10">อัตราเข้าแถว</span>
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

      {/* Action Bar & Sub-filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['3 วัน', '7 วัน', '14 วัน', '30 วัน', '90 วัน'].map(range => {
            const id = range.replace(' วัน', 'days')
            return (
              <button
                key={id}
                onClick={() => setActiveRange(id)}
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all border ${
                  activeRange === id
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-md">
            <Share2 size={18} /> แชร์
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-md">
            <FileSpreadsheet size={18} /> CSV
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-pink-500 hover:bg-pink-600 transition-all shadow-md">
            <FileText size={18} /> PDF
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-slate-600 hover:bg-slate-700 transition-all shadow-md">
            <RefreshCw size={18} /> รีเฟรช
          </button>
        </div>
      </div>

      {/* Placeholder for Data / Charts */}
      <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400 border-dashed border-2">
        <BarChart3 size={64} className="mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">พื้นที่สำหรับแสดงกราฟและตารางข้อมูล</h3>
        <p>กำลังอยู่ในระหว่างการเชื่อมต่อข้อมูลเข้ากับฐานข้อมูล</p>
      </div>
      
    </div>
  )
}
