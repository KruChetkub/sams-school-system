import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSchedules, createSchedule, deleteSchedule, updateSchedule } from '../services/scheduleService'
import { getSubjects } from '../services/subjectService'
import { getClassrooms } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { useAuthStore } from '../store/authStore'
import { Plus, Trash2, Pencil } from 'lucide-react'

const DAYS = [
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
  { value: 6, label: 'เสาร์' },
  { value: 7, label: 'อาทิตย์' },
]

const DEFAULT_TIME_SLOTS = [
  { start: '08:30', end: '09:20' },
  { start: '09:20', end: '10:10' },
  { start: '10:20', end: '11:10' },
  { start: '11:10', end: '12:00' },
  { start: '12:00', end: '13:00' },
  { start: '13:00', end: '13:50' },
  { start: '13:50', end: '14:40' },
  { start: '14:50', end: '15:40' },
]

const LUNCH_SLOT_KEY = '12:00:00-13:00:00'
const MULTI_CLASSROOM_PREFIX = '[MULTI_CLASSROOM_IDS]'
const SCHEDULE_THEME_STORAGE_KEY = 'sams_schedule_calendar_theme'

const CALENDAR_THEMES = [
  {
    key: 'green-board',
    label: 'กระดานเขียว',
    wrapper: 'bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-700/40',
    head: 'bg-emerald-900/60',
    text: 'text-emerald-50',
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
    text: 'text-emerald-900',
    subtext: 'text-emerald-800/90',
    tableWrap: 'border-emerald-200 bg-white/65',
    border: 'border-emerald-200',
    rowHead: 'bg-emerald-100 text-emerald-900',
    empty: 'border-emerald-300 bg-emerald-50/70',
  },
  {
    key: 'sky-soft',
    label: 'ฟ้านุ่ม',
    wrapper: 'bg-gradient-to-br from-sky-100 to-cyan-200 border-cyan-200',
    head: 'bg-cyan-200/80',
    text: 'text-cyan-900',
    subtext: 'text-cyan-800/90',
    tableWrap: 'border-cyan-200 bg-white/65',
    border: 'border-cyan-200',
    rowHead: 'bg-cyan-100 text-cyan-900',
    empty: 'border-cyan-300 bg-cyan-50/70',
  },
]

const SUBJECT_CARD_PALETTES = [
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
]

const formatThai24Hour = (time: string) => {
  if (!time) return '-'
  const normalized = time.length === 5 ? `${time}:00` : time
  const date = new Date(`1970-01-01T${normalized}+07:00`)
  if (Number.isNaN(date.getTime())) return time.substring(0, 5)
  return new Intl.DateTimeFormat('th-TH-u-hc-h23', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(date)
}

const splitTime = (time: string) => {
  const [hour = '00', minute = '00'] = time.split(':')
  return { hour, minute }
}

const normalizeTimePart = (value: string, max: number) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '00'
  const clamped = Math.max(0, Math.min(max, Math.floor(numeric)))
  return String(clamped).padStart(2, '0')
}

const getSubjectPalette = (subjectKey: string) => {
  let hash = 0
  for (let i = 0; i < subjectKey.length; i += 1) {
    hash = (hash * 31 + subjectKey.charCodeAt(i)) >>> 0
  }
  return SUBJECT_CARD_PALETTES[hash % SUBJECT_CARD_PALETTES.length]
}

export default function Schedules() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const queryClient = useQueryClient()
  const { selectedYear, selectedSemester } = useAcademicYearStore()
  const { role } = useAuthStore()

  const { data: schedules, isLoading } = useQuery({ 
    queryKey: ['schedules', selectedYear?.id], 
    queryFn: () => getSchedules(undefined, undefined, selectedYear?.id) 
  })
  const { data: subjects } = useQuery({ 
    queryKey: ['subjects', selectedYear?.id, selectedSemester?.id], 
    queryFn: () => getSubjects(selectedYear?.id, selectedSemester?.id) 
  })
  const { data: classrooms } = useQuery({ 
    queryKey: ['classrooms', selectedYear?.id], 
    queryFn: () => getClassrooms(selectedYear?.id) 
  })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [calendarTheme, setCalendarTheme] = useState(() => {
    const saved = localStorage.getItem(SCHEDULE_THEME_STORAGE_KEY)
    if (saved && CALENDAR_THEMES.some((theme) => theme.key === saved)) return saved
    return CALENDAR_THEMES[0].key
  })
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [moveSourceId, setMoveSourceId] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState<{ day: number; slot: string } | null>(null)
  const [formData, setFormData] = useState({
    subject_id: '',
    teacher_id: '',
    classroom_id: '',
    day_of_week: '1',
    period: '1',
    start_time: '08:30',
    end_time: '09:20',
    room_name: ''
  })
  const [extraClassroomIds, setExtraClassroomIds] = useState<string[]>([])

  const updateTimePart = (field: 'start_time' | 'end_time', part: 'hour' | 'minute', rawValue: string) => {
    const { hour, minute } = splitTime(formData[field])
    if (part === 'hour') {
      const clean = rawValue.replace(/\D/g, '').slice(0, 2)
      setFormData({ ...formData, [field]: `${clean || '00'}:${minute}` })
      return
    }
    const clean = rawValue.replace(/\D/g, '').slice(0, 2)
    setFormData({ ...formData, [field]: `${hour}:${clean || '00'}` })
  }

  const normalizeTimeField = (field: 'start_time' | 'end_time') => {
    const { hour, minute } = splitTime(formData[field])
    const normalizedHour = normalizeTimePart(hour, 23)
    const normalizedMinute = normalizeTimePart(minute, 59)
    setFormData({ ...formData, [field]: `${normalizedHour}:${normalizedMinute}` })
  }

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setShowForm(false)
    },
    onError: (error: any) => {
      window.alert(error?.message || 'ไม่สามารถบันทึกตารางเรียนได้')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateSchedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setShowForm(false)
      setEditingScheduleId(null)
    },
    onError: (error: any) => {
      window.alert(error?.message || 'ไม่สามารถบันทึกการแก้ไขตารางเรียนได้')
      console.error('updateSchedule error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const multiClassroomMeta = extraClassroomIds.length > 0 ? `${MULTI_CLASSROOM_PREFIX}${extraClassroomIds.join(',')}` : ''
    const mergedRoomName = [formData.room_name.trim(), multiClassroomMeta].filter(Boolean).join(' | ')
    const payload = {
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      period: parseInt(formData.period),
      room_name: mergedRoomName || null,
    }
    if (editingScheduleId) {
      updateMutation.mutate({ id: editingScheduleId, payload })
      return
    }
    createMutation.mutate(payload)
  }

  const resetFormState = () => {
    setFormData({
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      day_of_week: '1',
      period: '1',
      start_time: '08:30',
      end_time: '09:20',
      room_name: ''
    })
    setExtraClassroomIds([])
    setEditingScheduleId(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    setEditingScheduleId(null)
    setFormData({
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      day_of_week: '1',
      period: '1',
      start_time: '08:30',
      end_time: '09:20',
      room_name: ''
    })
    setExtraClassroomIds([])
    setShowForm(true)
  }

  const openEditForm = (schedule: any) => {
    const roomName: string = schedule.room_name || ''
    const parseMeta = () => {
      const tag = roomName.split('|').map((x: string) => x.trim()).find((x: string) => x.startsWith(MULTI_CLASSROOM_PREFIX))
      if (!tag) return []
      return tag.replace(MULTI_CLASSROOM_PREFIX, '').split(',').map((x: string) => x.trim()).filter(Boolean)
    }
    const cleanRoomName = roomName
      .split('|')
      .map((x: string) => x.trim())
      .filter((x: string) => !x.startsWith(MULTI_CLASSROOM_PREFIX))
      .join(' | ')
    setEditingScheduleId(schedule.id)
    setFormData({
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      classroom_id: schedule.classroom_id,
      day_of_week: String(schedule.day_of_week),
      period: String(schedule.period),
      start_time: (schedule.start_time || '08:30').substring(0, 5),
      end_time: (schedule.end_time || '09:20').substring(0, 5),
      room_name: cleanRoomName
    })
    setExtraClassroomIds(parseMeta().filter((id: string) => id !== schedule.classroom_id))
    setShowForm(true)
  }

  useEffect(() => {
    if (showForm && editingScheduleId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showForm, editingScheduleId])

  useEffect(() => {
    localStorage.setItem(SCHEDULE_THEME_STORAGE_KEY, calendarTheme)
  }, [calendarTheme])

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
  const dataTimeSlots = Array.from(slotMap.keys()).sort((a, b) => a.localeCompare(b))
  const fallbackSlots = DEFAULT_TIME_SLOTS.map((slot) => `${slot.start}:00-${slot.end}:00`)
  const timeSlots = Array.from(new Set([...fallbackSlots, ...dataTimeSlots])).sort((a, b) => a.localeCompare(b))

  const findScheduleByDayAndSlot = (day: number, slot: string) => {
    const items = slotMap.get(slot) || []
    return items.find((s) => s.day_of_week === day) || null
  }

  const moveSourceSchedule = sortedSchedules.find((s) => s.id === moveSourceId) || null
  const activeTheme = CALENDAR_THEMES.find((t) => t.key === calendarTheme) || CALENDAR_THEMES[0]
  const moveTargetSchedule = moveTarget ? findScheduleByDayAndSlot(moveTarget.day, moveTarget.slot) : null

  const handleCellClickForMove = (day: number, slot: string, scheduleInCell: typeof sortedSchedules[number] | null) => {
    if (!moveSourceId) {
      if (scheduleInCell) setMoveSourceId(scheduleInCell.id)
      return
    }

    if (scheduleInCell?.id === moveSourceId) {
      setMoveSourceId(null)
      setMoveTarget(null)
      return
    }

    setMoveTarget({ day, slot })
  }

  const confirmMoveMutation = useMutation({
    mutationFn: async ({
      source,
      target,
      destination,
    }: {
      source: any
      target: any | null
      destination: { day: number; slot: string }
    }) => {
      const [destStartTime, destEndTime] = destination.slot.split('-')
      const destinationPeriod = timeSlots.indexOf(destination.slot) + 1

      if (!target) {
        const sourcePayload = {
          day_of_week: destination.day,
          start_time: destStartTime,
          end_time: destEndTime,
          period: destinationPeriod,
        }
        await updateSchedule(source.id, sourcePayload)
        return
      }

      const sourceOriginal = {
        day_of_week: source.day_of_week,
        start_time: source.start_time,
        end_time: source.end_time,
        period: source.period,
      }

      const targetPayload = {
        day_of_week: sourceOriginal.day_of_week,
        start_time: sourceOriginal.start_time,
        end_time: sourceOriginal.end_time,
        period: sourceOriginal.period,
      }

      const sourcePayload = {
        day_of_week: destination.day,
        start_time: destStartTime,
        end_time: destEndTime,
        period: destinationPeriod,
      }

      await updateSchedule(target.id, targetPayload)
      try {
        await updateSchedule(source.id, sourcePayload)
      } catch (error) {
        await updateSchedule(target.id, {
          day_of_week: target.day_of_week,
          start_time: target.start_time,
          end_time: target.end_time,
          period: target.period,
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setMoveSourceId(null)
      setMoveTarget(null)
    },
    onError: (error: any) => {
      window.alert(error?.message || 'ไม่สามารถย้ายคาบเรียนได้')
    },
  })

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 font-semibold shadow-sm">
          ไม่มีสิทธิ์เข้าถึงหน้าจัดการตารางเรียน
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteTargetId(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className="h-1.5 w-full bg-rose-500" />
            <div className="p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <Trash2 size={26} className="text-rose-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">ยืนยันการลบ</h3>
              <p className="text-sm text-gray-600">คุณต้องการลบตารางสอนนี้ใช่หรือไม่?</p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteMutation.mutate(deleteTargetId)
                    setDeleteTargetId(null)
                  }}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700 transition"
                >
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {moveSourceSchedule && moveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setMoveTarget(null)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className="h-1.5 w-full bg-blue-600" />
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">ยืนยันการย้ายคาบเรียน</h3>
              <p className="text-sm text-gray-600 mb-4">ต้องการย้ายวิชานี้ไปตำแหน่งใหม่ใช่หรือไม่?</p>
              <div className="space-y-2 text-sm bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p><span className="font-semibold text-gray-700">วิชา:</span> {moveSourceSchedule.subject?.subject_code} {moveSourceSchedule.subject?.subject_name}</p>
                <p><span className="font-semibold text-gray-700">จาก:</span> วัน{DAYS.find(d => d.value === moveSourceSchedule.day_of_week)?.label} ({formatThai24Hour(moveSourceSchedule.start_time)} - {formatThai24Hour(moveSourceSchedule.end_time)})</p>
                <p><span className="font-semibold text-gray-700">ไป:</span> วัน{DAYS.find(d => d.value === moveTarget.day)?.label} ({formatThai24Hour(moveTarget.slot.split('-')[0])} - {formatThai24Hour(moveTarget.slot.split('-')[1])})</p>
                {moveTargetSchedule && <p className="text-blue-700">ระบบจะสลับคาบอัตโนมัติ: วิชาปลายทางจะย้ายกลับมายังตำแหน่งเดิมของวิชาต้นทาง</p>}
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMoveTarget(null)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmMoveMutation.mutate({
                      source: moveSourceSchedule,
                      target: moveTargetSchedule,
                      destination: moveTarget,
                    })
                  }}
                  disabled={confirmMoveMutation.isPending}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {confirmMoveMutation.isPending ? 'กำลังอัปเดต...' : moveTargetSchedule ? 'ยืนยันสลับคาบ' : 'ยืนยันย้าย'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการตารางเรียน (Schedules)</h1>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              มุมมองตารางสอน
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              มุมมองรายการ
            </button>
          </div>
          <button
            onClick={openCreateForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={20} /> จัดตารางเรียน
          </button>
        </div>
      </div>

      {showForm && (
        <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">วิชา</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white" value={formData.subject_id} onChange={e => {
              const subj = subjects?.find(s => s.id === e.target.value);
              setFormData({...formData, subject_id: e.target.value, teacher_id: subj?.teacher_id || formData.teacher_id})
            }}>
              <option value="">-- เลือกวิชา --</option>
              {subjects?.map(s => <option key={s.id} value={s.id}>{s.subject_code} {s.subject_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูผู้สอน</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
              <option value="">-- เลือกครู --</option>
              {teachers?.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้องเรียนหลักของคาบ</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white" value={formData.classroom_id} onChange={e => {
              const nextMain = e.target.value
              setFormData({...formData, classroom_id: nextMain})
              setExtraClassroomIds(prev => prev.filter(id => id !== nextMain))
            }}>
              <option value="">-- เลือกห้องเรียนหลัก --</option>
              {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้องเรียนเพิ่มเติม (เรียนรวม)</label>
            <div className="mt-1 max-h-[140px] overflow-y-auto rounded-lg border border-gray-300 bg-white p-2.5 space-y-1.5">
              {classrooms?.map(c => {
                const disabled = c.id === formData.classroom_id
                const checked = extraClassroomIds.includes(c.id)
                return (
                  <label key={c.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      disabled={disabled}
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setExtraClassroomIds(prev => Array.from(new Set([...prev, c.id])))
                        } else {
                          setExtraClassroomIds(prev => prev.filter(id => id !== c.id))
                        }
                      }}
                    />
                    <span className="text-sm text-slate-700">{c.level}/{c.room}</span>
                  </label>
                )
              })}
            </div>
            <p className="mt-1 text-xs text-slate-500">ติ๊กเลือกได้หลายห้อง ระบบจะดึงนักเรียนจากทุกห้องที่เลือกใน Attendance</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">วัน</label>
            <select className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white" value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})}>
              {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">คาบที่</label>
            <input type="number" min="1" max="10" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้องพัก/อาคาร (ไม่บังคับ)</label>
            <input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.room_name} onChange={e => setFormData({...formData, room_name: e.target.value})} placeholder="เช่น ห้อง 501" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">เวลาเริ่ม</label>
            <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
                value={splitTime(formData.start_time).hour}
                onChange={(e) => updateTimePart('start_time', 'hour', e.target.value)}
                onBlur={() => normalizeTimeField('start_time')}
              />
              <span className="text-gray-500 font-semibold">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
                value={splitTime(formData.start_time).minute}
                onChange={(e) => updateTimePart('start_time', 'minute', e.target.value)}
                onBlur={() => normalizeTimeField('start_time')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">เวลาสิ้นสุด</label>
            <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
                value={splitTime(formData.end_time).hour}
                onChange={(e) => updateTimePart('end_time', 'hour', e.target.value)}
                onBlur={() => normalizeTimeField('end_time')}
              />
              <span className="text-gray-500 font-semibold">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
                value={splitTime(formData.end_time).minute}
                onChange={(e) => updateTimePart('end_time', 'minute', e.target.value)}
                onBlur={() => normalizeTimeField('end_time')}
              />
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-4">
            <button type="button" onClick={resetFormState} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
              {editingScheduleId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : viewMode === 'calendar' ? (
        <div className={`rounded-2xl shadow-lg border p-4 md:p-6 overflow-hidden ${activeTheme.wrapper}`}>
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <h2 className={`text-xl md:text-2xl font-bold ${activeTheme.text}`}>ตารางสอนรายสัปดาห์</h2>
            <div className="flex items-center gap-2">
              <p className={`text-xs md:text-sm ${activeTheme.subtext}`}>ธีมสี:</p>
              {CALENDAR_THEMES.map((theme) => (
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

          <div className={`overflow-x-auto rounded-xl border ${activeTheme.tableWrap}`}>
            <table className="min-w-[900px] w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[92px]" />
                {timeSlots.map((slot) => (
                  <col key={`col-${slot}`} className={slot === LUNCH_SLOT_KEY ? 'w-[92px]' : 'w-[132px]'} />
                ))}
              </colgroup>
              <thead>
                <tr className={activeTheme.head}>
                  <th className={`px-4 py-3 text-left text-xs font-semibold border ${activeTheme.text} ${activeTheme.border}`}>วัน / เวลา</th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className={`px-3 py-3 text-center text-xs font-semibold border ${activeTheme.text} ${activeTheme.border}`}>
                      {formatThai24Hour(slot.split('-')[0])} - {formatThai24Hour(slot.split('-')[1])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.filter((d) => d.value <= 5).map((day) => (
                  <tr key={day.value} className="align-top">
                    <td className={`px-4 py-4 text-sm font-bold border whitespace-nowrap ${activeTheme.rowHead} ${activeTheme.border}`}>
                      วัน{day.label}
                    </td>
                    {timeSlots.map((slot) => {
                      const schedule = findScheduleByDayAndSlot(day.value, slot)
                      const palette = schedule
                        ? getSubjectPalette(`${schedule.subject_id || ''}-${schedule.subject?.subject_code || ''}`)
                        : null
                      return (
                        <td key={`${day.value}-${slot}`} className={`border p-2 md:p-3 h-[120px] ${activeTheme.border}`}>
                          {schedule ? (
                            <div
                              onClick={() => handleCellClickForMove(day.value, slot, schedule)}
                              className={`h-full w-full rounded-lg p-2.5 shadow-sm cursor-pointer transition overflow-hidden ${moveSourceId === schedule.id ? 'ring-2 ring-blue-500' : ''} ${palette?.card || 'bg-white/95 border border-gray-200 hover:bg-blue-50'}`}
                            >
                              <p className={`text-xs font-bold ${palette?.code || 'text-blue-700'}`}>{schedule.subject?.subject_code || '-'}</p>
                              <p className={`mt-0.5 text-xs line-clamp-2 ${palette?.name || 'text-gray-700'}`}>{schedule.subject?.subject_name || '-'}</p>
                              <p className={`mt-1 text-[11px] ${palette?.meta || 'text-gray-500'}`}>คาบ {schedule.period}</p>
                              <p className={`text-[11px] ${palette?.meta || 'text-gray-500'}`}>
                                {schedule.classroom ? `${schedule.classroom.level}/${schedule.classroom.room}` : '-'}
                              </p>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleCellClickForMove(day.value, slot, null)}
                              className={`h-full rounded-lg border border-dashed cursor-pointer transition ${moveSourceId ? 'border-blue-300 bg-blue-50/30 hover:bg-blue-100/40' : activeTheme.empty}`}
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">วัน / เวลา (คาบ)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">วิชา</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้สอน</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules?.map(schedule => (
                <tr key={schedule.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium text-blue-600">{DAYS.find(d => d.value === schedule.day_of_week)?.label}</div>
                    <div className="text-xs text-gray-500">คาบ {schedule.period} ({formatThai24Hour(schedule.start_time)} - {formatThai24Hour(schedule.end_time)})</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {schedule.subject?.subject_code} <br/>
                    <span className="text-gray-500 text-xs">{schedule.subject?.subject_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {schedule.teacher ? `${schedule.teacher.first_name} ${schedule.teacher.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {schedule.classroom?.level}/{schedule.classroom?.room} <br/>
                    {schedule.room_name && (
                      <span className="text-gray-500 text-xs">
                        ห้อง: {String(schedule.room_name).split('|').map((x: string) => x.trim()).filter((x: string) => !x.startsWith(MULTI_CLASSROOM_PREFIX)).join(' | ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => openEditForm(schedule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex justify-center mr-2"
                      title="แก้ไขข้อมูล"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setDeleteTargetId(schedule.id)} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules?.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลตารางเรียนในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
