import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from '../services/classroomService'
import { getTeachers } from '../services/teacherService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { Plus, Trash2, AlertTriangle, Edit } from 'lucide-react'

const classroomCardPalettes = [
  { card: 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300/70', title: 'text-rose-900', meta: 'text-rose-800' },
  { card: 'bg-gradient-to-br from-orange-100 to-amber-200 border-amber-300/70', title: 'text-amber-900', meta: 'text-amber-800' },
  { card: 'bg-gradient-to-br from-lime-100 to-green-200 border-green-300/70', title: 'text-green-900', meta: 'text-green-800' },
  { card: 'bg-gradient-to-br from-cyan-100 to-sky-200 border-sky-300/70', title: 'text-cyan-900', meta: 'text-cyan-800' },
  { card: 'bg-gradient-to-br from-indigo-100 to-blue-200 border-indigo-300/70', title: 'text-indigo-900', meta: 'text-indigo-800' },
  { card: 'bg-gradient-to-br from-violet-100 to-purple-200 border-violet-300/70', title: 'text-violet-900', meta: 'text-violet-800' },
]

const getClassroomPalette = (classroomKey: string) => {
  let hash = 0
  for (let i = 0; i < classroomKey.length; i += 1) {
    hash = (hash * 31 + classroomKey.charCodeAt(i)) >>> 0
  }
  return classroomCardPalettes[hash % classroomCardPalettes.length]
}

export default function Classrooms() {
  const queryClient = useQueryClient()
  const { selectedYear } = useAcademicYearStore()
  
  const { data: classrooms, isLoading } = useQuery({ 
    queryKey: ['classrooms', selectedYear?.id], 
    queryFn: () => getClassrooms(selectedYear?.id) 
  })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const topRef = useRef<HTMLDivElement | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    level: '',
    room: '',
    advisor_id: '',
    advisor2_id: '',
    subject_teacher_id: ''
  })

  const openAddForm = () => {
    setEditId(null)
    setFormData({ level: '', room: '', advisor_id: '', advisor2_id: '', subject_teacher_id: '' })
    setShowForm(true)
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const openEditForm = (classroom: any) => {
    setEditId(classroom.id)
    setFormData({ 
      level: classroom.level, 
      room: classroom.room, 
      advisor_id: classroom.advisor_id || '',
      advisor2_id: classroom.advisor2_id || '',
      subject_teacher_id: classroom.subject_teacher_id || ''
    })
    setShowForm(true)
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const createMutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      setShowForm(false)
      setFormData({ level: '', room: '', advisor_id: '', advisor2_id: '', subject_teacher_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      setConfirmDeleteId(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => updateClassroom(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      setShowForm(false)
      setEditId(null)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      level: formData.level,
      room: formData.room,
      advisor_id: formData.advisor_id || '',
      advisor2_id: formData.advisor2_id || '',
      subject_teacher_id: formData.subject_teacher_id || ''
    }

    if (editId) {
      updateMutation.mutate({ id: editId, payload })
    } else {
      if (selectedYear?.id) {
        payload.academic_year_id = selectedYear.id
      }
      createMutation.mutate(payload)
    }
  }

  // หาชื่อห้องที่กำลังจะลบ
  const classroomToDelete = classrooms?.find(c => c.id === confirmDeleteId)
  const classroomToDeleteLabel = classroomToDelete
    ? `${classroomToDelete.level}/${classroomToDelete.room}`
    : ''

  return (
    <div ref={topRef} className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการห้องเรียน (Classrooms)</h1>
        <button 
          onClick={openAddForm}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มห้องเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ระดับชั้น (เช่น ม.1)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} placeholder="ม.1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ห้อง (เช่น 1, 2, 3)</label>
            <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} placeholder="1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูที่ปรึกษาคนที่ 1</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูที่ปรึกษาคนที่ 2</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors bg-white"
              value={formData.advisor2_id}
              onChange={e => setFormData({...formData, advisor2_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ครูประจำวิชา</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors bg-white"
              value={formData.subject_teacher_id}
              onChange={e => setFormData({...formData, subject_teacher_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {teachers?.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          
          <div className="col-span-1 md:col-span-5 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
              {editId ? 'บันทึกการแก้ไข' : 'เพิ่มห้องเรียน'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classrooms?.map(classroom => {
              const palette = getClassroomPalette(`${classroom.id}-${classroom.level}/${classroom.room}`)
              return (
                <div key={classroom.id} className={`p-5 rounded-2xl border shadow-sm flex justify-between items-start gap-4 ${palette.card}`}>
                  <div className="flex flex-col gap-1">
                    <div className={`font-bold text-xl ${palette.title}`}>{classroom.level}/{classroom.room}</div>
                    <div className={`text-sm mt-1 font-medium ${palette.meta}`}>
                      <div className="mb-0.5"><span className="opacity-80">ที่ปรึกษาคนที่ 1:</span> {classroom.advisor ? `${classroom.advisor.first_name} ${classroom.advisor.last_name}` : '-'}</div>
                      <div className="mb-0.5"><span className="opacity-80">ที่ปรึกษาคนที่ 2:</span> {classroom.advisor2 ? `${classroom.advisor2.first_name} ${classroom.advisor2.last_name}` : '-'}</div>
                      <div><span className="opacity-80">ประจำวิชา:</span> {classroom.subject_teacher ? `${classroom.subject_teacher.first_name} ${classroom.subject_teacher.last_name}` : '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditForm(classroom)}
                      className="p-2.5 text-indigo-600 bg-white/60 hover:bg-white/90 rounded-xl transition-all shadow-sm flex-shrink-0"
                      title="แก้ไขห้องเรียนและครูที่ปรึกษา"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(classroom.id)}
                      className="p-2.5 text-red-600 bg-white/60 hover:bg-white/90 rounded-xl transition-all shadow-sm flex-shrink-0"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
            {classrooms?.length === 0 && (
              <div className="col-span-full px-6 py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">ยังไม่มีข้อมูลห้องเรียนในระบบ</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ระดับชั้น</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้อง</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ครูที่ปรึกษาคนที่ 1</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ครูที่ปรึกษาคนที่ 2</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ครูประจำวิชา</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classroom.advisor2 ? `${classroom.advisor2.first_name} ${classroom.advisor2.last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classroom.subject_teacher ? `${classroom.subject_teacher.first_name} ${classroom.subject_teacher.last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => openEditForm(classroom)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors inline-flex justify-center"
                          title="แก้ไขห้องเรียนและครูที่ปรึกษา"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(classroom.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                          title="ลบข้อมูล"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {classrooms?.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ยังไม่มีข้อมูลห้องเรียนในระบบ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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

