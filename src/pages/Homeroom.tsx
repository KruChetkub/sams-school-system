import React, { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassrooms } from '../services/classroomService'
import { getCheckedHomeroomClassroomsByDate, getExistingHomeroomAttendance, getHomeroomClassroomSummaryByDate, getStudentsByClassroom, saveHomeroomAttendance } from '../services/homeroomService'
import { CheckCircle, XCircle, AlertCircle, Clock, Calendar } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

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

export default function Homeroom() {
  const topRef = useRef<HTMLDivElement | null>(null)
  const studentTableRef = useRef<HTMLDivElement | null>(null)
  const { role } = useAuthStore()
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
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultModalType, setResultModalType] = useState<'success' | 'error'>('success')
  const [resultModalMessage, setResultModalMessage] = useState('')
  const pageSize = 10

  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  const { data: checkedClassrooms = [] } = useQuery({
    queryKey: ['homeroom_checked_classrooms', attendanceDate],
    queryFn: () => getCheckedHomeroomClassroomsByDate(attendanceDate),
    enabled: !!attendanceDate
  })
  const { data: classroomSummary = [] } = useQuery({
    queryKey: ['homeroom_classroom_summary', attendanceDate],
    queryFn: () => getHomeroomClassroomSummaryByDate(attendanceDate),
    enabled: !!attendanceDate,
  })
  
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedClassroom],
    queryFn: () => getStudentsByClassroom(selectedClassroom),
    enabled: !!selectedClassroom
  })

  const totalPages = Math.max(1, Math.ceil((students?.length || 0) / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedStudents = students?.slice(startIndex, startIndex + pageSize) || []
  const isSelectedClassroomAlreadyChecked = !!selectedClassroom && checkedClassrooms.some((c) => c.classroom_id === selectedClassroom)
  const selectedDateObj = new Date(`${attendanceDate}T00:00:00`)
  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const selectedOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate())
  const daysDiff = Math.floor((todayOnly.getTime() - selectedOnly.getTime()) / (1000 * 60 * 60 * 24))
  const canEditPastDate = role === 'ADMIN' || (role === 'TEACHER' && daysDiff >= 0 && daysDiff <= 30)

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
      return saveHomeroomAttendance(attendanceDate, records)
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

  return (
    <div ref={topRef} className="p-8 max-w-5xl mx-auto">
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
            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
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
          {classroomSummary.map((c) => {
            const isChecked = c.checked_students > 0
            const isActive = selectedClassroom === c.classroom_id
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
                className={`text-left rounded-xl border p-4 transition ${isActive ? 'ring-2 ring-blue-300' : ''} ${isChecked ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100' : 'border-slate-300 bg-slate-100 hover:bg-slate-200'}`}
              >
                <p className="font-bold text-slate-800">{c.classroom_label}</p>
                <p className={`text-xs mt-1 ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`}>{isChecked ? 'เช็คแล้ว' : 'ยังไม่เช็ค'}</p>
                <div className="mt-2 text-xs text-slate-700 grid grid-cols-2 gap-y-1">
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
            {checkedClassrooms.length === 0 ? (
              <p className="text-sm text-amber-700 mt-1">ยังไม่มีห้องที่เช็คชื่อเข้าแถวในวันนี้</p>
            ) : (
              <p className="text-sm text-amber-700 mt-1">
                เช็คแล้ว {checkedClassrooms.length} ห้อง: {checkedClassrooms.map((c) => c.classroom_label).join(', ')}
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
              <div className="overflow-x-auto">
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
                              <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'PRESENT' ? 'bg-green-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={16}/> มา</button>
                              <button onClick={() => setStatus(student.id, 'LATE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LATE' ? 'bg-yellow-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16}/> สาย</button>
                              <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'ABSENT' ? 'bg-red-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={16}/> ขาด</button>
                              <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LEAVE' ? 'bg-blue-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={16}/> ลา</button>
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
