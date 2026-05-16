import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSchedules } from '../services/scheduleService'
import { getStudentsForSchedule, saveClassroomAttendance } from '../services/attendanceService'
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
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
const dayLabels: Record<number, string> = {
  1: 'จันทร์',
  2: 'อังคาร',
  3: 'พุธ',
  4: 'พฤหัสบดี',
  5: 'ศุกร์',
  6: 'เสาร์',
  7: 'อาทิตย์',
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

const subjectCardPalettes = [
  'from-rose-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-indigo-500',
] as const

const getSubjectPalette = (subjectKey: string) => {
  let hash = 0
  for (let i = 0; i < subjectKey.length; i++) {
    hash = (hash * 31 + subjectKey.charCodeAt(i)) >>> 0
  }
  return subjectCardPalettes[hash % subjectCardPalettes.length]
}

export default function Attendance() {
  const { user, role } = useAuthStore()
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceDateInput, setAttendanceDateInput] = useState(formatInputDate(new Date().toISOString().split('T')[0]))
  const [attendanceDateError, setAttendanceDateError] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({})
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultModalType, setResultModalType] = useState<'success' | 'error'>('success')
  const [resultModalMessage, setResultModalMessage] = useState('')

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
    enabled: !!user?.id && role === 'TEACHER'
  })

  // ครูเห็นเฉพาะคาบของตัวเอง, แอดมินเห็นทั้งหมด
  const { data: schedules } = useQuery({
    queryKey: ['schedules', role, teacherProfile?.id || 'all'],
    queryFn: () => getSchedules(undefined, role === 'TEACHER' ? teacherProfile?.id : undefined),
    enabled: role !== 'TEACHER' || !!teacherProfile?.id
  })

  const selectedDate = new Date(`${attendanceDate}T00:00:00`)
  const selectedDayOfWeek = (() => {
    const jsDay = selectedDate.getDay()
    return jsDay === 0 ? 7 : jsDay
  })()

  const schedulesForSelectedDay = (schedules || []).filter((s) => s.day_of_week === selectedDayOfWeek)

  useEffect(() => {
    if (selectedSchedule && !schedulesForSelectedDay.some((s) => s.id === selectedSchedule)) {
      setSelectedSchedule('')
      setAttendanceState({})
    }
  }, [selectedSchedule, schedulesForSelectedDay])
  
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
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
                className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${
                  resultModalType === 'success'
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">เลือกคาบเรียน / วิชา</label>
          <div className="space-y-2 max-h-72 overflow-auto pr-1">
            {schedulesForSelectedDay.map((s) => {
              const palette = getSubjectPalette(`${s.subject_id}-${s.subject?.subject_code || ''}`)
              const isActive = selectedSchedule === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSchedule(s.id)
                    setAttendanceState({})
                  }}
                  className={`w-full rounded-xl border text-left transition-all ${
                    isActive ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`rounded-xl bg-gradient-to-r ${palette} px-4 py-3 text-white`}>
                    <p className="text-xs font-semibold text-white/85">
                      {dayLabels[s.day_of_week] || '-'} • คาบ {s.period} ({s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)})
                    </p>
                    <h3 className="mt-0.5 text-sm font-bold">{s.subject?.subject_name || 'ไม่ระบุวิชา'}</h3>
                    <p className="text-xs text-white/90 mt-0.5">
                      {s.subject?.subject_code || '-'} • ห้อง {s.classroom?.level}/{s.classroom?.room}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
          {schedulesForSelectedDay.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">ไม่พบคาบเรียนในวันที่เลือก</p>
          )}
        </div>
        <div className="relative">
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

      {selectedSchedule && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <div className="overflow-x-auto">
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
                              <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'PRESENT' ? 'bg-green-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={16}/> เข้าเรียน</button>
                              <button onClick={() => setStatus(student.id, 'LATE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LATE' ? 'bg-yellow-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16}/> สาย</button>
                              <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'ABSENT' ? 'bg-red-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={16}/> ขาด</button>
                              <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LEAVE' ? 'bg-blue-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={16}/> ลา</button>
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
                  disabled={saveMutation.isPending || students?.length === 0}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการเข้าเรียน'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
