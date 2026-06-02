import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeaveRequests, submitLeaveRequest, updateLeaveStatus } from '../services/leaveService'
import { getStudents } from '../services/studentService'
import { useAcademicYearStore } from '../store/academicYearStore'
import { CheckCircle, XCircle, FileText, Clock, Calendar } from 'lucide-react'

export default function LeaveRequests() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'list' | 'submit'>('list')
  
  const { selectedYear } = useAcademicYearStore()
  // Queries
  const { data: leaves, isLoading } = useQuery({ queryKey: ['leaves'], queryFn: getLeaveRequests })
  const { data: students } = useQuery({ 
    queryKey: ['students', selectedYear?.id], 
    queryFn: () => getStudents(selectedYear?.id) 
  })

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'APPROVED' | 'REJECTED' }) => updateLeaveStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] })
  })

  const [formData, setFormData] = useState({
    student_id: '',
    leave_type: 'ลาป่วย',
    start_date: '',
    end_date: '',
    reason: ''
  })

  const submitMutation = useMutation({
    mutationFn: submitLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      alert('ยื่นใบลาสำเร็จ')
      setActiveTab('list')
      setFormData({ student_id: '', leave_type: 'ลาป่วย', start_date: '', end_date: '', reason: '' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate(formData as any)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <FileText className="text-indigo-600" />
          ระบบจัดการการลา (Leave Requests)
        </h1>
        <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('list')}
          >
            รายการรออนุมัติ
          </button>
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'submit' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('submit')}
          >
            ยื่นใบลา (สำหรับทดสอบ)
          </button>
        </div>
      </div>

      {activeTab === 'submit' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-4">📝 แบบฟอร์มยื่นใบลา</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">นักเรียนที่ต้องการลา</label>
              <select required className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})}>
                <option value="">-- กรุณาเลือกนักเรียน --</option>
                {students?.map(s => <option key={s.id} value={s.id}>{s.student_code} {s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทการลา</label>
              <select className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value})}>
                <option value="ลาป่วย">🤒 ลาป่วย</option>
                <option value="ลากิจ">🏃 ลากิจ</option>
                <option value="ลาอื่นๆ">❓ ลาอื่นๆ</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">วันที่เริ่มลา</label>
                <input type="date" required className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ถึงวันที่</label>
                <input type="date" required className="w-full border border-gray-300 rounded-xl p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">เหตุผลการลาอย่างละเอียด</label>
              <textarea required className="w-full border border-gray-300 rounded-xl p-3.5 h-32 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="โปรดระบุเหตุผลที่ชัดเจน..."></textarea>
            </div>
            <div className="pt-6">
              <button type="submit" disabled={submitMutation.isPending} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg">
                {submitMutation.isPending ? 'กำลังส่งข้อมูล...' : 'ยื่นใบลาเข้าสู่ระบบ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 font-medium">กำลังโหลดข้อมูล...</div>
          ) : leaves?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <FileText size={64} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 text-lg font-medium">ไม่มีข้อมูลการยื่นใบลาในขณะนี้</p>
            </div>
          ) : (
            leaves?.map(leave => (
              <div key={leave.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-shadow">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                      leave.leave_type === 'ลาป่วย' ? 'bg-red-100 text-red-700' : 
                      leave.leave_type === 'ลากิจ' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {leave.leave_type}
                    </span>
                    <span className={`flex items-center gap-1.5 text-sm font-bold ${
                      leave.status === 'APPROVED' ? 'text-green-600' : 
                      leave.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {leave.status === 'APPROVED' && <CheckCircle size={18} />}
                      {leave.status === 'REJECTED' && <XCircle size={18} />}
                      {leave.status === 'PENDING' && <Clock size={18} />}
                      {leave.status === 'PENDING' ? 'รอครูที่ปรึกษาอนุมัติ' : leave.status === 'APPROVED' ? 'อนุมัติเรียบร้อย' : 'ไม่อนุมัติการลา'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {leave.students?.first_name} {leave.students?.last_name} 
                    <span className="text-sm font-medium text-indigo-500 ml-3 bg-indigo-50 px-2 py-1 rounded">ม.{leave.students?.classrooms?.level}/{leave.students?.classrooms?.room}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mt-3 mb-3">
                    <Calendar size={18} className="text-indigo-400" /> 
                    วันที่ขอลา: {new Date(leave.start_date).toLocaleDateString('th-TH')} <span className="mx-1">ถึง</span> {new Date(leave.end_date).toLocaleDateString('th-TH')}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                    <span className="font-bold text-gray-900 mr-2">เหตุผล:</span> {leave.reason}
                  </div>
                </div>
                
                {leave.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการปฏิเสธใบลา?')) updateStatusMutation.mutate({ id: leave.id, status: 'REJECTED' })}}
                      className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition whitespace-nowrap"
                    >
                      ปฏิเสธไม่อนุมัติ
                    </button>
                    <button 
                      onClick={() => {if(window.confirm('ยืนยันการอนุมัติใบลา?')) updateStatusMutation.mutate({ id: leave.id, status: 'APPROVED' })}}
                      className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition whitespace-nowrap shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle size={20} /> อนุมัติการลา
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
