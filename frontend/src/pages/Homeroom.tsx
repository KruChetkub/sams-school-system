import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getClassrooms } from '../services/classroomService'
import { getStudentsByClassroom, saveHomeroomAttendance } from '../services/homeroomService'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

export default function Homeroom() {
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({})

  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: getClassrooms })
  
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', selectedClassroom],
    queryFn: () => getStudentsByClassroom(selectedClassroom),
    enabled: !!selectedClassroom
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!students) return Promise.resolve()
      const records = students.map(s => ({
        student_id: s.id,
        attendance_date: attendanceDate,
        status: (attendanceState[s.id] || 'PRESENT') as any,
        checkin_time: new Date().toISOString()
      }))
      return saveHomeroomAttendance(attendanceDate, records)
    },
    onSuccess: () => {
      alert('บันทึกข้อมูลเข้าแถวสำเร็จ')
    }
  })

  const markAll = (status: string) => {
    if (!students) return
    const newState = { ...attendanceState }
    students.forEach(s => {
      newState[s.id] = status
    })
    setAttendanceState(newState)
  }

  const setStatus = (id: string, status: string) => {
    setAttendanceState(prev => ({ ...prev, [id]: status }))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">เช็คชื่อเข้าแถว (Homeroom)</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">เลือกห้องเรียน</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors"
            value={selectedClassroom}
            onChange={e => {
              setSelectedClassroom(e.target.value)
              setAttendanceState({})
            }}
          >
            <option value="">-- กรุณาเลือกห้องเรียน --</option>
            {classrooms?.map(c => <option key={c.id} value={c.id}>{c.level}/{c.room}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
          <input 
            type="date" 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            value={attendanceDate}
            onChange={e => setAttendanceDate(e.target.value)}
          />
        </div>
      </div>

      {selectedClassroom && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">รายชื่อนักเรียน ({students?.length || 0} คน)</h2>
            <div className="flex gap-2">
              <button onClick={() => markAll('PRESENT')} className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">มาทั้งหมด</button>
              <button onClick={() => markAll('ABSENT')} className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">ขาดทั้งหมด</button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">กำลังโหลดรายชื่อ...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">รหัส</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ชื่อ-สกุล</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students?.map(student => {
                      const status = attendanceState[student.id] || 'PRESENT'
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{student.student_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.first_name} {student.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setStatus(student.id, 'PRESENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'PRESENT' ? 'bg-green-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle size={16}/> มา</button>
                              <button onClick={() => setStatus(student.id, 'LATE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LATE' ? 'bg-yellow-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock size={16}/> สาย</button>
                              <button onClick={() => setStatus(student.id, 'ABSENT')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'ABSENT' ? 'bg-red-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><XCircle size={16}/> ขาด</button>
                              <button onClick={() => setStatus(student.id, 'LEAVE')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'LEAVE' ? 'bg-blue-500 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertCircle size={16}/> ลา</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {students?.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-gray-500 bg-gray-50/50">ไม่พบนักเรียนในห้องนี้ โปรดตรวจสอบการจัดห้องเรียน</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-white border-t flex justify-end">
                <button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || students?.length === 0}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <CheckCircle size={20} />
                  {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเข้าแถว'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
