import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassrooms, createClassroom, deleteClassroom } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'

export default function Classrooms() {
  const queryClient = useQueryClient()
  const { data: classrooms, isLoading } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    level: '',
    room: '',
    advisor_id: ''
  })

  const createMutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      setShowForm(false)
      setFormData({ level: '', room: '', advisor_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      setConfirmDeleteId(null)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      level: formData.level,
      room: formData.room,
      ...(formData.advisor_id ? { advisor_id: formData.advisor_id } : {})
    }
    createMutation.mutate(payload)
  }

  // หาชื่อห้องที่กำลังจะลบ
  const classroomToDelete = classrooms?.find(c => c.id === confirmDeleteId)
  const classroomToDeleteLabel = classroomToDelete
    ? `${classroomToDelete.level}/${classroomToDelete.room}`
    : ''

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการห้องเรียน (Classrooms)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มห้องเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ระดับชั้น (เช่น ม.1)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="ม.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้อง (เช่น 1, 2, 3)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูที่ปรึกษา</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors bg-white"
              value={formData.advisor_id}
              onChange={e => setFormData({...formData, advisor_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          
          <div className="col-span-1 md:col-span-3 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">บันทึก</button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ระดับชั้น</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้อง</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ครูที่ปรึกษา</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {classrooms?.map(classroom => (
                <tr key={classroom.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{classroom.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{classroom.room}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.advisor ? `${classroom.advisor.first_name} ${classroom.advisor.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => setConfirmDeleteId(classroom.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {classrooms?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลห้องเรียนในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบ</h3>
                  <p className="text-sm text-slate-500 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                คุณต้องการลบห้องเรียน <span className="font-bold text-slate-900">ห้อง {classroomToDeleteLabel}</span> ออกจากระบบใช่หรือไม่?
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {deleteMutation.isPending ? 'กำลังลบ...' : 'ลบออก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

