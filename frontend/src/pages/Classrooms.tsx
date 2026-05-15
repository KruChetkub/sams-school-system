import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassrooms, createClassroom, deleteClassroom } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
import { Plus, Trash2 } from 'lucide-react'

export default function Classrooms() {
  const queryClient = useQueryClient()
  const { data: classrooms, isLoading } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classrooms'] })
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

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการห้องเรียน (Classrooms)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มห้องเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ระดับชั้น (เช่น ม.1)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="ม.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้อง (เช่น 1, 2, 3)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูที่ปรึกษา</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
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
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">บันทึก</button>
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
                <tr key={classroom.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{classroom.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{classroom.room}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {classroom.advisor ? `${classroom.advisor.first_name} ${classroom.advisor.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการลบข้อมูลห้องเรียน?')) deleteMutation.mutate(classroom.id)}} 
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
    </div>
  )
}
