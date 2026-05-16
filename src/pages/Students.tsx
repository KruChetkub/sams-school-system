import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, createStudent, updateStudent, deleteStudent, bulkCreateStudents } from '../services/studentService'
import { getClassrooms } from '../services/classroomService'
import { Plus, Trash2, Edit3, Upload, Download, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react'
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setShowModal(false)
    }
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
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-semibold"
        >
          <Plus size={20} /> เพิ่มนักเรียน
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{editingStudentId ? 'แก้ไขข้อมูลนักเรียน' : 'เพิ่มนักเรียนใหม่'}</h2>
            <p className="text-sm text-gray-500 mb-2">กรอกข้อมูลพื้นฐานของนักเรียนให้ครบถ้วน</p>
          </div>
          <div><label className="block text-sm font-medium text-gray-700">รหัสนักเรียน</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">คำนำหน้า</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="เช่น ด.ช., ด.ญ., คุณ" /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อเล่น</label><input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">ชื่อจริง</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium text-gray-700">นามสกุล</label><input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
          <div className="md:col-span-2 border-b pb-4 mb-2">
            <label className="block text-sm font-medium text-gray-700">ห้องเรียน (ระดับชั้น/ห้อง)</label>
            <select 
              className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white"
              value={formData.classroom_id}
              onChange={e => setFormData({...formData, classroom_id: e.target.value})}
            >
              <option value="">-- ไม่ระบุ --</option>
              {classrooms?.map(c => (
                <option key={c.id} value={c.id}>{c.level}/{c.room}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 bg-indigo-50/50 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-2 border border-indigo-100 shadow-sm">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-indigo-800 text-lg flex items-center gap-2">
                นำเข้าข้อมูลนักเรียน (Excel)
              </h3>
              <p className="text-sm text-indigo-600/80 mt-1 leading-relaxed">
                เลือกระดับชั้นและห้องเรียนด้านบนให้เรียบร้อยก่อนทำการอัปโหลดไฟล์ Excel เพื่อเพิ่มรายชื่อนักเรียนทั้งหมดเข้าสู่ระบบในครั้งเดียว
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <button type="button" onClick={downloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition shadow-sm font-semibold">
                <Download size={18} /> ไฟล์ต้นแบบ
              </button>
              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 cursor-pointer transition shadow-sm font-semibold">
                <Upload size={18} /> อัปโหลดไฟล์ Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={bulkCreateMutation.isPending} />
              </label>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => { setShowForm(false); setEditingStudentId(null); setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '' }) }} className="px-5 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={(editingStudentId ? updateMutation.isPending : createMutation.isPending) || !formData.student_code || !formData.first_name} className="px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm font-semibold">{editingStudentId ? 'อัปเดตข้อมูล' : 'บันทึก 1 คน'}</button>
          </div>
        </form>
      )}

      {/* Premium System Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  modalType === 'confirm' ? 'bg-amber-100' : 
                  modalTitle.includes('สำเร็จ') ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {modalType === 'confirm' ? <AlertTriangle size={24} className="text-amber-500" /> : 
                   modalTitle.includes('สำเร็จ') ? <CheckCircle size={24} className="text-emerald-500" /> : 
                   <AlertTriangle size={24} className="text-red-500" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{modalTitle}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{modalType === 'confirm' ? 'โปรดยืนยันการดำเนินการ' : 'แจ้งเตือนระบบ'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 whitespace-pre-line">
                {modalMessage}
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              {modalType === 'confirm' ? (
                <>
                  <button
                    onClick={() => { cancelCallbackRef.current(); setShowModal(false) }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => { confirmCallbackRef.current(); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    ตกลง
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  รับทราบ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-gray-50/50 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Users size={20} className="text-indigo-500" /> รายชื่อนักเรียนทั้งหมด
            </h2>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">กรองตามห้องเรียน:</label>
              <select 
                className="border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[200px] shadow-sm font-medium"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">รหัส</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">คำนำหน้า</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students?.filter(s => filterClassroomId === '' || s.classroom_id === filterClassroomId).map(student => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">{student.student_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.prefix || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">{student.first_name} {student.last_name} {student.nickname && <span className="text-gray-400 font-normal">({student.nickname})</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {student.classroom ? <span className="bg-slate-100 px-2 py-1 rounded-lg">{student.classroom.level}/{student.classroom.room}</span> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center flex items-center justify-center gap-1">
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
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-flex justify-center"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => openConfirmModal('ยืนยันการลบ', `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ ${student.first_name} ${student.last_name}?`, () => deleteMutation.mutate(student.id))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors inline-flex justify-center"
                        title="ลบข้อมูล"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students?.filter(s => filterClassroomId === '' || s.classroom_id === filterClassroomId).length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-gray-400 bg-gray-50/30 font-medium">ไม่พบข้อมูลนักเรียน (ลองเปลี่ยนตัวกรองห้องเรียน)</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

