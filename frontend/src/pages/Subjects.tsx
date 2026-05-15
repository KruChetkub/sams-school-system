import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSubjects, createSubject, deleteSubject } from '../services/subjectService'
import { getTeachers } from '../services/teacherService'
import { Plus, Trash2 } from 'lucide-react'

export default function Subjects() {
  const queryClient = useQueryClient()
  const { data: subjects, isLoading } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    department: '',
    credit: '',
    teacher_id: ''
  })

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowForm(false)
      setFormData({ subject_code: '', subject_name: '', department: '', credit: '', teacher_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      subject_code: formData.subject_code,
      subject_name: formData.subject_name,
      department: formData.department,
      credit: parseFloat(formData.credit) || 0,
      ...(formData.teacher_id ? { teacher_id: formData.teacher_id } : {})
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการวิชาเรียน (Subjects)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มรายวิชา
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">รหัสวิชา</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.subject_code} onChange={e => setFormData({...formData, subject_code: e.target.value})} placeholder="เช่น ค31101" /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อวิชา</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.subject_name} onChange={e => setFormData({...formData, subject_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">หมวดวิชา</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">หน่วยกิต</label><input type="number" step="0.5" min="0" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} /></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">ครูผู้สอนประจำวิชา</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
              value={formData.teacher_id}
              onChange={e => setFormData({...formData, teacher_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัสวิชา</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อวิชา (หน่วยกิต)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ครูผู้สอน</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects?.map(subject => (
                <tr key={subject.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{subject.subject_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{subject.subject_name} <span className="text-gray-400">({subject.credit} นก.)</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.teacher ? `${subject.teacher.first_name} ${subject.teacher.last_name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการลบข้อมูลวิชา?')) deleteMutation.mutate(subject.id)}} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {subjects?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลวิชาในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
