import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getParents, createParent, deleteParent, assignParentToStudent } from '../services/parentService'
import { getStudents } from '../services/studentService'
import { Plus, Trash2, Users, Link as LinkIcon } from 'lucide-react'

export default function Parents() {
  const queryClient = useQueryClient()
  const { data: parents, isLoading } = useQuery({ queryKey: ['parents'], queryFn: getParents })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: getStudents })
  
  const [showForm, setShowForm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    line_user_id: '',
    telegram_user_id: ''
  })
  
  const [assignData, setAssignData] = useState({
    student_id: '',
    parent_id: ''
  })

  const createMutation = useMutation({
    mutationFn: createParent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      setShowForm(false)
      setFormData({ first_name: '', last_name: '', phone: '', email: '', line_user_id: '', telegram_user_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteParent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parents'] })
  })

  const assignMutation = useMutation({
    mutationFn: () => assignParentToStudent(assignData.student_id, assignData.parent_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      alert('ผูกผู้ปกครองกับนักเรียนสำเร็จ')
      setShowAssignForm(false)
      setAssignData({ student_id: '', parent_id: '' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    assignMutation.mutate()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลผู้ปกครอง (Parents)</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => { setShowAssignForm(!showAssignForm); setShowForm(false) }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
          >
            <LinkIcon size={20} /> ผูกผู้ปกครองกับนักเรียน
          </button>
          <button 
            onClick={() => { setShowForm(!showForm); setShowAssignForm(false) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={20} /> เพิ่มผู้ปกครอง
          </button>
        </div>
      </div>

      {showAssignForm && (
        <form onSubmit={handleAssignSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">เลือกนักเรียน</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white" value={assignData.student_id} onChange={e => setAssignData({...assignData, student_id: e.target.value})}>
              <option value="">-- เลือกนักเรียน --</option>
              {students?.map(s => <option key={s.id} value={s.id}>{s.student_code} {s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">เลือกผู้ปกครอง</label>
            <select required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white" value={assignData.parent_id} onChange={e => setAssignData({...assignData, parent_id: e.target.value})}>
              <option value="">-- เลือกผู้ปกครอง --</option>
              {parents?.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowAssignForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={assignMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">บันทึกการผูกข้อมูล</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">ชื่อจริง</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">อีเมล</label><input type="email" className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <label className="block text-sm font-bold text-green-800">LINE User ID</label>
            <input className="mt-1 w-full border border-green-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-green-500 transition-colors" placeholder="เว้นว่างได้ถ้าไม่ใช้" value={formData.line_user_id} onChange={e => setFormData({...formData, line_user_id: e.target.value})} />
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="block text-sm font-bold text-blue-800">Telegram Chat ID</label>
            <input className="mt-1 w-full border border-blue-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="เว้นว่างได้ถ้าไม่ใช้" value={formData.telegram_user_id} onChange={e => setFormData({...formData, telegram_user_id: e.target.value})} />
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">บันทึกข้อมูล</button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ติดต่อ</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ช่องทางแจ้งเตือน</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parents?.map(parent => (
                <tr key={parent.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{parent.first_name} {parent.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{parent.phone || '-'}</div>
                    <div className="text-xs">{parent.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {parent.line_user_id ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold">LINE</span>
                      ) : null}
                      {parent.telegram_user_id ? (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-bold">Telegram</span>
                      ) : null}
                      {!parent.line_user_id && !parent.telegram_user_id && (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการลบข้อมูลผู้ปกครอง?')) deleteMutation.mutate(parent.id)}} 
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {parents?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลผู้ปกครองในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
