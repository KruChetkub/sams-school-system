import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSchedules, createSchedule, deleteSchedule } from '../services/scheduleService'
import { getSubjects } from '../services/subjectService'
import { getClassrooms } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
import { Plus, Trash2, Calendar } from 'lucide-react'

const DAYS = [
  { value: 1, label: 'จันทร์' },
  { value: 2, label: 'อังคาร' },
  { value: 3, label: 'พุธ' },
  { value: 4, label: 'พฤหัสบดี' },
  { value: 5, label: 'ศุกร์' },
]

export default function Schedules() {
  const queryClient = useQueryClient()
  const { data: schedules, isLoading } = useQuery({ queryKey: ['schedules'], queryFn: () => getSchedules() })
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
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

  const createMutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      setShowForm(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      period: parseInt(formData.period),
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการตารางเรียน (Schedules)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> จัดตารางเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <input type="time" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">เวลาสิ้นสุด</label>
            <input type="time" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
          </div>
          
          <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">บันทึกข้อมูล</button>
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
                    <div className="text-xs text-gray-500">คาบ {schedule.period} ({schedule.start_time.substring(0,5)} - {schedule.end_time.substring(0,5)})</div>
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
                      onClick={() => {if(window.confirm('ยืนยันการลบตารางสอน?')) deleteMutation.mutate(schedule.id)}} 
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
