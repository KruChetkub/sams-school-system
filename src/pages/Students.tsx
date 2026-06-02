import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStudents, createStudent, updateStudent, deleteStudent, bulkCreateStudents, findStudentByCode, findStudentsByCodes, promoteClassroomStudents } from '../services/studentService'
import { getClassrooms } from '../services/classroomService'
import { getSubjects } from '../services/subjectService'
import { addMembership, getAllMemberships, getMembershipsByGroup, removeMembership } from '../services/studentGroupService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { Plus, Trash2, Edit3, Upload, Download, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Students() {
  const queryClient = useQueryClient()
  const { selectedYear, selectedSemester } = useAcademicYearStore()
  
  const { data: students, isLoading } = useQuery({ 
    queryKey: ['students', selectedYear?.id], 
    queryFn: () => getStudents(selectedYear?.id) 
  })
  const { data: classrooms } = useQuery({ 
    queryKey: ['classrooms', selectedYear?.id], 
    queryFn: () => getClassrooms(selectedYear?.id) 
  })
  const { data: subjects } = useQuery({ 
    queryKey: ['subjects', selectedYear?.id, selectedSemester?.id], 
    queryFn: () => getSubjects(selectedYear?.id, selectedSemester?.id) 
  })
  const { data: allMemberships = [] } = useQuery({ queryKey: ['student_group_memberships_all'], queryFn: getAllMemberships })
  
  const [showForm, setShowForm] = useState(false)
  const [filterClassroomId, setFilterClassroomId] = useState('')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [filterSearchQuery, setFilterSearchQuery] = useState('')
  const [bottomSearchKeyword, setBottomSearchKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [moveStudentId, setMoveStudentId] = useState('')
  const [promoteSourceClassroomId, setPromoteSourceClassroomId] = useState('')
  const [promoteTargetClassroomId, setPromoteTargetClassroomId] = useState('')
  const [activeTab, setActiveTab] = useState<'list' | 'single' | 'bulk' | 'subject'>('list')
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filterOptions = React.useMemo(() => {
    return [
      { value: '', label: '-- กรุณาเลือกห้องเรียน / กิจกรรม --', category: 'ทั่วไป' },
      ...(classrooms || []).filter(c => {
        const lvl = c.level || ''
        return !lvl.includes('กิจกรรม') && !lvl.includes('ประชุม') && !lvl.includes('รวม')
      }).map(c => ({
        value: `CLASSROOM:${c.id}`,
        label: `${c.level}/${c.room}`,
        category: 'ระดับชั้น/ห้องเรียนหลัก'
      })),
      ...(subjects || []).map(sub => ({
        value: `SUBJECT:${sub.id}`,
        label: `${sub.subject_code} ${sub.subject_name}`,
        category: 'กิจกรรมชุมนุม / เรียนรวม'
      }))
    ]
  }, [classrooms, subjects])

  const filteredFilterOptions = React.useMemo(() => {
    if (!filterSearchQuery.trim()) return filterOptions
    const q = filterSearchQuery.toLowerCase().trim()
    return filterOptions.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      opt.category.toLowerCase().includes(q)
    )
  }, [filterOptions, filterSearchQuery])
  const [moveClassroomId, setMoveClassroomId] = useState('')
  const groupType = 'SUBJECT' as const
  const [groupId, setGroupId] = useState('')
  const [groupClassroomFilterId, setGroupClassroomFilterId] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const { data: groupMemberIds = [] } = useQuery({
    queryKey: ['student_group_memberships', 'SUBJECT', groupId],
    queryFn: () => getMembershipsByGroup(groupType, groupId),
    enabled: !!groupId
  })
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    gender: '',
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
      setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '', gender: '' })
    },
    onError: async (err: any) => {
      const isDuplicate = err?.code === '23505' || String(err?.message || '').includes('students_student_code_key')
      if (!isDuplicate) {
        openMessageModal('ข้อผิดพลาด', err?.message || 'ไม่สามารถบันทึกข้อมูลนักเรียนได้')
        return
      }
      const duplicate = await findStudentByCode(formData.student_code)
      if (duplicate) {
        const fullName = `${duplicate.prefix ? `${duplicate.prefix} ` : ''}${duplicate.first_name} ${duplicate.last_name}`
        openMessageModal('รหัสนักเรียนซ้ำ', `รหัส ${formData.student_code} ซ้ำกับนักเรียน:\n${fullName}\nโปรดใช้รหัสใหม่ที่ไม่ซ้ำ`)
        return
      }
      openMessageModal('รหัสนักเรียนซ้ำ', `รหัส ${formData.student_code} ซ้ำกับข้อมูลในระบบ โปรดตรวจสอบอีกครั้ง`)
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
      setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '', gender: '' })
    },
    onError: async (err: any) => {
      const isDuplicate = err?.code === '23505' || String(err?.message || '').includes('students_student_code_key')
      if (!isDuplicate) {
        openMessageModal('ข้อผิดพลาด', err?.message || 'ไม่สามารถอัปเดตข้อมูลนักเรียนได้')
        return
      }
      const duplicate = await findStudentByCode(formData.student_code)
      if (duplicate && duplicate.id !== editingStudentId) {
        const fullName = `${duplicate.prefix ? `${duplicate.prefix} ` : ''}${duplicate.first_name} ${duplicate.last_name}`
        openMessageModal('รหัสนักเรียนซ้ำ', `รหัส ${formData.student_code} ซ้ำกับนักเรียน:\n${fullName}\nโปรดใช้รหัสใหม่ที่ไม่ซ้ำ`)
        return
      }
      openMessageModal('รหัสนักเรียนซ้ำ', `รหัส ${formData.student_code} ซ้ำกับข้อมูลในระบบ โปรดตรวจสอบอีกครั้ง`)
    }
  })

  const moveClassroomMutation = useMutation({
    mutationFn: ({ id, classroomId }: { id: string; classroomId: string }) => {
      const target = students?.find((s) => s.id === id)
      if (!target) throw new Error('ไม่พบนักเรียนที่ต้องการย้ายห้อง')
      return updateStudent(id, {
        student_code: target.student_code,
        prefix: target.prefix || '',
        first_name: target.first_name,
        last_name: target.last_name,
        nickname: target.nickname || '',
        classroom_id: classroomId || undefined
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setMoveStudentId('')
      setMoveClassroomId('')
      setSearchKeyword('')
      openMessageModal('สำเร็จ', 'ย้ายนักเรียนเข้าห้องใหม่เรียบร้อยแล้ว')
    },
    onError: (err: any) => {
      openMessageModal('ข้อผิดพลาด', err?.message || 'ไม่สามารถย้ายนักเรียนได้')
    }
  })
  const bulkPromoteMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      return promoteClassroomStudents(sourceId, targetId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setPromoteSourceClassroomId('')
      setPromoteTargetClassroomId('')
      setShowModal(false)
      openMessageModal('สำเร็จ', 'เลื่อนชั้นเรียนและย้ายนักเรียนยกห้องเรียบร้อยแล้ว!')
    },
    onError: (err: any) => {
      openMessageModal('ข้อผิดพลาด', err?.message || 'ไม่สามารถย้ายนักเรียนยกห้องได้')
    }
  })
  const addMemberMutation = useMutation({
    mutationFn: ({ studentId }: { studentId: string }) => addMembership(studentId, groupType, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_group_memberships', 'SUBJECT', groupId] })
      queryClient.invalidateQueries({ queryKey: ['student_group_memberships_all'] })
    },
    onError: (err: any) => openMessageModal('ข้อผิดพลาด', err?.message || 'เพิ่มสมาชิกไม่สำเร็จ')
  })
  const removeMemberMutation = useMutation({
    mutationFn: ({ studentId }: { studentId: string }) => removeMembership(studentId, groupType, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_group_memberships', 'SUBJECT', groupId] })
      queryClient.invalidateQueries({ queryKey: ['student_group_memberships_all'] })
    },
    onError: (err: any) => openMessageModal('ข้อผิดพลาด', err?.message || 'ลบสมาชิกไม่สำเร็จ')
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
      const handleDuplicate = async () => {
        const isDuplicate = err?.code === '23505' || String(err?.message || '').includes('students_student_code_key')
        if (!isDuplicate) {
          setModalTitle('ข้อผิดพลาด')
          setModalMessage('เกิดข้อผิดพลาด: ' + err.message)
          setModalType('message')
          setShowModal(true)
          return
        }
        const duplicateCodes = new Set<string>()
        const rows = (students || [])
        rows.forEach((s) => {
          const inCurrentPage = rows.filter((x) => x.student_code === s.student_code).length > 1
          if (inCurrentPage) duplicateCodes.add(s.student_code)
        })
        const firstCode = duplicateCodes.values().next().value
        if (firstCode) {
          const duplicate = await findStudentByCode(firstCode)
          if (duplicate) {
            const fullName = `${duplicate.prefix ? `${duplicate.prefix} ` : ''}${duplicate.first_name} ${duplicate.last_name}`
            setModalTitle('รหัสนักเรียนซ้ำ')
            setModalMessage(`พบรหัสซ้ำในไฟล์/ระบบ: ${firstCode}\nซ้ำกับนักเรียน: ${fullName}\nโปรดแก้รหัสในไฟล์แล้วนำเข้าใหม่`)
            setModalType('message')
            setShowModal(true)
            return
          }
        }
        setModalTitle('รหัสนักเรียนซ้ำ')
        setModalMessage('พบรหัสนักเรียนซ้ำระหว่างการนำเข้า โปรดตรวจสอบรหัสในไฟล์ Excel ไม่ให้ซ้ำกัน และไม่ซ้ำกับในระบบ')
        setModalType('message')
        setShowModal(true)
      }
      handleDuplicate()
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
    reader.onload = async (evt) => {
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

        const localCodeCount = new Map<string, number>()
        payload.forEach((p) => {
          const code = String(p.student_code).trim()
          localCodeCount.set(code, (localCodeCount.get(code) || 0) + 1)
        })
        const duplicatedInFile = Array.from(localCodeCount.entries())
          .filter(([, count]) => count > 1)
          .map(([code]) => code)
        if (duplicatedInFile.length > 0) {
          openMessageModal(
            'รหัสนักเรียนซ้ำในไฟล์',
            `พบรหัสซ้ำในไฟล์ Excel:\n${duplicatedInFile.slice(0, 10).join(', ')}${duplicatedInFile.length > 10 ? '\n...และรายการอื่น' : ''}\nโปรดแก้ไฟล์ก่อนนำเข้า`
          )
          return
        }

        const existing = await findStudentsByCodes(payload.map((p) => String(p.student_code).trim()))
        if (existing.length > 0) {
          const preview = existing
            .slice(0, 8)
            .map((s) => `${s.student_code} - ${s.prefix ? `${s.prefix} ` : ''}${s.first_name} ${s.last_name}`)
            .join('\n')
          openMessageModal(
            'รหัสนักเรียนซ้ำในระบบ',
            `ไม่สามารถนำเข้าได้ เพราะรหัสต่อไปนี้มีอยู่แล้ว:\n${preview}${existing.length > 8 ? '\n...และรายการอื่น' : ''}\nโปรดแก้รหัสในไฟล์แล้วลองใหม่`
          )
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
      gender: formData.gender || null,
      ...(formData.classroom_id ? { classroom_id: formData.classroom_id } : {})
    }

    if (editingStudentId) {
      updateMutation.mutate({ id: editingStudentId, student: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleStartEdit = (student: any) => {
    setShowForm(true)
    setEditingStudentId(student.id)
    setFormData({
      student_code: student.student_code,
      prefix: student.prefix ?? '',
      first_name: student.first_name,
      last_name: student.last_name,
      nickname: student.nickname ?? '',
      classroom_id: student.classroom_id ?? '',
      gender: student.gender ?? ''
    })
  }

  const searchableStudents = (students || []).filter((s) => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return true
    const fullName = `${s.prefix ? `${s.prefix} ` : ''}${s.first_name} ${s.last_name}`.toLowerCase()
    return (
      s.student_code.toLowerCase().includes(keyword) ||
      fullName.includes(keyword) ||
      (s.nickname || '').toLowerCase().includes(keyword)
    )
  })
  const selectedMoveStudent = (students || []).find((s) => s.id === moveStudentId)
  const groupCandidates = (students || []).filter((s) => {
    if (groupClassroomFilterId && s.classroom_id !== groupClassroomFilterId) return false
    const keyword = groupSearch.trim().toLowerCase()
    if (!keyword) return true
    const fullName = `${s.prefix ? `${s.prefix} ` : ''}${s.first_name} ${s.last_name}`.toLowerCase()
    return s.student_code.toLowerCase().includes(keyword) || fullName.includes(keyword) || (s.nickname || '').toLowerCase().includes(keyword)
  })
  const currentMembers = groupCandidates.filter((s) => groupMemberIds.includes(s.id))
  const availableMembers = groupCandidates.filter((s) => !groupMemberIds.includes(s.id))

  return (
    <div id="students-page-top" className="p-8 pb-28 md:pb-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลนักเรียน (Students)</h1>
        <button 
          onClick={() => {
            setActiveTab('list')
            setShowForm(!showForm)
            if (!showForm) setEditingStudentId(null)
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-semibold"
        >
          <Plus size={20} /> เพิ่มนักเรียน
        </button>
      </div>

      {/* Mobile Persistent Bottom Tab Bar (LINE App Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-40 flex justify-around items-center py-2 px-1 pb-safe">
        {/* Tab 1: All Students */}
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'list' ? 'text-blue-600 font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${activeTab === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
            <Users size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">รายชื่อนักเรียน</span>
        </button>

        {/* Tab 2: Single Move */}
        <button
          type="button"
          onClick={() => setActiveTab('single')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'single' ? 'text-blue-600 font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${activeTab === 'single' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
            <Edit3 size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">ย้ายรายคน</span>
        </button>

        {/* Tab 3: Bulk Move */}
        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'bulk' ? 'text-blue-600 font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${activeTab === 'bulk' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
            <Upload size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">เลื่อนชั้นเรียน</span>
        </button>

        {/* Tab 4: Electives */}
        <button
          type="button"
          onClick={() => setActiveTab('subject')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'subject' ? 'text-blue-600 font-bold scale-105' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${activeTab === 'subject' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
            <Plus size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">วิชาเรียนรวม</span>
        </button>
      </div>

      {/* Desktop/Tablet Mode: Premium Horizontal Tab Selector */}
      <div className="hidden md:flex border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap gap-1">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 outline-none ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <Users size={18} /> รายชื่อนักเรียนทั้งหมด
        </button>
        <button
          onClick={() => setActiveTab('single')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 outline-none ${
            activeTab === 'single'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <Edit3 size={18} /> ย้ายนักเรียนเข้าห้องใหม่
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 outline-none ${
            activeTab === 'bulk'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <Upload size={18} /> เลื่อนชั้นเรียน / ย้ายยกห้อง (Bulk Move)
        </button>
        <button
          onClick={() => setActiveTab('subject')}
          className={`px-5 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 outline-none ${
            activeTab === 'subject'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-gray-300'
          }`}
        >
          <Plus size={18} /> วิชาเรียนรวม (ไม่ย้ายห้องหลัก)
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300" 
            onClick={() => { setShowForm(false); setEditingStudentId(null); setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '', gender: '' }) }}
          ></div>
          
          {/* Modal Content container */}
          <form 
            onSubmit={handleSubmit} 
            className="relative w-full max-w-lg bg-white p-6 rounded-3xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh] grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-200 z-10"
          >
            <div className="md:col-span-2 flex justify-between items-start border-b pb-3 mb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{editingStudentId ? '📝 แก้ไขข้อมูลนักเรียน' : '👤 เพิ่มนักเรียนใหม่'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">กรอกข้อมูลพื้นฐานของนักเรียนให้ถูกต้องครบถ้วน</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingStudentId(null); setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '', gender: '' }) }}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center w-8 h-8"
              >
                ✕
              </button>
            </div>
            
            {/* Form Fields */}
            <div>
              <label className="block text-sm font-semibold text-gray-700">รหัสนักเรียน</label>
              <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-medium" value={formData.student_code} onChange={e => setFormData({...formData, student_code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">คำนำหน้า</label>
              <input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-medium" value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value})} placeholder="เช่น ด.ช., ด.ญ., นาย, นางสาว" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">ชื่อจริง</label>
              <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-semibold text-gray-800" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">นามสกุล</label>
              <input required className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-semibold text-gray-800" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">ชื่อเล่น</label>
              <input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm font-medium" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="ถ้าไม่มีให้เว้นว่าง" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">เพศ</label>
              <select 
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white text-sm font-semibold text-gray-700"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">-- ไม่ระบุ --</option>
                <option value="MALE">ชาย</option>
                <option value="FEMALE">หญิง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">ห้องเรียน (ระดับชั้น/ห้อง)</label>
              <select 
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white text-sm font-semibold text-gray-700"
                value={formData.classroom_id}
                onChange={e => setFormData({...formData, classroom_id: e.target.value})}
              >
                <option value="">-- ไม่ระบุ --</option>
                {classrooms?.map(c => (
                  <option key={c.id} value={c.id}>{c.level}/{c.room}</option>
                ))}
              </select>
            </div>

            {/* Excel Upload Area (Only show when creating a new student, not when editing) */}
            {!editingStudentId && (
              <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-100 mt-2">
                <div className="flex-1">
                  <h3 className="font-bold text-indigo-800 text-sm flex items-center gap-1.5">
                    นำเข้าข้อมูลนักเรียน (Excel)
                  </h3>
                  <p className="text-[11px] text-indigo-600/80 leading-relaxed mt-0.5">
                    นำเข้ารายชื่อหลายคนพร้อมกันผ่าน Excel
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={downloadTemplate} className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-100 transition text-xs font-semibold">
                    <Download size={14} /> ไฟล์ต้นแบบ
                  </button>
                  <label className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer transition text-xs font-semibold">
                    <Upload size={14} /> นำเข้า Excel
                    <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} disabled={bulkCreateMutation.isPending} />
                  </label>
                </div>
              </div>
            )}
            
            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-3 border-t">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingStudentId(null); setFormData({ student_code: '', prefix: '', first_name: '', last_name: '', nickname: '', classroom_id: '', gender: '' }) }} 
                className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-slate-50 transition font-semibold text-sm"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={(editingStudentId ? updateMutation.isPending : createMutation.isPending) || !formData.student_code || !formData.first_name} 
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-bold text-sm"
              >
                {editingStudentId ? (updateMutation.isPending ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข') : (createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูล')}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'single' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-1">ย้ายนักเรียนเข้าห้องใหม่</h2>
          <p className="text-sm text-gray-500 mb-4">ค้นหานักเรียนเดิมแล้วเปลี่ยนห้องเรียนได้ทันที โดยไม่ต้องเพิ่มข้อมูลซ้ำ</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">ค้นหานักเรียน (รหัส/ชื่อ/ชื่อเล่น)</label>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="เช่น 65001, สมชาย, ชาย"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">เลือกนักเรียน</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white"
                value={moveStudentId}
                onChange={(e) => setMoveStudentId(e.target.value)}
              >
                <option value="">-- เลือกนักเรียน --</option>
                {searchableStudents.slice(0, 200).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_code} - {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">ห้องปัจจุบัน</label>
              <div className="mt-1 border border-gray-200 bg-gray-50 rounded-lg p-2.5 text-sm text-gray-700">
                {selectedMoveStudent?.classroom ? `${selectedMoveStudent.classroom.level}/${selectedMoveStudent.classroom.room}` : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ห้องใหม่</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white"
                value={moveClassroomId}
                onChange={(e) => setMoveClassroomId(e.target.value)}
              >
                <option value="">-- เลือกห้องใหม่ --</option>
                {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!moveStudentId || !moveClassroomId || moveClassroomMutation.isPending}
              onClick={() => {
                if (!moveStudentId || !moveClassroomId) return
                const target = students?.find((s) => s.id === moveStudentId)
                if (target?.classroom_id === moveClassroomId) {
                  openMessageModal('ข้อมูลเดิม', 'นักเรียนอยู่ห้องนี้อยู่แล้ว')
                  return
                }
                moveClassroomMutation.mutate({ id: moveStudentId, classroomId: moveClassroomId })
              }}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-semibold"
            >
              {moveClassroomMutation.isPending ? 'กำลังย้ายห้อง...' : 'ย้ายนักเรียนเข้าห้องใหม่'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-1">เลื่อนชั้นเรียน / ย้ายนักเรียนยกห้อง (Bulk Move)</h2>
          <p className="text-sm text-gray-500 mb-4">ย้ายนักเรียนทั้งหมดจากห้องเรียนต้นทางไปยังห้องเรียนปลายทางพร้อมกันในครั้งเดียว</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ห้องเรียนต้นทาง (ที่จะย้ายออก)</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white font-medium text-gray-700"
                value={promoteSourceClassroomId}
                onChange={(e) => setPromoteSourceClassroomId(e.target.value)}
              >
                <option value="">-- เลือกห้องเรียนต้นทาง --</option>
                {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ห้องเรียนปลายทาง (ที่จะย้ายเข้า)</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white font-medium text-gray-700"
                value={promoteTargetClassroomId}
                onChange={(e) => setPromoteTargetClassroomId(e.target.value)}
              >
                <option value="">-- เลือกห้องเรียนปลายทาง --</option>
                {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
                <option value="none">-- ปลดออกจากห้องเรียนหลัก (ไม่มีห้องเรียน) --</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!promoteSourceClassroomId || !promoteTargetClassroomId || bulkPromoteMutation.isPending}
              onClick={() => {
                if (!promoteSourceClassroomId || !promoteTargetClassroomId) return
                if (promoteSourceClassroomId === promoteTargetClassroomId) {
                  openMessageModal('ข้อมูลขัดแย้ง', 'ห้องเรียนต้นทางและปลายทางต้องไม่เป็นห้องเดียวกัน')
                  return
                }
                const sourceRoom = classrooms?.find(c => c.id === promoteSourceClassroomId)
                const sourceLabel = sourceRoom ? `${sourceRoom.level}/${sourceRoom.room}` : ''
                
                const targetRoom = classrooms?.find(c => c.id === promoteTargetClassroomId)
                const targetLabel = promoteTargetClassroomId === 'none' ? 'ปลดออก (ไม่มีห้องเรียนหลัก)' : (targetRoom ? `${targetRoom.level}/${targetRoom.room}` : '')
                
                const studentCount = (students || []).filter(s => s.classroom_id === promoteSourceClassroomId).length
                
                if (studentCount === 0) {
                  openMessageModal('ไม่พบนักเรียน', `ไม่มีรายชื่อนักเรียนอยู่ในห้องเรียน ${sourceLabel} สำหรับทำรายการย้ายห้อง`)
                  return
                }
                
                openConfirmModal(
                  'ยืนยันการย้ายนักเรียนยกห้อง',
                  `คุณต้องการย้ายนักเรียนจำนวนทั้งหมด ${studentCount} คน จากห้อง ${sourceLabel} ไปยังห้อง ${targetLabel} ใช่หรือไม่?\n\n(การดำเนินการนี้จะอัปเดตข้อมูลนักเรียนทั้งหมดในห้องเรียนต้นทางทันที)`,
                  () => {
                    bulkPromoteMutation.mutate({ 
                      sourceId: promoteSourceClassroomId, 
                      targetId: promoteTargetClassroomId === 'none' ? '' : promoteTargetClassroomId 
                    })
                  }
                )
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm font-semibold flex items-center gap-2"
            >
              {bulkPromoteMutation.isPending ? 'กำลังดำเนินการย้ายห้อง...' : 'เลื่อนระดับชั้นยกห้อง'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'subject' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-1">เพิ่มนักเรียนเข้ารายวิชาเรียนรวม (ไม่ย้ายห้องหลัก)</h2>
          <p className="text-sm text-gray-500 mb-4">เลือกเฉพาะรายวิชา แล้วเพิ่ม/ลบนักเรียนเฉพาะในรายวิชานั้น</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">เลือกรายวิชา</label>
              <select className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 bg-white" value={groupId} onChange={(e) => {
                setGroupId(e.target.value)
                setGroupClassroomFilterId('')
              }}>
                <option value="">-- เลือกรายวิชา --</option>
                {subjects?.map((s) => <option key={s.id} value={s.id}>{s.subject_code} {s.subject_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">เลือกห้องเรียนก่อน</label>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                value={groupClassroomFilterId}
                onChange={(e) => setGroupClassroomFilterId(e.target.value)}
                disabled={!groupId}
              >
                <option value="">-- เลือกห้องเรียน --</option>
                {classrooms?.map((c) => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ค้นหานักเรียน</label>
              <input className="mt-1 w-full border border-gray-300 rounded-lg p-2.5" value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} placeholder="ค้นหารหัส/ชื่อ" disabled={!groupClassroomFilterId} />
            </div>
          </div>
          {groupId && groupClassroomFilterId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-700 mb-3">รายชื่อที่ยังไม่อยู่ในกลุ่ม</h3>
                <div className="max-h-64 overflow-auto space-y-2">
                  {availableMembers.slice(0, 200).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-sm text-gray-700">{s.student_code} - {s.first_name} {s.last_name}</span>
                      <button
                        type="button"
                        onClick={() => openConfirmModal(
                          'ยืนยันการเพิ่มสมาชิก',
                          `ต้องการเพิ่ม ${s.first_name} ${s.last_name} เข้ารายวิชานี้ใช่หรือไม่?`,
                          () => {
                            addMemberMutation.mutate({ studentId: s.id })
                            setShowModal(false)
                          }
                        )}
                        className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
                      >
                        เพิ่ม
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-700 mb-3">สมาชิกในกลุ่มนี้</h3>
                <div className="max-h-64 overflow-auto space-y-2">
                  {currentMembers.slice(0, 200).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                      <span className="text-sm text-gray-700">{s.student_code} - {s.first_name} {s.last_name}</span>
                      <button
                        type="button"
                        onClick={() => openConfirmModal(
                          'ยืนยันการลบสมาชิก',
                          `ต้องการลบ ${s.first_name} ${s.last_name} ออกจากรายวิชานี้ใช่หรือไม่?`,
                          () => {
                            removeMemberMutation.mutate({ studentId: s.id })
                            setShowModal(false)
                          }
                        )}
                        className="text-xs px-2 py-1 rounded bg-rose-600 text-white"
                      >
                        ลบออก
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {groupId && !groupClassroomFilterId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              กรุณาเลือกห้องเรียนก่อน ระบบจะแสดงรายชื่อที่ยังไม่อยู่ในกลุ่มตามห้องที่เลือก
            </div>
          )}
        </div>
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

      {activeTab === 'list' && (
        isLoading ? (
          <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 bg-gray-50/50 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <h2 className="font-bold text-gray-700 flex items-center gap-2 self-start lg:self-auto">
                <Users size={20} className="text-indigo-500" /> รายชื่อนักเรียนทั้งหมด
              </h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                {/* Classroom Filter Block */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 relative w-full sm:w-auto" ref={dropdownRef}>
                  <label className="text-[11px] sm:text-sm font-bold sm:font-semibold text-gray-500 sm:text-gray-600 uppercase tracking-wider sm:normal-case sm:tracking-normal whitespace-nowrap">
                    กรองตามห้องเรียน:
                  </label>
                  <div className="relative w-full sm:min-w-[240px]">
                    <div 
                      onClick={() => setIsFilterDropdownOpen(true)}
                      className="border border-gray-300 rounded-xl p-2.5 text-sm bg-white shadow-sm font-medium flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 gap-2 min-h-[42px]"
                    >
                      <input
                        type="text"
                        placeholder="ค้นหาห้องเรียน / กิจกรรม..."
                        value={isFilterDropdownOpen ? filterSearchQuery : (filterOptions.find(o => o.value === filterClassroomId)?.label || '-- กรุณาเลือกห้องเรียน / กิจกรรม --')}
                        onChange={e => {
                          setIsFilterDropdownOpen(true)
                          setFilterSearchQuery(e.target.value)
                        }}
                        onFocus={() => setIsFilterDropdownOpen(true)}
                        className="w-full bg-transparent outline-none border-none text-sm text-gray-700 font-medium placeholder-gray-400 p-0"
                      />
                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        {filterClassroomId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFilterClassroomId('')
                              setFilterSearchQuery('')
                              setIsFilterDropdownOpen(false)
                            }}
                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center w-5 h-5"
                          >
                            <span className="text-[10px] font-bold">✕</span>
                          </button>
                        )}
                        <span className="text-gray-400 text-[10px]">▼</span>
                      </div>
                    </div>
                    
                    {isFilterDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm">
                        {filteredFilterOptions.length === 0 ? (
                          <div className="p-3 text-center text-gray-400 font-medium">ไม่พบผลลัพธ์ที่ค้นหา</div>
                        ) : (
                          (() => {
                            const categories = Array.from(new Set(filteredFilterOptions.map(o => o.category)))
                            return categories.map(cat => {
                              const items = filteredFilterOptions.filter(o => o.category === cat)
                              return (
                                <div key={cat} className="border-b last:border-0 border-gray-100 pb-1">
                                  {cat !== 'ทั่วไป' && (
                                    <div className="px-3 py-1.5 text-[11px] font-bold text-indigo-500 uppercase bg-indigo-50/40 tracking-wider">
                                      {cat}
                                    </div>
                                  )}
                                  <div className="space-y-0.5 mt-0.5">
                                    {items.map(opt => (
                                      <div
                                        key={opt.value}
                                        onClick={() => {
                                          setFilterClassroomId(opt.value)
                                          setFilterSearchQuery('')
                                          setIsFilterDropdownOpen(false)
                                        }}
                                        className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                                          filterClassroomId === opt.value 
                                            ? 'bg-indigo-50 text-indigo-700 font-bold' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span>{opt.label}</span>
                                        {filterClassroomId === opt.value && (
                                          <span className="text-indigo-600 font-bold text-xs">✓</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })
                          })()
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Input Block */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <label className="sm:hidden text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    ค้นหาชื่อนักเรียน:
                  </label>
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหารหัส/ชื่อนักเรียน..."
                    value={bottomSearchKeyword}
                    onChange={e => setBottomSearchKeyword(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-full sm:min-w-[200px] w-full sm:w-auto shadow-sm font-medium"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">รหัส</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">คำนำหน้า</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เพศ</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ห้องเรียน</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!filterClassroomId ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-gray-500 bg-gray-50/20 font-medium">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                            <Users size={24} />
                          </div>
                          <div className="text-base text-gray-600 font-semibold">กรุณาเลือกห้องเรียนหรือกิจกรรมชุมนุมก่อน เพื่อแสดงรายชื่อนักเรียน</div>
                          <div className="text-xs text-gray-400">ระบบจะกรองและแสดงรายชื่อนักเรียนเฉพาะห้องหรือกลุ่มที่เลือก เพื่อความรวดเร็วและเป็นระเบียบ</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {students?.filter(s => {
                        // 1. กรองตามห้องเรียน / กิจกรรมรวม
                        let matchGroup = true
                        if (filterClassroomId) {
                          if (filterClassroomId.startsWith('CLASSROOM:')) {
                            const cid = filterClassroomId.replace('CLASSROOM:', '')
                            matchGroup = s.classroom_id === cid
                          } else if (filterClassroomId.startsWith('SUBJECT:')) {
                            const sid = filterClassroomId.replace('SUBJECT:', '')
                            matchGroup = allMemberships.some((m) => m.student_id === s.id && m.group_type === 'SUBJECT' && m.group_id === sid)
                          }
                        }

                        // 2. ค้นหาด้วยชื่อ/รหัส/ชื่อเล่น
                        let matchSearch = true
                        if (bottomSearchKeyword.trim()) {
                          const kw = bottomSearchKeyword.toLowerCase().trim()
                          const fullName = `${s.prefix ? `${s.prefix} ` : ''}${s.first_name} ${s.last_name}`.toLowerCase()
                          const code = (s.student_code || '').toLowerCase()
                          const nick = (s.nickname || '').toLowerCase()
                          matchSearch = fullName.includes(kw) || code.includes(kw) || nick.includes(kw)
                        }

                        return matchGroup && matchSearch
                      }).map(student => {
                        const subjectMembershipIds = allMemberships
                          .filter((m) => m.student_id === student.id && m.group_type === 'SUBJECT')
                          .map((m) => m.group_id)
                        const subjectLabels = subjectMembershipIds
                          .map((id) => subjects?.find((sub) => sub.id === id))
                          .filter(Boolean)
                          .map((sub: any) => `${sub.subject_code} ${sub.subject_name}`)
                        return (
                        <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">{student.student_code}</td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.prefix || '-'}</td>
                          <td 
                            className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold cursor-pointer hover:text-indigo-600 transition-all group"
                            onClick={() => handleStartEdit(student)}
                            title="แตะเพื่อแก้ไขข้อมูลนักเรียน"
                          >
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="sm:hidden font-medium text-gray-500">{student.prefix || ''}</span>
                              <span className="group-hover:underline text-indigo-900 sm:text-gray-800">{student.first_name} {student.last_name}</span>
                              {student.nickname && <span className="text-gray-400 font-normal text-xs">({student.nickname})</span>}
                              {(() => {
                                const visit = student.home_visits?.[0];
                                if (visit?.status !== 'COMPLETED') return null;
                                const risk = visit.home_visit_assessments?.[0]?.risk_level;
                                if (risk === 'WATCH') return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800" title="กลุ่มเฝ้าระวัง (เยี่ยมบ้าน)"><AlertTriangle size={10} className="mr-0.5" /> เฝ้าระวัง</span>;
                                if (risk === 'URGENT') return <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-100 text-red-800" title="กลุ่มช่วยเหลือเร่งด่วน (เยี่ยมบ้าน)"><AlertTriangle size={10} className="mr-0.5" /> เร่งด่วน</span>;
                                return null;
                              })()}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.gender === 'MALE' ? 'ชาย' : student.gender === 'FEMALE' ? 'หญิง' : '-'}
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {student.classroom ? <span className="bg-slate-100 px-2 py-1 rounded-lg">{student.classroom.level}/{student.classroom.room}</span> : '-'}
                            {subjectLabels.length > 0 && (
                              <div className="mt-1 text-xs text-indigo-700">
                                กลุ่มรวม: {subjectLabels.slice(0, 2).join(', ')}{subjectLabels.length > 2 ? ` +${subjectLabels.length - 2}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartEdit(student)
                                }}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors inline-flex justify-center"
                                title="แก้ไขข้อมูล"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openConfirmModal('ยืนยันการลบ', `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ ${student.first_name} ${student.last_name}?`, () => deleteMutation.mutate(student.id))
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors inline-flex justify-center"
                                title="ลบข้อมูล"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                      {students?.filter(s => {
                        // 1. กรองตามห้องเรียน / กิจกรรมรวม
                        let matchGroup = true
                        if (filterClassroomId) {
                          if (filterClassroomId.startsWith('CLASSROOM:')) {
                            const cid = filterClassroomId.replace('CLASSROOM:', '')
                            matchGroup = s.classroom_id === cid
                          } else if (filterClassroomId.startsWith('SUBJECT:')) {
                            const sid = filterClassroomId.replace('SUBJECT:', '')
                            matchGroup = allMemberships.some((m) => m.student_id === s.id && m.group_type === 'SUBJECT' && m.group_id === sid)
                          }
                        }

                        // 2. ค้นหาด้วยชื่อ/รหัส/ชื่อเล่น
                        let matchSearch = true
                        if (bottomSearchKeyword.trim()) {
                          const kw = bottomSearchKeyword.toLowerCase().trim()
                          const fullName = `${s.prefix ? `${s.prefix} ` : ''}${s.first_name} ${s.last_name}`.toLowerCase()
                          const code = (s.student_code || '').toLowerCase()
                          const nick = (s.nickname || '').toLowerCase()
                          matchSearch = fullName.includes(kw) || code.includes(kw) || nick.includes(kw)
                        }

                        return matchGroup && matchSearch
                      }).length === 0 && (
                        <tr><td colSpan={6} className="px-6 py-16 text-center text-gray-400 bg-gray-50/30 font-medium">ไม่พบข้อมูลนักเรียน (ลองเปลี่ยนตัวกรองห้องเรียน)</td></tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
