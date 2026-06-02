import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAcademicYears, 
  createAcademicYear, 
  updateAcademicYear, 
  deleteAcademicYear, 
  setActiveYear, 
  setActiveSemester,
  updateSemester 
} from '../services/academicYearService'
import { Plus, Trash2, Edit, CalendarRange, Check, AlertTriangle, Calendar, X, Settings } from 'lucide-react'

const pad = (value: number) => String(value).padStart(2, '0');

const formatThaiBEEInputDate = (isoDate: string) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  const beYear = parseInt(y, 10) + 543;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${beYear}`;
};

const parseThaiBEInputDate = (input: string) => {
  if (!input) return null;
  const parts = input.split('/').map(part => part.trim());
  if (parts.length !== 3) return null;
  const [dayStr, monthStr, yearStr] = parts;
  if (!/^[0-9]{1,2}$/.test(dayStr) || !/^[0-9]{1,2}$/.test(monthStr) || !/^[0-9]{4}$/.test(yearStr)) return null;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const beYear = Number(yearStr);
  const year = beYear - 543;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
};

const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const ThaiDatePicker = ({
  value,
  onChange,
  placeholder = 'วว/ดด/ปปปป',
}: {
  value: string
  onChange: (isoDate: string) => void
  placeholder?: string
}) => {
  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date()
  const [input, setInput] = useState(formatThaiBEEInputDate(value))
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth())
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear())

  React.useEffect(() => {
    setInput(formatThaiBEEInputDate(value))
    if (value) {
      const date = new Date(`${value}T00:00:00`)
      setCalendarMonth(date.getMonth())
      setCalendarYear(date.getFullYear())
    }
  }, [value])

  const commitInput = () => {
    if (!input.trim()) {
      onChange('')
      setError('')
      return
    }
    const isoDate = parseThaiBEInputDate(input)
    if (!isoDate) {
      setError('โปรดกรอกวันที่รูปแบบ วว/ดด/ปปปป')
      return
    }
    onChange(isoDate)
    setInput(formatThaiBEEInputDate(isoDate))
    setError('')
  }

  const selectDate = (day: number) => {
    const isoDate = `${calendarYear}-${pad(calendarMonth + 1)}-${pad(day)}`
    onChange(isoDate)
    setInput(formatThaiBEEInputDate(isoDate))
    setError('')
    setIsOpen(false)
  }

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const calendarCells = Array(firstWeekday).fill(null).concat(Array.from({ length: daysInMonth }, (_, index) => index + 1))

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onBlur={commitInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitInput()
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="absolute inset-y-0 right-0 px-3 text-indigo-600 hover:text-indigo-800"
          aria-label="เปิดปฏิทินไทย"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {isOpen && (
        <div className="absolute z-30 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11)
                  setCalendarYear((year) => year - 1)
                } else {
                  setCalendarMonth((month) => month - 1)
                }
              }}
              className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-700">{thaiMonths[calendarMonth]} {calendarYear + 543}</span>
            <button
              type="button"
              onClick={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0)
                  setCalendarYear((year) => year + 1)
                } else {
                  setCalendarMonth((month) => month + 1)
                }
              }}
              className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
            {thaiWeekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((day, index) => (
              <button
                key={`${calendarYear}-${calendarMonth}-${index}`}
                type="button"
                disabled={!day}
                onClick={() => day && selectDate(day)}
                className={`h-8 rounded-lg text-xs ${day ? 'text-gray-700 hover:bg-indigo-50' : ''} ${
                  value === `${calendarYear}-${pad(calendarMonth + 1)}-${pad(day || 0)}` ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''
                }`}
              >
                {day || ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AcademicYears() {
  const queryClient = useQueryClient()
  
  // Queries
  const { data: academicYears, isLoading, error } = useQuery({
    queryKey: ['academicYears'],
    queryFn: getAcademicYears
  })

  // States
  const [showYearModal, setShowYearModal] = useState(false)
  const [editingYear, setEditingYear] = useState<any | null>(null)
  const [deletingYearId, setDeletingYearId] = useState<string | null>(null)
  
  const [editingSemester, setEditingSemester] = useState<any | null>(null)
  
  const [yearForm, setYearForm] = useState({
    year: '',
    label: '',
    start_date: '',
    end_date: ''
  })

  const [semesterForm, setSemesterForm] = useState({
    start_date: '',
    end_date: ''
  })

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      setShowYearModal(false)
      resetYearForm()
    }
  })

  const updateYearMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateAcademicYear(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      setShowYearModal(false)
      setEditingYear(null)
      resetYearForm()
    }
  })

  const deleteYearMutation = useMutation({
    mutationFn: deleteAcademicYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      setDeletingYearId(null)
    }
  })

  const activateYearMutation = useMutation({
    mutationFn: setActiveYear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
    }
  })

  const activateSemesterMutation = useMutation({
    mutationFn: setActiveSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
    }
  })

  const updateSemesterMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateSemester(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicYears'] })
      setEditingSemester(null)
    }
  })

  // Handlers
  const resetYearForm = () => {
    setYearForm({
      year: '',
      label: '',
      start_date: '',
      end_date: ''
    })
  }

  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      year: yearForm.year,
      label: yearForm.label || `ปีการศึกษา ${yearForm.year}`,
      start_date: yearForm.start_date || null,
      end_date: yearForm.end_date || null
    }

    if (editingYear) {
      updateYearMutation.mutate({ id: editingYear.id, payload })
    } else {
      createYearMutation.mutate(payload)
    }
  }

  const handleSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSemester) return
    updateSemesterMutation.mutate({
      id: editingSemester.id,
      payload: {
        start_date: semesterForm.start_date || null,
        end_date: semesterForm.end_date || null
      }
    })
  }

  const openEditYear = (year: any) => {
    setEditingYear(year)
    const start = year.start_date || ''
    const end = year.end_date || ''
    setYearForm({
      year: year.year,
      label: year.label || '',
      start_date: start,
      end_date: end
    })

    setShowYearModal(true)
  }

  const openEditSemester = (sem: any) => {
    setEditingSemester(sem)
    const start = sem.start_date || ''
    const end = sem.end_date || ''
    setSemesterForm({
      start_date: start,
      end_date: end
    })

  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-indigo-800 to-purple-800 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <CalendarRange className="w-8 h-8 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">จัดการปีการศึกษา (Academic Years)</h1>
            <p className="text-sm text-indigo-200 mt-1">ตั้งค่า ข้อมูลปีการศึกษา และ ภาคเรียนหลัก ที่ใช้ในการดึงข้อมูลเข้าระบบ</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingYear(null)
            resetYearForm()
            setShowYearModal(true)
          }}
          className="bg-white text-indigo-900 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-50 transition shadow-md self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มปีการศึกษา</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: {(error as any).message}</p>
        </div>
      ) : academicYears?.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-500 p-12 text-center rounded-2xl">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium">ยังไม่มีข้อมูลปีการศึกษาในระบบ</p>
          <p className="text-sm mt-1">กดปุ่ม "เพิ่มปีการศึกษา" ด้านบนเพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {academicYears?.map((year) => (
            <div
              key={year.id}
              className={`bg-white border rounded-2xl shadow-sm transition overflow-hidden ${
                year.is_active ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'
              }`}
            >
              {/* Header Year Card */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800">{year.label || `ปีการศึกษา ${year.year}`}</h2>
                    {year.is_active ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        ปีการศึกษาปัจจุบัน
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
                        ยังไม่เปิดใช้
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>ระยะเวลา: </span>
                    <span>
                      {year.start_date ? new Date(year.start_date).toLocaleDateString('th-TH') : 'ยังไม่ระบุ'}
                    </span>
                    <span> - </span>
                    <span>
                      {year.end_date ? new Date(year.end_date).toLocaleDateString('th-TH') : 'ยังไม่ระบุ'}
                    </span>
                  </div>
                </div>

                {/* Year Actions */}
                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                  {!year.is_active && (
                    <button
                      onClick={() => activateYearMutation.mutate(year.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-medium transition shadow-sm"
                    >
                      ตั้งเป็นปีการศึกษาหลัก
                    </button>
                  )}
                  <button
                    onClick={() => openEditYear(year)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="แก้ไขปีการศึกษา"
                  >
                    <Edit className="w-4.5 h-4.5" />
                  </button>
                  <button
                    onClick={() => setDeletingYearId(year.id)}
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="ลบปีการศึกษา"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Semesters section */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ภาคเรียนย่อย (Semesters)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {year.semesters?.map((sem) => (
                    <div
                      key={sem.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        sem.is_active
                          ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-200'
                          : 'border-gray-100 bg-gray-50/20'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-800">{sem.label || `ภาคเรียนที่ ${sem.semester_number}`}</h4>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {sem.start_date ? new Date(sem.start_date).toLocaleDateString('th-TH') : 'ยังไม่ระบุ'}
                            </span>
                            <span> - </span>
                            <span>
                              {sem.end_date ? new Date(sem.end_date).toLocaleDateString('th-TH') : 'ยังไม่ระบุ'}
                            </span>
                          </div>
                        </div>

                        {sem.is_active ? (
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            ภาคเรียนปัจจุบัน
                          </span>
                        ) : (
                          <button
                            onClick={() => activateSemesterMutation.mutate(sem.id)}
                            className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-1 rounded hover:bg-indigo-700 transition"
                          >
                            เปิดใช้งาน
                          </button>
                        )}
                      </div>

                      <div className="flex justify-end border-t border-gray-100/70 pt-2">
                        <button
                          onClick={() => openEditSemester(sem)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>ตั้งค่าช่วงเวลา</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 rounded-t-2xl bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingYear ? 'แก้ไขข้อมูลปีการศึกษา' : 'เพิ่มปีการศึกษาใหม่'}
              </h2>
              <button onClick={() => setShowYearModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleYearSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ปีการศึกษา (พ.ศ.) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 2569"
                  disabled={!!editingYear} // ห้ามแก้ปีการศึกษาซึ่งเป็น Key
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  value={yearForm.year}
                  onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อป้ายแสดงผล (Label)</label>
                <input
                  type="text"
                  placeholder="เช่น ปีการศึกษา 2569"
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={yearForm.label}
                  onChange={(e) => setYearForm({ ...yearForm, label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">วันที่เริ่มต้น</label>
                  <ThaiDatePicker
                    value={yearForm.start_date}
                    onChange={(start_date) => setYearForm({ ...yearForm, start_date })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">วันที่สิ้นสุด</label>
                  <ThaiDatePicker
                    value={yearForm.end_date}
                    onChange={(end_date) => setYearForm({ ...yearForm, end_date })}
                  />
                </div>
              </div>

              {(createYearMutation.error || updateYearMutation.error) && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  บันทึกไม่สำเร็จ: {((createYearMutation.error || updateYearMutation.error) as Error).message}
                </div>
              )}

              {!editingYear && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    เมื่อสร้างปีการศึกษาแล้ว ระบบจะสร้าง <strong>ภาคเรียนที่ 1</strong> และ <strong>ภาคเรียนที่ 2</strong> ให้อัตโนมัติเป็นค่าตั้งต้น
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createYearMutation.isPending || updateYearMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md disabled:bg-indigo-300"
                >
                  {createYearMutation.isPending || updateYearMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Semester Modal */}
      {editingSemester && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 rounded-t-2xl bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">ตั้งค่าช่วงเวลา: {editingSemester.label}</h2>
              <button onClick={() => setEditingSemester(null)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSemesterSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">วันที่เริ่มต้น</label>
                  <ThaiDatePicker
                    value={semesterForm.start_date}
                    onChange={(start_date) => setSemesterForm({ ...semesterForm, start_date })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">วันที่สิ้นสุด</label>
                  <ThaiDatePicker
                    value={semesterForm.end_date}
                    onChange={(end_date) => setSemesterForm({ ...semesterForm, end_date })}
                  />
                </div>
              </div>

              {updateSemesterMutation.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  บันทึกไม่สำเร็จ: {(updateSemesterMutation.error as Error).message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSemester(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updateSemesterMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md disabled:bg-indigo-300"
                >
                  {updateSemesterMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกช่วงเวลา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingYearId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">ยืนยันการลบปีการศึกษา?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  การลบปีการศึกษาจะลบภาคเรียนที่เกี่ยวข้องทั้งหมด การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingYearId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => deleteYearMutation.mutate(deletingYearId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
