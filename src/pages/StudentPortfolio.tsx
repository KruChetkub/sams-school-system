import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  getStudentPortfolios,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getPortfolioSummary
} from '../services/portfolioService'
import { getActiveAcademicYear } from '../services/academicYearService'
import {
  Plus, Trash2, Edit, Calendar, BookOpen, Award,
  Activity, Star, FileText, ArrowLeft, ExternalLink,
  X, AlertTriangle, CheckCircle, ChevronRight, User,
  Sparkles, TrendingUp, FolderOpen
} from 'lucide-react'

// หมวดหมู่และภาษาไทย
const categories = {
  ACADEMIC: { label: 'วิชาการ/ผลการเรียน', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-600', ring: 'ring-blue-500/20' },
  ACTIVITY: { label: 'กิจกรรม/จิตอาสา', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', icon: Activity, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600', ring: 'ring-emerald-500/20' },
  AWARD: { label: 'รางวัล/การแข่งขัน', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', icon: Award, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600', ring: 'ring-amber-500/20' },
  SKILL: { label: 'ทักษะพิเศษ', color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', icon: Star, gradient: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-600', ring: 'ring-purple-500/20' },
  OTHER: { label: 'ผลงานอื่นๆ', color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100', icon: FileText, gradient: 'from-gray-500 to-slate-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-600', ring: 'ring-gray-500/20' }
}
const pad = (value: number) => String(value).padStart(2, '0')

const formatThaiBEEInputDate = (isoDate: string) => {
  if (!isoDate) return ''
  const parts = isoDate.split('-')
  if (parts.length !== 3) return ''
  const [y, m, d] = parts
  const beYear = parseInt(y, 10) + 543
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${beYear}`
}

const parseThaiBEInputDate = (input: string) => {
  if (!input) return null
  const parts = input.split('/').map(part => part.trim())
  if (parts.length !== 3) return null
  const [dayStr, monthStr, yearStr] = parts
  if (!/^[0-9]{1,2}$/.test(dayStr) || !/^[0-9]{1,2}$/.test(monthStr) || !/^[0-9]{4}$/.test(yearStr)) return null
  const day = Number(dayStr)
  const month = Number(monthStr)
  const beYear = Number(yearStr)
  const year = beYear - 543
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${year}-${pad(month)}-${pad(day)}`
}

const formatThaiBuddhistDate = (isoDate: string) => {
  if (!isoDate) return ''
  try {
    const date = new Date(`${isoDate}T00:00:00`)
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      calendar: 'buddhist'
    }).format(date)
  } catch (e) {
    return isoDate
  }
}

const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

export default function StudentPortfolio() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const fromPath = (location.state as any)?.from || '/students'

  // Tab filter
  const [activeTab, setActiveTab] = useState<string>('ALL')

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  // Form State
  const [form, setForm] = useState({
    category: 'ACADEMIC' as keyof typeof categories,
    title: '',
    description: '',
    score: '',
    grade: '',
    certificate_url: '',
    certificate_label: 'ผลงาน',
    date: '',
    academic_year: '',
    semester: '1'
  })

  // Date Picker State (Thai B.E. calendar)
  const [dateInput, setDateInput] = useState('')
  const [dateError, setDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

  // Click outside to close Date Picker
  useEffect(() => {
    if (!showDatePicker) return
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.datepicker-container')) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showDatePicker])

  const selectCalendarDate = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day)
    const y = date.getFullYear()
    const m = pad(date.getMonth() + 1)
    const d = pad(date.getDate())
    const isoDate = `${y}-${m}-${d}`
    setForm(prev => ({ ...prev, date: isoDate }))
    setDateInput(formatThaiBEEInputDate(isoDate))
    setDateError('')
    setShowDatePicker(false)
  }

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const calendarCells = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  // 1. ดึงข้อมูลนักเรียน
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*, classrooms:classroom_id(level, room)')
        .eq('id', studentId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!studentId
  })

  // 2. ดึงผลงานทั้งหมด
  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['studentPortfolios', studentId],
    queryFn: () => getStudentPortfolios(studentId!),
    enabled: !!studentId
  })

  // 3. ดึงสรุปยอดรวม
  const { data: summary } = useQuery({
    queryKey: ['studentPortfolioSummary', studentId],
    queryFn: () => getPortfolioSummary(studentId!),
    enabled: !!studentId
  })

  // 4. ดึง Active Academic Year เพื่อมาเป็น Default ใน Form
  const { data: activeYearData } = useQuery({
    queryKey: ['activeAcademicYear'],
    queryFn: getActiveAcademicYear
  })

  // ตั้งค่าปีการศึกษาล่าสุดในฟอร์มเมื่อได้รับข้อมูล
  useEffect(() => {
    if (activeYearData?.activeYear) {
      setForm(prev => ({
        ...prev,
        academic_year: activeYearData.activeYear?.year || '',
        semester: activeYearData.activeSemester?.semester_number || '1'
      }))
    }
  }, [activeYearData])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPortfolios', studentId] })
      queryClient.invalidateQueries({ queryKey: ['studentPortfolioSummary', studentId] })
      setShowFormModal(false)
      resetForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updatePortfolioItem(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPortfolios', studentId] })
      queryClient.invalidateQueries({ queryKey: ['studentPortfolioSummary', studentId] })
      setShowFormModal(false)
      setEditingItem(null)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deletePortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentPortfolios', studentId] })
      queryClient.invalidateQueries({ queryKey: ['studentPortfolioSummary', studentId] })
      setDeletingItemId(null)
    }
  })

  const resetForm = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    setForm({
      category: 'ACADEMIC',
      title: '',
      description: '',
      score: '',
      grade: '',
      certificate_url: '',
      certificate_label: 'ผลงาน',
      date: todayStr,
      academic_year: activeYearData?.activeYear?.year || '',
      semester: activeYearData?.activeSemester?.semester_number || '1'
    })
    setDateInput(formatThaiBEEInputDate(todayStr))
    setDateError('')
    setShowDatePicker(false)
    setCalendarMonth(new Date().getMonth())
    setCalendarYear(new Date().getFullYear())
  }

  const openAddModal = () => {
    setEditingItem(null)
    resetForm()
    setShowFormModal(true)
  }

  const openEditModal = (item: any) => {
    setEditingItem(item)
    const itemDate = item.date || new Date().toISOString().split('T')[0]
    setForm({
      category: item.category,
      title: item.title,
      description: item.description || '',
      score: item.score !== null ? String(item.score) : '',
      grade: item.grade || '',
      certificate_url: item.certificate_url || '',
      certificate_label: item.certificate_label || 'ผลงาน',
      date: itemDate,
      academic_year: item.academic_year || '',
      semester: item.semester || '1'
    })

    setDateInput(formatThaiBEEInputDate(itemDate))
    setDateError('')
    setShowDatePicker(false)
    const dateObj = new Date(`${itemDate}T00:00:00`)
    setCalendarMonth(dateObj.getMonth())
    setCalendarYear(dateObj.getFullYear())

    setShowFormModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      student_id: studentId!,
      category: form.category,
      title: form.title,
      description: form.description || null,
      score: form.score ? parseFloat(form.score) : null,
      grade: form.grade || null,
      certificate_url: form.certificate_url || null,
      certificate_label: form.certificate_label || 'ผลงาน',
      date: form.date || null,
      academic_year: form.academic_year || null,
      semester: form.semester || null
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const filteredPortfolios = portfolios?.filter(item => {
    if (activeTab === 'ALL') return true
    return item.category === activeTab
  })

  const isLoading = loadingStudent || loadingPortfolios

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-400"></div>
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <span className="text-sm text-indigo-300 font-bold tracking-wide">กำลังโหลดแฟ้มสะสมผลงาน...</span>
        </div>
      </div>
    )
  }

  const totalCount = summary?.total || 0

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e1b4b 100%)' }}>
      {/* Ambient Glow Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate(fromPath)}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-300/70 hover:text-indigo-200 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>ย้อนกลับ</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  แฟ้มสะสมผลงาน
                </h1>
                <p className="text-xs text-indigo-300/60 font-medium">Student Portfolio</p>
              </div>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="group relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>เพิ่มผลงาน / กิจกรรม</span>
          </button>
        </div>

        {/* ─── Student Profile Card ─── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-pink-600/10" />
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03]" />

          <div className="relative p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                  <User className="w-8 h-8 text-indigo-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-lg border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white leading-tight">
                  {student?.prefix}{student?.first_name} {student?.last_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-200/70 font-medium">
                  <span className="bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                    รหัส: {student?.student_code}
                  </span>
                  <span className="bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                    ชั้น {student?.classrooms?.level}/{student?.classrooms?.room}
                  </span>
                  {student?.nickname && (
                    <span className="bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                      ({student.nickname})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white/80">
                {activeYearData?.activeYear?.year ? `ปีการศึกษา ${activeYearData.activeYear.year}` : 'ยังไม่ตั้งค่า'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'ผลงานทั้งหมด', count: totalCount, gradient: 'from-indigo-500 to-purple-500', icon: FolderOpen },
            { label: 'วิชาการ', count: summary?.ACADEMIC || 0, gradient: 'from-blue-500 to-cyan-500', icon: BookOpen },
            { label: 'กิจกรรม', count: summary?.ACTIVITY || 0, gradient: 'from-emerald-500 to-teal-500', icon: Activity },
            { label: 'รางวัล', count: summary?.AWARD || 0, gradient: 'from-amber-500 to-orange-500', icon: Award },
            { label: 'ทักษะ', count: summary?.SKILL || 0, gradient: 'from-purple-500 to-violet-500', icon: Star },
            { label: 'อื่นๆ', count: summary?.OTHER || 0, gradient: 'from-gray-400 to-slate-500', icon: FileText },
          ].map((item, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] cursor-default">
              <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-sm" />
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${item.gradient}`} style={{ opacity: 0.07 }} />
              <div className="relative p-4 text-center space-y-2">
                <item.icon className="w-4 h-4 mx-auto text-gray-400 group-hover:text-white/60 transition-colors" />
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-300 transition-colors">{item.label}</p>
                <h4 className={`text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-none`}>
                  {item.count}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Tab Filters ─── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${activeTab === 'ALL'
              ? 'bg-white text-slate-900 shadow-lg shadow-white/10 scale-[1.02]'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/15'
              }`}
          >
            ทั้งหมด ({totalCount})
          </button>
          {Object.entries(categories).map(([key, cat]) => {
            const IconComp = cat.icon
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${activeTab === key
                  ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg scale-[1.02]`
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 hover:border-white/15'
                  }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {cat.label} ({summary?.[key as keyof typeof summary] || 0})
              </button>
            )
          })}
        </div>

        {/* ─── Portfolio Cards ─── */}
        {filteredPortfolios?.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 p-16 text-center">
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />
            <div className="relative space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center">
                <Award className="w-10 h-10 text-indigo-400/50" />
              </div>
              <p className="text-base font-bold text-gray-300">ยังไม่มีข้อมูลผลงานในหมวดหมู่นี้</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                กดปุ่ม "เพิ่มผลงาน / กิจกรรม" เพื่อเริ่มบันทึกประวัติผลงาน รางวัล หรือกิจกรรมของนักเรียน
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPortfolios?.map((item, index) => {
              const catInfo = categories[item.category as keyof typeof categories]
              const IconComponent = catInfo?.icon || FileText

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card background */}
                  <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-sm" />
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${catInfo?.gradient || 'from-gray-500 to-gray-600'} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      {/* Category badge + year */}
                      <div className="flex justify-between items-start gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg ${catInfo?.bg || 'bg-gray-500/10'} ${catInfo?.text || 'text-gray-400'} border ${catInfo?.border || 'border-gray-500/20'}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                          {catInfo?.label || 'อื่นๆ'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                          ปี {item.academic_year || '-'} / เทอม {item.semester || '-'}
                        </span>
                      </div>

                      {/* Title + Description */}
                      <div className="space-y-2">
                        <h3 className="font-black text-white text-base leading-snug group-hover:text-indigo-200 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                          {item.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                        </p>
                      </div>

                      {/* Meta tags */}
                      <div className="flex flex-wrap gap-2">
                        {item.date && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-medium">
                            <Calendar className="w-3 h-3 text-indigo-400/70" />
                            {formatThaiBuddhistDate(item.date)}
                          </span>
                        )}
                        {item.score !== null && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/15 font-bold">
                            <TrendingUp className="w-3 h-3" />
                            คะแนน: {item.score}
                          </span>
                        )}
                        {item.grade && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/15 font-bold">
                            <Award className="w-3 h-3" />
                            {item.grade}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center border-t border-white/5 pt-4">
                      <div>
                        {item.certificate_url ? (
                          <a
                            href={item.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors group/link"
                          >
                            <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                            <span className="underline underline-offset-2 decoration-indigo-400/30 hover:decoration-indigo-300/50">{item.certificate_label || 'ผลงาน'}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">ไม่มีไฟล์ผลงานแนบ</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingItemId(item.id)}
                          className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="ลบข้อมูล"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Add/Edit Modal ─── */}
        {showFormModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="relative bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal header */}
              <div className="relative p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30" />
                <div className="absolute inset-0 backdrop-blur-xl" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      {editingItem ? <Edit className="w-4.5 h-4.5 text-white" /> : <Plus className="w-4.5 h-4.5 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">
                        {editingItem ? 'แก้ไขข้อมูลผลงาน' : 'เพิ่มผลงานใหม่'}
                      </h2>
                      <p className="text-[10px] text-indigo-200/60 font-medium">กรอกข้อมูลผลงาน/กิจกรรมของนักเรียน</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFormModal(false)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">หมวดหมู่ผลงาน *</label>
                    <select
                      required
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    >
                      {Object.entries(categories).map(([key, cat]) => (
                        <option key={key} value={key} className="bg-slate-900 text-white">{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative datepicker-container">
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">วันที่ได้รับ *</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-indigo-400/60">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="วว/ดด/ปปปป"
                        className="w-full border border-white/10 bg-white/5 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                        value={dateInput}
                        onFocus={() => setShowDatePicker(true)}
                        onClick={() => setShowDatePicker(true)}
                        onChange={e => {
                          const value = e.target.value
                          setDateInput(value)
                          const parsed = parseThaiBEInputDate(value)
                          if (parsed) {
                            setForm(prev => ({ ...prev, date: parsed }))
                            setDateError('')
                            const parsedDate = new Date(`${parsed}T00:00:00`)
                            setCalendarMonth(parsedDate.getMonth())
                            setCalendarYear(parsedDate.getFullYear())
                          } else {
                            setDateError('รูปแบบวันที่ไม่ถูกต้อง โปรดใช้ วว/ดด/ปปปป (พ.ศ.)')
                          }
                        }}
                      />
                    </div>
                    {dateError && (
                      <p className="text-[10px] text-rose-400 mt-1 font-medium">{dateError}</p>
                    )}

                    {showDatePicker && (
                      <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/15 bg-slate-900/98 shadow-2xl p-4 backdrop-blur-xl">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 0) {
                                setCalendarMonth(11)
                                setCalendarYear(prev => prev - 1)
                              } else {
                                setCalendarMonth(prev => prev - 1)
                              }
                            }}
                            className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
                          >
                            ‹
                          </button>
                          <div className="text-sm font-bold text-white">
                            {thaiMonths[calendarMonth]} {calendarYear + 543}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 11) {
                                setCalendarMonth(0)
                                setCalendarYear(prev => prev + 1)
                              } else {
                                setCalendarMonth(prev => prev + 1)
                              }
                            }}
                            className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
                          >
                            ›
                          </button>
                        </div>

                        {/* Days of Week */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-500 mb-2">
                          {thaiWeekdays.map(day => <div key={day}>{day}</div>)}
                        </div>

                        {/* Calendar Cells */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {calendarCells.map((day, index) => {
                            const isSelected = day &&
                              day === new Date(`${form.date}T00:00:00`).getDate() &&
                              calendarMonth === new Date(`${form.date}T00:00:00`).getMonth() &&
                              calendarYear === new Date(`${form.date}T00:00:00`).getFullYear()

                            return (
                              <button
                                key={`${calendarYear}-${calendarMonth}-${index}`}
                                type="button"
                                onClick={() => day && selectCalendarDate(day)}
                                className={`h-8 text-xs rounded-lg transition-all ${day
                                  ? isSelected
                                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                  : 'pointer-events-none text-transparent'
                                  }`}
                              >
                                {day || ''}
                              </button>
                            )
                          })}
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(false)}
                            className="text-gray-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
                          >
                            ปิด
                          </button>
                          <span className="text-gray-600">ปฏิทินไทย (พ.ศ.)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">หัวข้อผลงาน/ชื่อกิจกรรม *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น รางวัลชนะเลิศการแข่งขันตอบปัญหาคณิตศาสตร์ระดับภาค"
                    className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">รายละเอียดและคำอธิบาย</label>
                  <textarea
                    placeholder="อธิบายกิจกรรม ผลสัมฤทธิ์ หรือข้อมูลเกียรติประวัติอื่นๆ..."
                    rows={3}
                    className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition resize-none"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">คะแนนที่ได้ (ถ้ามี)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="เช่น 95.50"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.score}
                      onChange={(e) => setForm({ ...form, score: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ระดับ/ผลประเมิน</label>
                    <input
                      type="text"
                      placeholder="เช่น เกรด A, เหรียญทอง"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ปีการศึกษา (พ.ศ.)</label>
                    <input
                      type="text"
                      placeholder="เช่น 2569"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.academic_year}
                      onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ภาคเรียน</label>
                    <select
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    >
                      <option value="1" className="bg-slate-900">ภาคเรียนที่ 1</option>
                      <option value="2" className="bg-slate-900">ภาคเรียนที่ 2</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ลิงก์ใบประกาศ/ลิงก์ผลงาน (URL)</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.certificate_url}
                      onChange={(e) => setForm({ ...form, certificate_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ชื่อเรียกป้ายลิงก์</label>
                    <input
                      type="text"
                      placeholder="เกียรติบัตร"
                      className="w-full border border-white/10 bg-white/5 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      value={form.certificate_label}
                      onChange={(e) => setForm({ ...form, certificate_label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || !!dateError}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Delete Confirmation Modal ─── */}
        {deletingItemId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="relative bg-slate-900/95 border border-white/15 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">ยืนยันการลบผลงาน?</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    การลบรายการนี้จะไม่สามารถกู้คืนข้อมูลผลงานกลับมาได้
                  </p>
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingItemId(null)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingItemId)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl transition-all shadow-lg shadow-rose-500/25"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
