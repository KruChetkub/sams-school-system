import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSchedules } from '../services/scheduleService'
import { getStudentsForSchedule, saveClassroomAttendance } from '../services/attendanceService'
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar, ArrowLeft, Users, User, RefreshCw, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAcademicYearStore } from '../store/academicYearStore'
import { supabase } from '../lib/supabase'

const pad = (value: number) => String(value).padStart(2, '0')

const formatInputDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

const parseInputDate = (input: string) => {
  const parts = input.split('/').map(part => part.trim())
  if (parts.length !== 3) return null
  const [dayStr, monthStr, yearStr] = parts
  if (!/^[0-9]{1,2}$/.test(dayStr) || !/^[0-9]{1,2}$/.test(monthStr) || !/^[0-9]{4}$/.test(yearStr)) return null
  const day = Number(dayStr)
  const month = Number(monthStr)
  const year = Number(yearStr)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date.toISOString().split('T')[0]
}

const formatThaiBuddhistDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'buddhist'
  }).format(date)
}

const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const DAYS = [
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
]
const ATTENDANCE_THEME_STORAGE_KEY = 'sams_attendance_calendar_theme'
const ATTENDANCE_CALENDAR_THEMES = [
  {
    key: 'green-board',
    label: 'กระดานเขียว',
    wrapper: 'bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700/40',
    head: 'bg-emerald-900/60',
    title: 'text-emerald-50',
    subtext: 'text-emerald-100/90',
    tableWrap: 'border-emerald-700/50 bg-emerald-950/20',
    border: 'border-emerald-700/50',
    rowHead: 'bg-emerald-900/50 text-emerald-50',
    empty: 'border-emerald-600/50 bg-emerald-900/20',
  },
  {
    key: 'pastel-green',
    label: 'เขียวพาสเทล',
    wrapper: 'bg-gradient-to-br from-green-100 to-emerald-200 border-emerald-200',
    head: 'bg-emerald-200/80',
    title: 'text-emerald-900',
    subtext: 'text-emerald-800/90',
    tableWrap: 'border-emerald-200 bg-white/65',
    border: 'border-emerald-200',
    rowHead: 'bg-emerald-100 text-emerald-900',
    empty: 'border-emerald-300 bg-emerald-50/70',
  },
  {
    key: 'sky-soft',
    label: 'ฟ้านุ่ม',
    wrapper: 'bg-gradient-to-br from-sky-900 to-indigo-900 border-sky-700/40',
    head: 'bg-sky-900/60',
    title: 'text-sky-50',
    subtext: 'text-sky-100/90',
    tableWrap: 'border-sky-700/50 bg-sky-950/20',
    border: 'border-sky-700/50',
    rowHead: 'bg-sky-900/50 text-sky-50',
    empty: 'border-sky-500/50 bg-sky-900/20',
  },
]
const subjectCardPalettes = [
  {
    card: 'bg-gradient-to-br from-rose-100 to-pink-200 border border-rose-300/70 hover:from-rose-200 hover:to-pink-300',
    code: 'text-rose-800',
    name: 'text-rose-900/90',
    meta: 'text-rose-700',
  },
  {
    card: 'bg-gradient-to-br from-orange-100 to-amber-200 border border-amber-300/70 hover:from-orange-200 hover:to-amber-300',
    code: 'text-amber-900',
    name: 'text-amber-900/90',
    meta: 'text-amber-800',
  },
  {
    card: 'bg-gradient-to-br from-lime-100 to-green-200 border border-green-300/70 hover:from-lime-200 hover:to-green-300',
    code: 'text-green-900',
    name: 'text-green-900/90',
    meta: 'text-green-800',
  },
  {
    card: 'bg-gradient-to-br from-cyan-100 to-sky-200 border border-sky-300/70 hover:from-cyan-200 hover:to-sky-300',
    code: 'text-cyan-900',
    name: 'text-cyan-900/90',
    meta: 'text-cyan-800',
  },
  {
    card: 'bg-gradient-to-br from-indigo-100 to-blue-200 border border-indigo-300/70 hover:from-indigo-200 hover:to-blue-300',
    code: 'text-indigo-900',
    name: 'text-indigo-900/90',
    meta: 'text-indigo-800',
  },
  {
    card: 'bg-gradient-to-br from-violet-100 to-purple-200 border border-violet-300/70 hover:from-violet-200 hover:to-purple-300',
    code: 'text-violet-900',
    name: 'text-violet-900/90',
    meta: 'text-violet-800',
  },
] as const

const getSubjectPalette = (subjectKey: string) => {
  let hash = 0
  for (let i = 0; i < subjectKey.length; i++) {
    hash = (hash * 31 + subjectKey.charCodeAt(i)) >>> 0
  }
  return subjectCardPalettes[hash % subjectCardPalettes.length]
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()


export default function Attendance() {
  const tableRef = useRef<HTMLDivElement | null>(null)
  const studentSectionRef = useRef<HTMLDivElement | null>(null)
  const { user, role } = useAuthStore()
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceDateInput, setAttendanceDateInput] = useState(formatInputDate(new Date().toISOString().split('T')[0]))
  const [attendanceDateError, setAttendanceDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({})
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [teacherDeptFilter, setTeacherDeptFilter] = useState('')

  const { data: allTeachers } = useQuery({
    queryKey: ['all_teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('first_name')
      if (error) throw error
      return data
    },
    enabled: role === 'ADMIN' || role === 'SUPER_ADMIN'
  })

  const selectedTeacher = React.useMemo(() => {
    if (!allTeachers || !selectedTeacherId) return null
    return allTeachers.find(t => t.id === selectedTeacherId) || null
  }, [allTeachers, selectedTeacherId])

  const teacherDepartments = React.useMemo(() => {
    if (!allTeachers) return []
    const depts = new Set(allTeachers.map(t => t.department).filter(Boolean))
    return Array.from(depts)
  }, [allTeachers])

  const filteredTeachers = React.useMemo(() => {
    if (!allTeachers) return []
    return allTeachers.filter(t => {
      const matchesSearch = `${t.first_name || ''} ${t.last_name || ''} ${t.teacher_code || ''}`.toLowerCase().includes(teacherSearch.toLowerCase())
      const matchesDept = teacherDeptFilter ? t.department === teacherDeptFilter : true
      return matchesSearch && matchesDept
    })
  }, [allTeachers, teacherSearch, teacherDeptFilter])

  const [showResultModal, setShowResultModal] = useState(false)
  const [resultModalType, setResultModalType] = useState<'success' | 'error'>('success')
  const [resultModalMessage, setResultModalMessage] = useState('')
  const [calendarTheme, setCalendarTheme] = useState(() => {
    const saved = localStorage.getItem(ATTENDANCE_THEME_STORAGE_KEY)
    if (saved && ATTENDANCE_CALENDAR_THEMES.some((theme) => theme.key === saved)) return saved
    return ATTENDANCE_CALENDAR_THEMES[2].key
  })

  const openDatePicker = () => {
    const date = new Date(`${attendanceDate}T00:00:00`)
    setCalendarMonth(date.getMonth())
    setCalendarYear(date.getFullYear())
    setShowDatePicker(true)
  }

  const closeDatePicker = () => setShowDatePicker(false)

  const selectCalendarDate = (day: number) => {
    const date = new Date(calendarYear, calendarMonth, day)
    const isoDate = date.toISOString().split('T')[0]
    setAttendanceDate(isoDate)
    setAttendanceDateInput(formatInputDate(isoDate))
    setAttendanceDateError('')
    setShowDatePicker(false)
  }

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const calendarCells = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const calendarHeader = `${thaiMonths[calendarMonth]} ${calendarYear + 543}`

  const isTeacherRole = role === 'TEACHER' || role === 'ADVISOR'
  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher_profile_by_user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id && isTeacherRole
  })

  const activeTeacherId = isTeacherRole
    ? teacherProfile?.id
    : (selectedTeacherId && selectedTeacherId !== 'school' ? selectedTeacherId : undefined)

  const { selectedYear } = useAcademicYearStore()

  // ครูเห็นเฉพาะคาบของตัวเอง, แอดมินเห็นทั้งหมด
  const { data: schedules } = useQuery({
    queryKey: ['schedules', role, activeTeacherId || 'all', selectedYear?.id],
    queryFn: () => {
      return getSchedules(undefined, activeTeacherId, selectedYear?.id)
    },
    enabled: !isTeacherRole || teacherProfile !== undefined
  })

  const selectedDate = new Date(`${attendanceDate}T00:00:00`)
  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
  const daysDiff = Math.floor((todayOnly.getTime() - selectedOnly.getTime()) / (1000 * 60 * 60 * 24))
  const canEditPastDate = isAdminRole || (isTeacherRole && daysDiff >= 0 && daysDiff <= 30)
  const sortedSchedules = [...(schedules || [])].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    if ((a.start_time || '') !== (b.start_time || '')) return (a.start_time || '').localeCompare(b.start_time || '')
    return a.period - b.period
  })
  const slotMap = new Map<string, typeof sortedSchedules[number][]>()
  for (const item of sortedSchedules) {
    const key = `${item.start_time}-${item.end_time}`
    const list = slotMap.get(key) || []
    list.push(item)
    slotMap.set(key, list)
  }
  const timeSlots = Array.from(slotMap.keys()).sort((a, b) => a.localeCompare(b))
  const findScheduleByDayAndSlot = (day: number, slot: string) => {
    const list = slotMap.get(slot) || []
    return list.find((s) => s.day_of_week === day) || null
  }
  const mobileSchedules = sortedSchedules
  const activeTheme = ATTENDANCE_CALENDAR_THEMES.find((theme) => theme.key === calendarTheme) || ATTENDANCE_CALENDAR_THEMES[2]

  useEffect(() => {
    localStorage.setItem(ATTENDANCE_THEME_STORAGE_KEY, calendarTheme)
  }, [calendarTheme])

  useEffect(() => {
    if (selectedSchedule && !(schedules || []).some((s) => s.id === selectedSchedule)) {
      setSelectedSchedule('')
      setAttendanceState({})
    }
  }, [selectedSchedule, schedules])

  const { data: students, isLoading } = useQuery({
    queryKey: ['schedule_students', selectedSchedule],
    queryFn: () => getStudentsForSchedule(selectedSchedule),
    enabled: !!selectedSchedule
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!students || !selectedSchedule) return Promise.resolve()
      const records = students.map(s => ({
        schedule_id: selectedSchedule,
        student_id: s.id,
        attendance_date: attendanceDate,
        status: (attendanceState[s.id] || 'PRESENT') as any,
        checkin_time: new Date().toISOString()
      }))
      return saveClassroomAttendance(records)
    },
    onSuccess: () => {
      setResultModalType('success')
      setResultModalMessage('บันทึกการเข้าเรียนสำเร็จ')
      setShowResultModal(true)
    },
    onError: (error: any) => {
      setResultModalType('error')
      setResultModalMessage(error?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setShowResultModal(true)
    },
  })

  const markAll = (status: string) => {
    if (!students) return
    const newState = { ...attendanceState }
    students.forEach(s => {
      newState[s.id] = status
    })
    setAttendanceState(newState)
  }

  const setStatus = (id: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [id]: status }))
  }

  const closeResultModal = () => {
    setShowResultModal(false)
    if (resultModalType === 'success') {
      setSelectedSchedule('')
      setAttendanceState({})
    }
  }

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  if (isAdmin && selectedTeacherId === null) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="bg-gradient-to-r from-cyan-600 to-sky-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden min-h-[160px] flex items-center">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">เช็คชื่อรายวิชา (Classroom Attendance)</h1>
            <p className="text-white/80 font-medium">
              เลือกภาพรวมทั้งโรงเรียน หรือเลือกครูผู้สอนเพื่อจัดการการเช็คชื่อเข้าเรียนรายวิชา
            </p>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-15">
            <Calendar size={120} />
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => setSelectedTeacherId('school')}
            className="group bg-gradient-to-br from-cyan-500 to-sky-600 p-6 rounded-2xl text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-cyan-100 text-sm font-semibold">เช็คชื่อรายวิชา</p>
              <h3 className="text-2xl font-black mt-1">ภาพรวมโรงเรียนทั้งหมด</h3>
              <p className="text-cyan-100/90 text-xs mt-2 font-medium">จัดการเช็คชื่อเข้าเรียนของทุกวิชาโดยไม่ต้องกรองตามครูผู้สอน</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Calendar size={28} />
            </div>
          </button>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold">บุคลากรครูผู้สอน</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{allTeachers?.length || 0} คน</h3>
              <p className="text-gray-400 text-xs mt-2 font-medium">เลือกครูผู้สอนเพื่อจัดการหรือบันทึกเช็คชื่อรายวิชาในชั่วโมงเรียนแทน</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Users size={28} />
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">เลือกครูผู้สอน</h2>
            <p className="text-sm text-gray-500 mt-1">ค้นหาครูผู้สอนและคลิกการ์ดเพื่อจัดการตารางเรียนและเช็คชื่อวิชาที่สอน</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสครู..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
            </div>

            {/* Department Filter */}
            <select
              value={teacherDeptFilter}
              onChange={(e) => setTeacherDeptFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white cursor-pointer"
            >
              <option value="">ทุกกลุ่มสาระ / แผนก</option>
              {teacherDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Teacher Grid */}
        {allTeachers === undefined ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw size={48} className="mb-4 animate-spin opacity-50" />
            <p>กำลังโหลดรายชื่อครูผู้สอน...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-gray-100 text-center text-gray-400">
            <AlertCircle size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">ไม่พบข้อมูลครูตามตัวเลือกที่ค้นหา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTeachers.map((teacher) => {
              const initials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`
              const teacherSchedulesCount = schedules?.filter(s => s.teacher_id === teacher.id).length || 0
              return (
                <button
                  key={teacher.id}
                  onClick={() => {
                    setSelectedTeacherId(teacher.id)
                    setSelectedSchedule('')
                  }}
                  className="group text-left bg-white rounded-2xl p-6 border border-gray-100 hover:border-cyan-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-52 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/5 to-sky-500/5 rounded-bl-full transition-all group-hover:scale-125" />

                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold text-base transition-colors group-hover:bg-cyan-500 group-hover:text-white">
                        {initials || <User size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-mono text-gray-400 font-medium">
                          {teacher.teacher_code || 'ไม่มีรหัสครู'}
                        </p>
                        <h3 className="font-bold text-gray-800 text-base line-clamp-1 group-hover:text-cyan-600 transition-colors">
                          {teacher.first_name} {teacher.last_name}
                        </h3>
                      </div>
                    </div>

                    {/* Info lines */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <span className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100">
                          {teacher.department || 'ไม่ระบุกลุ่มสาระ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-cyan-500 group-hover:text-cyan-600">
                    <span>ตารางสอน {teacherSchedulesCount} คาบ</span>
                    <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {isAdmin && selectedTeacherId !== null && (
        <div className="flex justify-start">
          <button
            onClick={() => {
              setSelectedTeacherId(null)
              setSelectedSchedule('')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-cyan-600 border border-cyan-200 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> ย้อนกลับไปหน้าเลือกครูผู้สอน
          </button>
        </div>
      )}

      {/* Perspective Banner */}
      {selectedTeacher && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <Users size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-800 text-sm">กำลังทำหน้าที่แทนครูผู้สอน</h4>
              <p className="text-xs text-amber-700 font-medium">
                คุณกำลังเช็คชื่อรายวิชาในฐานะ <span className="underline font-bold">{selectedTeacher.first_name} {selectedTeacher.last_name}</span> {selectedTeacher.department ? `(${selectedTeacher.department})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTeacherId('school')
              setSelectedSchedule('')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            เปลี่ยนเป็นภาพรวมโรงเรียน
          </button>
        </div>
      )}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeResultModal} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className={`h-1.5 w-full ${resultModalType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="p-7 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${resultModalType === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {resultModalType === 'success' ? (
                  <CheckCircle size={28} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={28} className="text-rose-600" />
                )}
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                {resultModalType === 'success' ? 'บันทึกสำเร็จ' : 'บันทึกไม่สำเร็จ'}
              </h3>
              <p className="text-sm text-gray-600">{resultModalMessage}</p>
              <button
                type="button"
                onClick={closeResultModal}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${resultModalType === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
                  }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">เช็คชื่อรายวิชา (Classroom Attendance)</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative max-w-md">
          <div className="flex items-end justify-between gap-3 mb-2">
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700">วันที่สอน</label>
            <span className={`text-sm ${attendanceDateError ? 'text-red-500' : 'text-slate-500'}`}>
              {attendanceDateError || formatThaiBuddhistDate(attendanceDate)}
            </span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Calendar size={18} />
            </div>
            <input
              id="attendance-date"
              type="text"
              inputMode="numeric"
              pattern="\\d{1,2}/\\d{1,2}/\\d{4}"
              placeholder="วว/ดด/ปปปป"
              className="w-full border border-gray-300 rounded-lg p-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={attendanceDateInput}
              onFocus={openDatePicker}
              onClick={openDatePicker}
              onChange={e => {
                const value = e.target.value
                setAttendanceDateInput(value)
                const parsed = parseInputDate(value)
                if (parsed) {
                  setAttendanceDate(parsed)
                  setAttendanceDateError('')
                  setCalendarMonth(new Date(`${parsed}T00:00:00`).getMonth())
                  setCalendarYear(new Date(`${parsed}T00:00:00`).getFullYear())
                } else {
                  setAttendanceDateError('รูปแบบวันที่ไม่ถูกต้อง โปรดใช้ วว/ดด/ปปปป')
                }
              }}
            />

            {showDatePicker && (
              <div className="absolute z-20 top-full mt-2 w-full rounded-3xl border border-slate-200 bg-white shadow-2xl p-4">
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
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  >
                    ‹
                  </button>
                  <div className="text-sm font-semibold text-slate-700">{calendarHeader}</div>
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
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
                  {thaiWeekdays.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarCells.map((day, index) => (
                    <button
                      key={`${calendarYear}-${calendarMonth}-${index}`}
                      type="button"
                      onClick={() => day && selectCalendarDate(day)}
                      className={`h-10 rounded-xl ${day ? 'hover:bg-blue-50' : ''} ${day ? 'text-slate-700' : 'pointer-events-none text-transparent'} ${day === new Date(`${attendanceDate}T00:00:00`).getDate() && calendarMonth === new Date(`${attendanceDate}T00:00:00`).getMonth() && calendarYear === new Date(`${attendanceDate}T00:00:00`).getFullYear() ? 'bg-blue-600 text-white' : ''}`}
                    >
                      {day || ''}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <button type="button" onClick={closeDatePicker} className="rounded-lg px-3 py-2 hover:bg-slate-100">ปิด</button>
                  <div className="text-right">เลือกวันที่ไทยแล้วเก็บเป็นระบบ</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div ref={tableRef} className={`rounded-2xl shadow-lg border p-3 sm:p-4 md:p-6 overflow-hidden mb-6 ${activeTheme.wrapper}`}>
        <div className="mb-3 sm:mb-4 flex items-center justify-between gap-3 flex-wrap">
          <h2 className={`text-lg sm:text-xl font-bold ${activeTheme.title}`}>ตารางคาบเรียนสำหรับเช็คชื่อ</h2>
          <div className="flex items-center gap-2">
            <p className={`text-xs sm:text-sm ${activeTheme.subtext}`}>ธีมสี:</p>
            {ATTENDANCE_CALENDAR_THEMES.map((theme) => (
              <button
                key={theme.key}
                type="button"
                onClick={() => setCalendarTheme(theme.key)}
                className={`h-6 w-6 rounded-full border-2 transition ${calendarTheme === theme.key ? 'border-slate-800 scale-110' : 'border-white/80'}`}
                title={theme.label}
              >
                <span className={`block h-full w-full rounded-full ${theme.key === 'green-board' ? 'bg-emerald-700' : theme.key === 'pastel-green' ? 'bg-emerald-200' : 'bg-cyan-200'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="md:hidden space-y-2.5">
          {mobileSchedules.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-4 text-center text-sm ${activeTheme.empty} ${activeTheme.subtext}`}>
              ไม่พบคาบเรียนสำหรับเช็คชื่อ
            </div>
          ) : (
            mobileSchedules.map((schedule) => {
              const isActive = selectedSchedule === schedule.id
              const palette = getSubjectPalette(`${schedule.subject_id}-${schedule.subject?.subject_code || ''}`)
              const dayLabel = DAYS.find((d) => d.value === schedule.day_of_week)?.label || '-'
              return (
                <button
                  key={`mobile-schedule-${schedule.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedSchedule(schedule.id)
                    setAttendanceState({})
                    setTimeout(() => studentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  }}
                  className={`w-full rounded-xl p-3 text-left transition ${isActive ? 'bg-blue-100 border border-blue-300 ring-2 ring-blue-500' : palette.card}`}
                >
                  <p className={`text-xs font-semibold ${isActive ? 'text-gray-600' : palette.meta}`}>วัน{dayLabel} • คาบ {schedule.period}</p>
                  <p className={`text-sm font-bold ${isActive ? 'text-blue-700' : palette.code}`}>{schedule.subject?.subject_code || '-'}</p>
                  <p className={`text-sm ${isActive ? 'text-gray-700' : palette.name}`}>{schedule.subject?.subject_name || '-'}</p>
                  <p className={`text-xs mt-1 ${isActive ? 'text-gray-500' : palette.meta}`}>
                    {schedule.start_time?.substring(0, 5)} - {schedule.end_time?.substring(0, 5)} • {schedule.classroom?.level}/{schedule.classroom?.room}
                  </p>
                </button>
              )
            })
          )}
        </div>
        <div className={`hidden md:block rounded-xl border overflow-x-auto overflow-y-hidden ${activeTheme.tableWrap}`}>
          <table className="min-w-[920px] lg:min-w-0 w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[80px] md:w-[90px]" />
              {timeSlots.map((slot) => <col key={`att-col-${slot}`} className="w-[96px] md:w-[110px]" />)}
            </colgroup>
            <thead>
              <tr className={activeTheme.head}>
                <th className={`px-2 sm:px-3 py-2.5 sm:py-3 text-left text-[11px] sm:text-xs font-semibold border ${activeTheme.title} ${activeTheme.border}`}>วัน / เวลา</th>
                {timeSlots.map((slot) => (
                  <th key={slot} className={`px-1.5 sm:px-2 py-2.5 sm:py-3 text-center text-[10px] sm:text-xs font-semibold border ${activeTheme.title} ${activeTheme.border}`}>
                    {slot.split('-')[0].substring(0, 5)} - {slot.split('-')[1].substring(0, 5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day.value} className="align-top">
                  <td className={`px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm font-bold border ${activeTheme.rowHead} ${activeTheme.border}`}>วัน{day.label}</td>
                  {timeSlots.map((slot) => {
                    const schedule = findScheduleByDayAndSlot(day.value, slot)
                    const isActive = schedule && selectedSchedule === schedule.id
                    const palette = schedule ? getSubjectPalette(`${schedule.subject_id}-${schedule.subject?.subject_code || ''}`) : null
                    return (
                      <td key={`${day.value}-${slot}`} className={`border p-1.5 sm:p-2 h-[88px] sm:h-[110px] ${activeTheme.border}`}>
                        {schedule ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSchedule(schedule.id)
                              setAttendanceState({})
                              setTimeout(() => studentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                            }}
                            className={`h-full w-full rounded-lg p-1.5 sm:p-2 text-left transition ${isActive ? 'bg-blue-100 border border-blue-300 ring-2 ring-blue-500' : palette?.card}`}
                          >
                            <p className={`text-[11px] sm:text-xs font-bold ${isActive ? 'text-blue-700' : palette?.code}`}>{schedule.subject?.subject_code || '-'}</p>
                            <p className={`text-[11px] sm:text-xs line-clamp-2 ${isActive ? 'text-gray-700' : palette?.name}`}>{schedule.subject?.subject_name || '-'}</p>
                            <p className={`text-[10px] sm:text-[11px] ${isActive ? 'text-gray-500' : palette?.meta}`}>คาบ {schedule.period} • {schedule.classroom?.level}/{schedule.classroom?.room}</p>
                          </button>
                        ) : <div className={`h-full rounded-lg border border-dashed ${activeTheme.empty}`} />}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSchedule && (
        <div ref={studentSectionRef} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">รายชื่อนักเรียน ({students?.length || 0} คน)</h2>
            <div className="flex gap-2">
              <button onClick={() => markAll('PRESENT')} className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">มาทั้งหมด</button>
              <button onClick={() => markAll('ABSENT')} className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">ขาดทั้งหมด</button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-gray-500">กำลังโหลดรายชื่อ...</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-100">
                {students?.map((student, index) => {
                  const status = attendanceState[student.id] || 'PRESENT'
                  const displayName = `${student.prefix ? `${student.prefix} ` : ''}${student.first_name} ${student.last_name}`
                  return (
                    <div key={student.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-800 text-lg">{index + 1}. {displayName}</div>
                        <div className="text-sm font-mono text-gray-500 mt-0.5">รหัส: {student.student_code}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-medium transition-all ${status === 'PRESENT' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={22} className="mb-1" /> เข้าเรียน</button>
                        <button onClick={() => setStatus(student.id, 'LATE')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-medium transition-all ${status === 'LATE' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={22} className="mb-1" /> สาย</button>
                        <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-medium transition-all ${status === 'ABSENT' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={22} className="mb-1" /> ขาด</button>
                        <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-[11px] font-medium transition-all ${status === 'LEAVE' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={22} className="mb-1" /> ลา</button>
                      </div>
                    </div>
                  )
                })}
                {students?.length === 0 && <div className="p-12 text-center text-gray-500 bg-gray-50/50">ไม่พบนักเรียนในคาบเรียนนี้</div>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">รหัส</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">คำนำหน้า</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่อ-สกุล</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">สถานะการเข้าเรียน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students?.map(student => {
                      const status = attendanceState[student.id] || 'PRESENT'
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{student.student_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.prefix || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.first_name} {student.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'PRESENT' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={16} /> เข้าเรียน</button>
                              <button onClick={() => setStatus(student.id, 'LATE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LATE' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16} /> สาย</button>
                              <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'ABSENT' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={16} /> ขาด</button>
                              <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LEAVE' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={16} /> ลา</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {students?.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-gray-500 bg-gray-50/50">ไม่พบนักเรียนในคาบเรียนนี้</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-white border-t flex justify-end">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || students?.length === 0 || !canEditPastDate}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  {saveMutation.isPending ? 'กำลังบันทึก...' : !canEditPastDate ? 'ไม่มีสิทธิ์แก้ย้อนหลังเกินกำหนด' : 'บันทึกการเข้าเรียน'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
