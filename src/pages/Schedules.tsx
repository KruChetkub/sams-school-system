import React, { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSchedules, createSchedule, deleteSchedule, updateSchedule } from '../services/scheduleService'
import { getSubjects } from '../services/subjectService'
import { getClassrooms } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
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

export default function Schedules() {
  const formRef = useRef<HTMLFormElement | null>(null)
  const queryClient = useQueryClient()
  const { data: schedules, isLoading } = useQuery({ queryKey: ['schedules'], queryFn: () => getSchedules() })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
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
    const payload = {
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      period: parseInt(formData.period),
      room_name: formData.room_name.trim() || null,
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
    setShowForm(true)
  }

  const openEditForm = (schedule: any) => {
    setEditingScheduleId(schedule.id)
    setFormData({
      subject_id: schedule.subject_id,
      teacher_id: schedule.teacher_id,
      classroom_id: schedule.classroom_id,
      day_of_week: String(schedule.day_of_week),
      period: String(schedule.period),
      start_time: (schedule.start_time || '08:30').substring(0, 5),
      end_time: (schedule.end_time || '09:20').substring(0, 5),
      room_name: schedule.room_name || ''
    })
    setShowForm(true)
  }

  useEffect(() => {
    if (showForm && editingScheduleId && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showForm, editingScheduleId])

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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการตารางเรียน (Schedules)</h1>
        <button 
          onClick={openCreateForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> จัดตารางเรียน
        </button>
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
            <label className="block text-sm font-medium text-gray-700">ห้องเรียน</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white" value={formData.classroom_id} onChange={e => setFormData({...formData, classroom_id: e.target.value})}>
              <option value="">-- เลือกห้องเรียน --</option>
              {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
            </select>
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
                    {schedule.room_name && <span className="text-gray-500 text-xs">ห้อง: {schedule.room_name}</span>}
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
