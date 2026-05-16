import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, createStudent, updateStudent, deleteStudent, bulkCreateStudents } from '../services/studentService'
import { getClassrooms } from '../services/classroomService'
import { Plus, Trash2, Edit3, Upload, Download, Users } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Students() {
  const queryClient = useQueryClient()
  const { data: students, isLoading } = useQuery({ queryKey: ['students'], queryFn: getStudents })
  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  
  const [showForm, setShowForm] = useState(false)
  const [filterClassroomId, setFilterClassroomId] = useState('')
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    student_code: '',
    prefix: '',
    first_name: '',
    last_name: '',
    nickname: '',
    classroom_id: ''
  })
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const [modalType, setModalType] = useState<'confirm' | 'message'>('message')
  const confirmCallbackRef = React.useRef<() => void>(() => {})
  const cancelCallbackRef = React.useRef<() => void>(() => {})

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setShowForm(false)
      setEditingStudentId(null)
      setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] })
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, student }: { id: string, student: Omit<typeof formData, 'classroom_id'> & { classroom_id?: string } }) => updateStudent(id, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setShowForm(false)
      setEditingStudentId(null)
      setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '' })
    }
  })

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const bulkCreateMutation = useMutation({
    mutationFn: bulkCreateStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setModalTitle('สำเร็จ')
      setModalMessage('นำเข้าข้อมูลนักเรียนเรียบร้อยแล้ว!')
      setModalType('message')
      setShowModal(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setShowForm(false)
    },
    onError: (err: any) => {
      setModalTitle('ข้อผิดพลาด')
      setModalMessage('เกิดข้อผิดพลาด: ' + err.message + '\n(โปรดตรวจสอบว่ารหัสนักเรียนซ้ำกับในระบบหรือไม่)')
      setModalType('message')
      setShowModal(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  })

  const openConfirmModal = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModalTitle(title)
    setModalMessage(message)
    setModalType('confirm')
    confirmCallbackRef.current = onConfirm
    cancelCallbackRef.current = onCancel || (() => {})
    setShowModal(true)
  }

  const openMessageModal = (title: string, message: string) => {
    setModalTitle(title)
    setModalMessage(message)
    setModalType('message')
    setShowModal(true)
  }

  const processUploadedFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const payload = data.map(row => ({
          student_code: String(row['รหัสนักเรียน'] || row['student_code'] || ''),
          prefix: row['คำนำหน้า'] || row['prefix'] || '',
          first_name: row['ชื่อ'] || row['first_name'] || '',
          last_name: row['นามสกุล'] || row['last_name'] || '',
          nickname: row['ชื่อเล่น'] || row['nickname'] || '',
          ...(formData.classroom_id ? { classroom_id: formData.classroom_id } : {})
        })).filter(s => s.student_code && s.first_name)

        if (payload.length === 0) {
          openMessageModal('ไม่พบข้อมูล', 'ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel (ต้องมีหัวคอลัมน์: รหัสนักเรียน, ชื่อ, นามสกุล)')
          return
        }

        openConfirmModal('ยืนยันการนำเข้า', `พบข้อมูล ${payload.length} คน ต้องการนำเข้าสู่ระบบใช่หรือไม่?`, () => {
          bulkCreateMutation.mutate(payload)
        }, () => {
          if (fileInputRef.current) fileInputRef.current.value = ''
        })
      } catch (err) {
        console.error(err)
        openMessageModal('อ่านไฟล์ล้มเหลว', 'อ่านไฟล์ล้มเหลว กรุณาตรวจสอบรูปแบบไฟล์')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!formData.classroom_id) {
      openConfirmModal(
        'ยืนยันการนำเข้า',
        'คุณยังไม่ได้เลือก "ห้องเรียน" ข้อมูลที่นำเข้าจะไม่มีห้องเรียน ยืนยันหรือไม่?',
        () => processUploadedFile(file),
        () => {
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      )
      return
    }

    processUploadedFile(file)
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'รหัสนักเรียน': '65001', 'คำนำหน้า': 'ด.ช.', 'ชื่อ': 'สมชาย', 'นามสกุล': 'ใจดี', 'ชื่อเล่น': 'ชาย' },
      { 'รหัสนักเรียน': '65002', 'คำนำหน้า': 'ด.ญ.', 'ชื่อ': 'สมหญิง', 'นามสกุล': 'รักเรียน', 'ชื่อเล่น': 'หญิง' }
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Students")
    XLSX.writeFile(wb, "student_template.xlsx")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      student_code: formData.student_code,
      prefix: formData.prefix,
      first_name: formData.first_name,
      last_name: formData.last_name,
      nickname: formData.nickname,
      ...(formData.classroom_id ? { classroom_id: formData.classroom_id } : {})
    }

    if (editingStudentId) {
      updateMutation.mutate({ id: editingStudentId, student: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลนักเรียน (Students)</h1>
        <button 
          onClick={() => {
            setShowForm(!showForm)
            if (!showForm) setEditingStudentId(null)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={20} /> เพิ่มนักเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{editingStudentId ? 'แก้ไขนักเรียน' : 'เพิ่มนักเรียนใหม่'}</h2>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">รหัสนักเรียน</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">คำนำหน้า</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="เช่น ด.ช., ด.ญ., คุณ" /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อเล่น</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อจริง</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          <div className="md:col-span-2 border-b pb-4 mb-2">
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
          <div className="md:col-span-2 bg-blue-50 p-5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2 border border-blue-100 shadow-sm">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                นำเข้าข้อมูลนักเรียน (Excel)
              </h3>
              <p className="text-sm text-blue-600 mt-1 leading-relaxed">
                เลือกระดับชั้นและห้องเรียนด้านบนให้เรียบร้อยก่อนทำการอัปโหลดไฟล์ Excel เพื่อเพิ่มรายชื่อนักเรียนทั้งหมดเข้าสู่ระบบในครั้งเดียว
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <button type="button" onClick={downloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-blue-700 border border-blue-200 px-5 py-2.5 rounded-xl hover:bg-blue-100 transition shadow-sm font-medium">
                <Download size={18} /> ไฟล์ต้นแบบ
              </button>
              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 cursor-pointer transition shadow-sm font-medium">
                <Upload size={18} /> อัปโหลดไฟล์ Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={bulkCreateMutation.isPending} />
              </label>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => { setShowForm(false); setEditingStudentId(null); setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '' }) }} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={(editingStudentId ? updateMutation.isPending : createMutation.isPending) || !formData.student_code || !formData.first_name} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">{editingStudentId ? 'อัปเดตข้อมูล' : 'บันทึก 1 คน'}</button>
          </div>
        </form>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 md:p-8 z-10">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{modalTitle}</h3>
            <p className="text-gray-600 whitespace-pre-line mb-6">{modalMessage}</p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              {modalType === 'confirm' && (
                <>
                  <button type="button" onClick={() => { cancelCallbackRef.current(); setShowModal(false) }} className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition">ยกเลิก</button>
                  <button type="button" onClick={() => { confirmCallbackRef.current(); setShowModal(false) }} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">ตกลง</button>
                </>
              )}
              {modalType === 'message' && (
                <button type="button" onClick={() => setShowModal(false)} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">ปิด</button>
              )}
            </div>
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users size={18} /> รายชื่อนักเรียนทั้งหมด
            </h2>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">กรองตามห้องเรียน:</label>
              <select 
                className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]"
                value={filterClassroomId}
                onChange={e => setFilterClassroomId(e.target.value)}
              >
                <option value="">-- แสดงทุกห้องเรียน --</option>
                {classrooms?.map(c => (
                  <option key={c.id} value={c.id}>{c.level}/{c.room}</option>
                ))}
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">รหัส</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">คำนำหน้า</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students?.filter(s => filterClassroomId === '' || s.classroom_id === filterClassroomId).map(student => (
                <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{student.student_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.prefix || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.first_name} {student.last_name} {student.nickname && `(${student.nickname})`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.classroom ? `${student.classroom.level}/${student.classroom.room}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center flex items-center justify-center gap-2">
                    <button 
                      onClick={() => {
                        setShowForm(true)
                        setEditingStudentId(student.id)
                        setFormData({
                          student_code: student.student_code,
                          prefix: student.prefix ?? '',
                          first_name: student.first_name,
                          last_name: student.last_name,
                          nickname: student.nickname,
                          classroom_id: student.classroom_id ?? ''
                        })
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex justify-center"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => openConfirmModal('ยืนยันการลบ', 'ยืนยันการลบข้อมูลนักเรียน?', () => deleteMutation.mutate(student.id))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex justify-center"
                      title="ลบข้อมูล"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {students?.filter(s => filterClassroomId === '' || s.classroom_id === filterClassroomId).length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">ไม่พบข้อมูลนักเรียน (ลองเปลี่ยนตัวกรองห้องเรียน)</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
