import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, createStudent, deleteStudent } from '../services/studentService'
import { getClassrooms } from '../services/classroomService'
import { Plus, Trash2 } from 'lucide-react'

export default function Students() {
  const queryClient = useQueryClient()
  const { data: students, isLoading } = useQuery({ queryKey: ['students'], queryFn: getStudents })
  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    student_code: '',
    first_name: '',
    last_name: '',
    nickname: '',
    classroom_id: ''
  })

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setShowForm(false)
      setFormData({ student_code: '', first_name: '', last_name: '', nickname: '', classroom_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      student_code: formData.student_code,
      first_name: formData.first_name,
      last_name: formData.last_name,
      nickname: formData.nickname,
      ...(formData.classroom_id ? { classroom_id: formData.classroom_id } : {})
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลนักเรียน (Students)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มนักเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">รหัสนักเรียน</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อเล่น</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อจริง</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">ห้องเรียน (ระดับชั้น/ห้อง)</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"
              value={formData.classroom_id}
              onChange={e => setFormData({...formData, classroom_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {classrooms?.map(c => (
                <option key={c.id} value={c.id}>{c.level}/{c.room}</option>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัส</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students?.map(student => (
                <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{student.student_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.first_name} {student.last_name} {student.nickname && `(${student.nickname})`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.classroom ? `${student.classroom.level}/${student.classroom.room}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการลบข้อมูลนักเรียน?')) deleteMutation.mutate(student.id)}} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {students?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลนักเรียนในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
