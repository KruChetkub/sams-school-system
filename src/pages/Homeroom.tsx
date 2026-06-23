import React, { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassrooms } from '../services/classroomService'
import { getCheckedHomeroomClassroomsByDate, getExistingHomeroomAttendance, getHomeroomClassroomSummaryByDate, getStudentsByClassroom, saveHomeroomAttendance } from '../services/homeroomService'
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar, ArrowLeft, Users, User, RefreshCw, Search } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useAcademicYearStore } from '../store/academicYearStore'
import { supabase } from '../lib/supabase'

const pad = (value: number) => String(value).padStart(2, '0')

const formatInputDate = (isoDate: string) => {
  const date = new Date(isoDate)
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

const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const classroomCardPalettes = [
  {
    card: 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300/70 hover:from-rose-200 hover:to-pink-300',
    title: 'text-rose-900',
    meta: 'text-rose-800',
    stat: 'text-rose-900/90',
  },
  {
    card: 'bg-gradient-to-br from-orange-100 to-amber-200 border-amber-300/70 hover:from-orange-200 hover:to-amber-300',
    title: 'text-amber-900',
    meta: 'text-amber-800',
    stat: 'text-amber-900/90',
  },
  {
    card: 'bg-gradient-to-br from-lime-100 to-green-200 border-green-300/70 hover:from-lime-200 hover:to-green-300',
    title: 'text-green-900',
    meta: 'text-green-800',
    stat: 'text-green-900/90',
  },
  {
    card: 'bg-gradient-to-br from-cyan-100 to-sky-200 border-sky-300/70 hover:from-cyan-200 hover:to-sky-300',
    title: 'text-cyan-900',
    meta: 'text-cyan-800',
    stat: 'text-cyan-900/90',
  },
  {
    card: 'bg-gradient-to-br from-indigo-100 to-blue-200 border-indigo-300/70 hover:from-indigo-200 hover:to-blue-300',
    title: 'text-indigo-900',
    meta: 'text-indigo-800',
    stat: 'text-indigo-900/90',
  },
  {
    card: 'bg-gradient-to-br from-violet-100 to-purple-200 border-violet-300/70 hover:from-violet-200 hover:to-purple-300',
    title: 'text-violet-900',
    meta: 'text-violet-800',
    stat: 'text-violet-900/90',
  },
] as const

const formatThaiBuddhistDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: 'buddhist'
  }).format(date)
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

const getClassroomPalette = (classroomKey: string) => {
  let hash = 0
  for (let i = 0; i < classroomKey.length; i += 1) {
    hash = (hash * 31 + classroomKey.charCodeAt(i)) >>> 0
  }
  return classroomCardPalettes[hash % classroomCardPalettes.length]
}

export default function Homeroom() {
  const topRef = useRef<HTMLDivElement | null>(null)
  const studentTableRef = useRef<HTMLDivElement | null>(null)
  const { user, role } = useAuthStore()
  const isTeacherRole = role === 'TEACHER' || role === 'ADVISOR'
  const queryClient = useQueryClient()
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceDateInput, setAttendanceDateInput] = useState(formatInputDate(new Date().toISOString().split('T')[0]))
  const [attendanceDateError, setAttendanceDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
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
  const pageSize = 10

  const { selectedYear, selectedSemester } = useAcademicYearStore()

  const { data: classrooms } = useQuery({
    queryKey: ['classrooms', selectedYear?.id],
    queryFn: () => getClassrooms(selectedYear?.id)
  })
  const { data: checkedClassrooms = [] } = useQuery({
    queryKey: ['homeroom_checked_classrooms', attendanceDate, selectedYear?.id],
    queryFn: () => getCheckedHomeroomClassroomsByDate(attendanceDate, selectedYear?.id),
    enabled: !!attendanceDate
  })
  const { data: classroomSummary = [] } = useQuery({
    queryKey: ['homeroom_classroom_summary', attendanceDate, selectedYear?.id],
    queryFn: () => getHomeroomClassroomSummaryByDate(attendanceDate, selectedYear?.id),
    enabled: !!attendanceDate,
  })
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher_profile', user?.id],
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

  const filteredClassrooms = React.useMemo(() => {
    if (!classrooms) return []
    if (activeTeacherId) {
      return classrooms.filter(c => c.advisor_id === activeTeacherId || c.advisor2_id === activeTeacherId)
    }
    return classrooms
  }, [classrooms, activeTeacherId])

  const filteredClassroomSummary = React.useMemo(() => {
    if (!classroomSummary) return []
    if (activeTeacherId) {
      const advisedIds = new Set(filteredClassrooms.map(c => c.id))
      return classroomSummary.filter(c => advisedIds.has(c.classroom_id))
    }
    return classroomSummary
  }, [classroomSummary, activeTeacherId, filteredClassrooms])

  const filteredCheckedClassrooms = React.useMemo(() => {
    if (!checkedClassrooms) return []
    if (activeTeacherId) {
      const advisedIds = new Set(filteredClassrooms.map(c => c.id))
      return checkedClassrooms.filter(c => advisedIds.has(c.classroom_id))
    }
    return checkedClassrooms
  }, [checkedClassrooms, activeTeacherId, filteredClassrooms])

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedClassroom],
    queryFn: () => getStudentsByClassroom(selectedClassroom),
    enabled: !!selectedClassroom
  })

  const totalPages = Math.max(1, Math.ceil((students?.length || 0) / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = students?.slice(startIndex, startIndex + pageSize) || []
  const isSelectedClassroomAlreadyChecked = !!selectedClassroom && filteredCheckedClassrooms.some((c) => c.classroom_id === selectedClassroom)
  const selectedDateObj = new Date(`${attendanceDate}T00:00:00`)
  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate())
  const daysDiff = Math.floor((todayOnly.getTime() - selectedOnly.getTime()) / (1000 * 60 * 60 * 24))
  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const canEditPastDate = isAdminRole || (isTeacherRole && daysDiff >= 0 && daysDiff <= 30)

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

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!students) return Promise.resolve()
      const records = students.map(s => ({
        student_id: s.id,
        attendance_date: attendanceDate,
        status: (attendanceState[s.id] || 'PRESENT') as any,
        checkin_time: new Date().toISOString()
      }))
      return saveHomeroomAttendance(attendanceDate, records, selectedYear?.id, selectedSemester?.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeroom_checked_classrooms', attendanceDate] })
      queryClient.invalidateQueries({ queryKey: ['homeroom_classroom_summary', attendanceDate] })
      setResultModalType('success')
      setResultModalMessage('บันทึกข้อมูลเข้าแถวสำเร็จ')
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
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  React.useEffect(() => {
    const loadExisting = async () => {
      if (!selectedClassroom || !isSelectedClassroomAlreadyChecked) return
      const rows = await getExistingHomeroomAttendance(attendanceDate, selectedClassroom)
      const nextState: Record<string, string> = {}
      rows.forEach((row: any) => {
        nextState[row.student_id] = row.status
      })
      setAttendanceState(nextState)
    }
    loadExisting()
  }, [attendanceDate, selectedClassroom, isSelectedClassroomAlreadyChecked])

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  if (isAdmin && selectedTeacherId === null) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Block */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden min-h-[160px] flex items-center">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2 tracking-tight">เช็คชื่อเข้าแถว (Homeroom)</h1>
            <p className="text-white/80 font-medium">
              เลือกภาพรวมทั้งโรงเรียน หรือเลือกครูที่ปรึกษาเพื่อจัดการการเช็คชื่อเข้าแถวรายห้องเรียน
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
            className="group bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex items-center justify-between"
          >
            <div>
              <p className="text-blue-100 text-sm font-semibold">เช็คชื่อเข้าแถว</p>
              <h3 className="text-2xl font-black mt-1">ภาพรวมโรงเรียนทั้งหมด</h3>
              <p className="text-blue-100/90 text-xs mt-2 font-medium">จัดการทุกห้องเรียนโดยไม่ต้องกรองตามครูที่ปรึกษา</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Calendar size={28} />
            </div>
          </button>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold">บุคลากรครูที่ปรึกษา</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{allTeachers?.length || 0} คน</h3>
              <p className="text-gray-400 text-xs mt-2 font-medium">เลือกครูที่ปรึกษาเพื่อจำลองหรือจัดการห้องเรียนในความดูแล</p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={28} />
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">เลือกครูผู้สอน</h2>
            <p className="text-sm text-gray-500 mt-1">ค้นหาครูและคลิกการ์ดเพื่อทำรายการแทนครูที่ปรึกษาท่านนั้น</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ รหัสครู..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
            </div>

            {/* Department Filter */}
            <select
              value={teacherDeptFilter}
              onChange={(e) => setTeacherDeptFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white cursor-pointer"
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
              const advisorRoomsCount = classrooms?.filter(c => c.advisor_id === teacher.id || c.advisor2_id === teacher.id).length || 0
              return (
                <button
                  key={teacher.id}
                  onClick={() => {
                    setSelectedTeacherId(teacher.id)
                    setSelectedClassroom('')
                  }}
                  className="group text-left bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-52 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-bl-full transition-all group-hover:scale-125" />

                  <div className="space-y-4">
                    {/* Avatar */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base transition-colors group-hover:bg-blue-500 group-hover:text-white">
                        {initials || <User size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-mono text-gray-400 font-medium">
                          {teacher.teacher_code || 'ไม่มีรหัสครู'}
                        </p>
                        <h3 className="font-bold text-gray-800 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
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

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-blue-500 group-hover:text-blue-600">
                    <span>{advisorRoomsCount > 0 ? `ครูที่ปรึกษา ${advisorRoomsCount} ห้อง` : 'ไม่มีห้องเรียนในดูแล'}</span>
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
    <div ref={topRef} className="p-8 max-w-5xl mx-auto space-y-6">
      {isAdmin && selectedTeacherId !== null && (
        <div className="flex justify-start">
          <button
            onClick={() => {
              setSelectedTeacherId(null)
              setSelectedClassroom('')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-bold transition-all shadow-sm"
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
              <h4 className="font-bold text-amber-800 text-sm">กำลังทำหน้าที่แทนครูที่ปรึกษา</h4>
              <p className="text-xs text-amber-700 font-medium">
                คุณกำลังเช็คชื่อเข้าแถวในฐานะ <span className="underline font-bold">{selectedTeacher.first_name} {selectedTeacher.last_name}</span> {selectedTeacher.department ? `(${selectedTeacher.department})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTeacherId('school')
              setSelectedClassroom('')
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
        <h1 className="text-2xl font-bold text-gray-800">เช็คชื่อเข้าแถว (Homeroom)</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="classroom-select" className="block text-sm font-medium text-gray-700 mb-2">เลือกห้องเรียน</label>
          <select
            id="classroom-select"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors"
            value={selectedClassroom}
            onChange={e => {
              setSelectedClassroom(e.target.value)
              setAttendanceState({})
              setCurrentPage(1)
            }}
          >
            <option value="">-- กรุณาเลือกห้องเรียน --</option>
            {filteredClassrooms.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
          </select>
        </div>
        <div className="relative">
          <div className="flex items-end justify-between gap-3 mb-2">
            <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700">วันที่</label>
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

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">สถานะห้องเรียนวันที่ {formatThaiBuddhistDate(attendanceDate)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredClassroomSummary.map((c) => {
            const isChecked = c.checked_students > 0
            const isActive = selectedClassroom === c.classroom_id
            const palette = getClassroomPalette(`${c.classroom_id}-${c.classroom_label}`)
            return (
              <button
                key={c.classroom_id}
                type="button"
                onClick={() => {
                  setSelectedClassroom(c.classroom_id)
                  setCurrentPage(1)
                  setTimeout(() => {
                    studentTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 50)
                }}
                className={`text-left rounded-xl border p-4 transition ${isActive ? 'ring-2 ring-blue-400' : ''} ${palette.card} ${isChecked ? 'shadow-sm' : 'opacity-90'}`}
              >
                <p className={`font-bold ${palette.title}`}>{c.classroom_label}</p>
                <p className={`text-xs mt-1 ${palette.meta}`}>{isChecked ? 'เช็คแล้ว' : 'ยังไม่เช็ค'}</p>
                <div className={`mt-2 text-xs grid grid-cols-2 gap-y-1 ${palette.stat}`}>
                  <span>มา: {c.present_count}</span>
                  <span>สาย: {c.late_count}</span>
                  <span>ขาด: {c.absent_count}</span>
                  <span>ลา: {c.leave_count}</span>
                  <span>เช็คแล้ว: {c.checked_students}</span>
                  <span>คงเหลือ: {c.remaining_count}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">สถานะการเช็คชื่อเข้าแถววันที่ {formatThaiBuddhistDate(attendanceDate)}</p>
            {filteredCheckedClassrooms.length === 0 ? (
              <p className="text-sm text-amber-700 mt-1">ยังไม่มีห้องที่เช็คชื่อเข้าแถวในวันนี้</p>
            ) : (
              <p className="text-sm text-amber-700 mt-1">
                เช็คแล้ว {filteredCheckedClassrooms.length} ห้อง: {filteredCheckedClassrooms.map((c) => c.classroom_label).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedClassroom && (
        <div ref={studentTableRef} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {paginatedStudents.map((student, index) => {
                  const status = attendanceState[student.id] || 'PRESENT'
                  const rowNumber = startIndex + index + 1
                  const displayName = `${student.prefix ? `${student.prefix} ` : ''}${student.first_name} ${student.last_name}`
                  return (
                    <div key={student.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                      <div className="mb-3">
                        <div className="font-semibold text-gray-800 text-lg">{rowNumber}. {displayName}</div>
                        <div className="text-sm font-mono text-gray-500 mt-0.5">รหัส: {student.student_code}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-medium transition-all ${status === 'PRESENT' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={22} className="mb-1" /> มา</button>
                        <button onClick={() => setStatus(student.id, 'LATE')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-medium transition-all ${status === 'LATE' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={22} className="mb-1" /> สาย</button>
                        <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-medium transition-all ${status === 'ABSENT' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={22} className="mb-1" /> ขาด</button>
                        <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-medium transition-all ${status === 'LEAVE' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={22} className="mb-1" /> ลา</button>
                      </div>
                    </div>
                  )
                })}
                {students?.length === 0 && <div className="p-12 text-center text-gray-500 bg-gray-50/50">ไม่พบนักเรียนในห้องนี้ โปรดตรวจสอบการจัดห้องเรียน</div>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ลำดับ</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">รหัส</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่อ-สกุล</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedStudents.map((student, index) => {
                      const status = attendanceState[student.id] || 'PRESENT'
                      const rowNumber = startIndex + index + 1
                      const displayName = `${student.prefix ? `${student.prefix} ` : ''}${student.first_name} ${student.last_name}`
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{rowNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{student.student_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{displayName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'PRESENT' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={16} /> มา</button>
                              <button onClick={() => setStatus(student.id, 'LATE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LATE' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16} /> สาย</button>
                              <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'ABSENT' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={16} /> ขาด</button>
                              <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LEAVE' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={16} /> ลา</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {students?.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-gray-500 bg-gray-50/50">ไม่พบนักเรียนในห้องนี้ โปรดตรวจสอบการจัดห้องเรียน</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-sm text-slate-600">หน้าที่ {currentPage} / {totalPages} (แสดง {pageSize} คนต่อหน้า)</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium disabled:opacity-50 hover:bg-slate-100 transition-colors"
                  >ก่อนหน้า</button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium disabled:opacity-50 hover:bg-slate-100 transition-colors"
                  >ถัดไป</button>
                </div>
              </div>

              <div className="p-6 bg-white border-t flex justify-end">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || students?.length === 0 || !canEditPastDate}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  {saveMutation.isPending ? 'กำลังบันทึก...' : !canEditPastDate ? 'ไม่มีสิทธิ์แก้ย้อนหลังเกินกำหนด' : isSelectedClassroomAlreadyChecked ? 'อัปเดตข้อมูลเข้าแถว' : 'บันทึกข้อมูลเข้าแถว'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
