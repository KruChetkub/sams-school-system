import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTeachers, createTeacher, deleteTeacher, updateTeacher } from '../services/teacherService'
import { Plus, Trash2, AlertTriangle, Edit2, X } from 'lucide-react'

export default function Teachers() {
  const queryClient = useQueryClient()
  const { data: teachers, isLoading } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    teacher_code: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    department: '',
    password: ''
  })

  const createMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setShowForm(false)
      setFormData({ teacher_code: '', first_name: '', last_name: '', phone: '', email: '', department: '', password: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setConfirmDeleteId(null)
    }
  })

  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    teacher_code: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    department: ''
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setEditingTeacherId(null)
    }
  })

  const handleEditClick = (teacher: any) => {
    setEditFormData({
      teacher_code: teacher.teacher_code,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone: teacher.phone || '',
      email: teacher.email || '',
      department: teacher.department || ''
    })
    setEditingTeacherId(teacher.id)
  }

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTeacherId) return
    const { email, ...updates } = editFormData // Remove email from updates
    updateMutation.mutate({ id: editingTeacherId, data: updates })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  // หาข้อมูลครูที่กำลังจะลบ
  const teacherToDelete = teachers?.find(t => t.id === confirmDeleteId)
  const teacherToDeleteName = teacherToDelete 
    ? `${teacherToDelete.first_name} ${teacherToDelete.last_name}`
    : ''

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการบุคลากร (Teachers)</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-semibold"
        >
          <Plus size={20} /> เพิ่มบุคลากร
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">รหัสครู</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.teacher_code} onChange={e => setFormData({...formData, teacher_code: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อ</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">แผนก/หมวดวิชา</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">อีเมล (ใช้สำหรับล็อกอิน)</label><input type="email" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ตั้งรหัสผ่านชั่วคราว</label><input type="password" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" placeholder="กรุณาตั้งรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-semibold">บันทึกข้อมูล</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {teachers?.map(teacher => (
              <div key={teacher.id} className="p-4 hover:bg-indigo-50/40 transition-colors flex justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-gray-800">{teacher.first_name} {teacher.last_name}</div>
                  <div className="text-sm text-gray-500 flex gap-3">
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">{teacher.teacher_code}</span>
                    <span>{teacher.department || '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(teacher)}
                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(teacher.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="ลบข้อมูล"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {teachers?.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลบุคลากรในระบบ</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัส</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">หมวดวิชา</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers?.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">{teacher.teacher_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{teacher.first_name} {teacher.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => handleEditClick(teacher)}
                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors inline-flex justify-center mr-2"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(teacher.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                        title="ลบข้อมูล"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers?.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลบุคลากรในระบบ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setEditingTeacherId(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">แก้ไขข้อมูลบุคลากร</h3>
              <button onClick={() => setEditingTeacherId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700">รหัสครู</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={editFormData.teacher_code} onChange={e => setEditFormData({...editFormData, teacher_code: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700">ชื่อ</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={editFormData.first_name} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={editFormData.last_name} onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700">แผนก/หมวดวิชา</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={editFormData.department} onChange={e => setEditFormData({...editFormData, department: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-gray-700 flex justify-between"><span>อีเมล</span> <span className="text-xs text-red-500 font-normal">*ไม่สามารถแก้ไขได้</span></label><input type="email" disabled className="mt-1 w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2.5 outline-none cursor-not-allowed" value={editFormData.email} /></div>
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditingTeacherId(null)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={updateMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-semibold">{updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
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
                คุณต้องการลบข้อมูลของ <span className="font-bold text-slate-900">{teacherToDeleteName}</span> ออกจากระบบใช่หรือไม่?
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

