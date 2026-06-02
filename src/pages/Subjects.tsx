import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSubjects, createSubject, updateSubject, deleteSubject, type Subject } from '../services/subjectService'
import { getTeachers } from '../services/teacherService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { Plus, Trash2, AlertTriangle, Pencil } from 'lucide-react'

const subjectCardPalettes = [
  { card: 'bg-gradient-to-br from-rose-100 to-pink-200 border-rose-300/70', title: 'text-rose-900', meta: 'text-rose-800' },
  { card: 'bg-gradient-to-br from-orange-100 to-amber-200 border-amber-300/70', title: 'text-amber-900', meta: 'text-amber-800' },
  { card: 'bg-gradient-to-br from-lime-100 to-green-200 border-green-300/70', title: 'text-green-900', meta: 'text-green-800' },
  { card: 'bg-gradient-to-br from-cyan-100 to-sky-200 border-sky-300/70', title: 'text-cyan-900', meta: 'text-cyan-800' },
  { card: 'bg-gradient-to-br from-indigo-100 to-blue-200 border-indigo-300/70', title: 'text-indigo-900', meta: 'text-indigo-800' },
  { card: 'bg-gradient-to-br from-violet-100 to-purple-200 border-violet-300/70', title: 'text-violet-900', meta: 'text-violet-800' },
]

const getSubjectPalette = (subjectKey: string) => {
  let hash = 0
  for (let i = 0; i < subjectKey.length; i += 1) {
    hash = (hash * 31 + subjectKey.charCodeAt(i)) >>> 0
  }
  return subjectCardPalettes[hash % subjectCardPalettes.length]
}

export default function Subjects() {
  const queryClient = useQueryClient()
  const { years, selectedYear, selectedSemester } = useAcademicYearStore()
  
  const { data: subjects, isLoading } = useQuery({ 
    queryKey: ['subjects', selectedYear?.id, selectedSemester?.id], 
    queryFn: () => getSubjects(selectedYear?.id, selectedSemester?.id) 
  })
  const { data: teachers } = useQuery({ queryKey: ['teachers'], queryFn: getTeachers })
  
  const [showForm, setShowForm] = useState(false)
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    department: '',
    credit: '',
    teacher_id: '',
    academic_year_id: selectedYear?.id || '',
    semester_id: selectedSemester?.id || ''
  })

  const formYear = years.find(y => y.id === formData.academic_year_id) || selectedYear
  const formSemesters = formYear?.semesters || []

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowForm(false)
      setEditingSubjectId(null)
      setErrorMessage('')
      setFormData({ subject_code: '', subject_name: '', department: '', credit: '', teacher_id: '', academic_year_id: selectedYear?.id || '', semester_id: selectedSemester?.id || '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: { subject_code: string, subject_name: string, department: string, credit: number, teacher_id?: string, academic_year_id?: string, semester_id?: string } }) =>
      updateSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setShowForm(false)
      setEditingSubjectId(null)
      setErrorMessage('')
      setFormData({ subject_code: '', subject_name: '', department: '', credit: '', teacher_id: '', academic_year_id: selectedYear?.id || '', semester_id: selectedSemester?.id || '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      setConfirmDeleteId(null)
      setErrorMessage('')
    },
    onError: (error: any) => {
      const isConflict = error?.code === '23503' || error?.status === 409
      setErrorMessage(
        isConflict
          ? 'ลบวิชานี้ไม่ได้ เนื่องจากมีข้อมูลที่อ้างอิงอยู่ (เช่น ตารางสอนหรือข้อมูลเช็คชื่อ) กรุณาลบ/ย้ายข้อมูลที่เกี่ยวข้องก่อน'
          : `ลบวิชาไม่สำเร็จ: ${error?.message || 'เกิดข้อผิดพลาด'}`
      )
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      subject_code: formData.subject_code,
      subject_name: formData.subject_name,
      department: formData.department,
      credit: parseFloat(formData.credit) || 0,
      ...(formData.teacher_id ? { teacher_id: formData.teacher_id } : {}),
      ...(formData.academic_year_id ? { academic_year_id: formData.academic_year_id } : {}),
      ...(formData.semester_id ? { semester_id: formData.semester_id } : {})
    }
    if (editingSubjectId) {
      updateMutation.mutate({ id: editingSubjectId, payload })
      return
    }
    createMutation.mutate(payload)
  }

  const startEdit = (subject: Subject) => {
    setErrorMessage('')
    setEditingSubjectId(subject.id)
    setFormData({
      subject_code: subject.subject_code || '',
      subject_name: subject.subject_name || '',
      department: subject.department || '',
      credit: String(subject.credit ?? ''),
      teacher_id: subject.teacher_id || '',
      academic_year_id: subject.academic_year_id || selectedYear?.id || '',
      semester_id: subject.semester_id || selectedSemester?.id || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingSubjectId(null)
    setFormData({ subject_code: '', subject_name: '', department: '', credit: '', teacher_id: '', academic_year_id: selectedYear?.id || '', semester_id: selectedSemester?.id || '' })
  }

  // หาข้อมูลวิชาที่จะลบ
  const subjectToDelete = subjects?.find(s => s.id === confirmDeleteId)
  const subjectToDeleteLabel = subjectToDelete 
    ? `${subjectToDelete.subject_code} ${subjectToDelete.subject_name}`
    : ''

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการวิชาเรียน (Subjects)</h1>
        <button 
          onClick={() => {
            setErrorMessage('')
            if (!showForm) {
              setEditingSubjectId(null)
              setFormData({ subject_code: '', subject_name: '', department: '', credit: '', teacher_id: '', academic_year_id: selectedYear?.id || '', semester_id: selectedSemester?.id || '' })
            }
            setShowForm(!showForm)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-semibold"
        >
          <Plus size={20} /> เพิ่มรายวิชา
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700">รหัสวิชา</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.subject_code} onChange={e => setFormData({...formData, subject_code: e.target.value})} placeholder="เช่น ค31101" /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อวิชา</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.subject_name} onChange={e => setFormData({...formData, subject_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">หมวดวิชา</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">หน่วยกิต</label><input type="number" step="0.5" min="0" required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ปีการศึกษา</label>
            <select
              required
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white"
              value={formData.academic_year_id}
              onChange={e => {
                const year = years.find(y => y.id === e.target.value)
                const defaultSemester = year?.semesters?.find(s => s.is_active) || year?.semesters?.[0] || null
                setFormData({
                  ...formData,
                  academic_year_id: e.target.value,
                  semester_id: defaultSemester?.id || ''
                })
              }}
            >
              <option value="">-- เลือกปีการศึกษา --</option>
              {years.map(year => (
                <option key={year.id} value={year.id}>
                  {year.label || `ปีการศึกษา ${year.year}`}{year.is_active ? ' (ปัจจุบัน)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ภาคเรียน</label>
            <select
              required
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white disabled:bg-gray-100"
              value={formData.semester_id}
              onChange={e => setFormData({...formData, semester_id: e.target.value})}
              disabled={!formData.academic_year_id}
            >
              <option value="">-- เลือกภาคเรียน --</option>
              {formSemesters.map(semester => (
                <option key={semester.id} value={semester.id}>
                  {semester.label || `ภาคเรียนที่ ${semester.semester_number}`}{semester.is_active ? ' (ปัจจุบัน)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">ครูผู้สอนประจำวิชา</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white"
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
            <button type="button" onClick={resetForm} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-semibold">{editingSubjectId ? 'บันทึกการแก้ไข' : 'บันทึกวิชา'}</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects?.map(subject => {
              const palette = getSubjectPalette(`${subject.id}-${subject.subject_code}`)
              return (
                <div key={subject.id} className={`p-5 rounded-2xl border shadow-sm flex justify-between items-start gap-4 ${palette.card}`}>
                  <div className="flex flex-col gap-1">
                    <div className={`font-bold text-lg ${palette.title}`}>{subject.subject_name}</div>
                    <div className={`text-sm font-medium font-mono ${palette.meta}`}>{subject.subject_code} <span className="opacity-70 font-sans ml-1">({subject.credit} นก.)</span></div>
                    <div className={`text-sm mt-1 font-medium ${palette.meta}`}>
                      <span className="opacity-80">ผู้สอน:</span> {subject.teacher ? `${subject.teacher.first_name} ${subject.teacher.last_name}` : '-'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startEdit(subject)}
                      className="p-2.5 text-amber-600 bg-white/60 hover:bg-white/90 rounded-xl transition-all shadow-sm flex-shrink-0"
                      title="แก้ไขข้อมูล"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(subject.id)}
                      className="p-2.5 text-red-600 bg-white/60 hover:bg-white/90 rounded-xl transition-all shadow-sm flex-shrink-0"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
            {subjects?.length === 0 && (
              <div className="col-span-full px-6 py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">ยังไม่มีข้อมูลวิชาในระบบ</div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
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
                  <tr key={subject.id} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">{subject.subject_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{subject.subject_name} <span className="text-slate-400 font-normal">({subject.credit} นก.)</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.teacher ? `${subject.teacher.first_name} ${subject.teacher.last_name}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => startEdit(subject)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-flex justify-center mr-1"
                        title="แก้ไขข้อมูล"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(subject.id)}
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
        </>
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
                  <h3 className="text-lg font-bold text-slate-800">ยืนยันการลบวิชา</h3>
                  <p className="text-sm text-slate-500 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                คุณต้องการลบวิชา <span className="font-bold text-slate-900">{subjectToDeleteLabel}</span> ออกจากระบบใช่หรือไม่?
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
