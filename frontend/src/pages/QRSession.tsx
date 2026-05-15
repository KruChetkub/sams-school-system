import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSchedules } from '../services/scheduleService'
import { createAttendanceSession, updateSessionQR, closeSession, getSessionAttendance } from '../services/qrSessionService'
import { QRCodeSVG } from 'qrcode.react'
import { MonitorPlay, XCircle, RefreshCw, Users, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function QRSession() {
  const queryClient = useQueryClient()
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [activeSession, setActiveSession] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(10)

  const { data: schedules } = useQuery({ queryKey: ['schedules'], queryFn: getSchedules })
  
  const { data: attendanceList } = useQuery({
    queryKey: ['session_attendance', activeSession?.id],
    queryFn: () => getSessionAttendance(activeSession.id),
    enabled: !!activeSession?.id
  })

  // Real-time subscription
  useEffect(() => {
    if (!activeSession?.id) return
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `session_id=eq.${activeSession.id}` },
        (payload) => {
          // Invalidate query to refetch fresh data when a new record is inserted
          queryClient.invalidateQueries({ queryKey: ['session_attendance', activeSession.id] })
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeSession?.id, queryClient])

  const startSessionMutation = useMutation({
    mutationFn: (scheduleId: string) => createAttendanceSession(scheduleId),
    onSuccess: (data) => {
      setActiveSession(data)
      setTimeLeft(10)
    }
  })

  const refreshQRMutation = useMutation({
    mutationFn: (sessionId: string) => updateSessionQR(sessionId),
    onSuccess: (data) => {
      setActiveSession(data)
      setTimeLeft(10)
    }
  })

  const closeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => closeSession(sessionId),
    onSuccess: () => {
      setActiveSession(null)
    }
  })

  useEffect(() => {
    if (!activeSession) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          refreshQRMutation.mutate(activeSession.id)
          return 10
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [activeSession, refreshQRMutation])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">เปิดระบบสแกน QR Code (Smart Attendance)</h1>
      </div>

      {!activeSession ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-6 text-center py-16 max-w-3xl mx-auto">
          <MonitorPlay size={80} className="mx-auto text-indigo-200 mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-8">เลือกคาบเรียนที่ต้องการเปิดระบบเช็คชื่อ</h2>
          <div className="max-w-lg mx-auto">
            <select 
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-colors mb-6 text-lg bg-white"
              value={selectedSchedule}
              onChange={e => setSelectedSchedule(e.target.value)}
            >
              <option value="">-- กรุณาเลือกคาบเรียน --</option>
              {schedules?.map(s => (
                <option key={s.id} value={s.id}>
                  คาบ {s.period} ({s.start_time.substring(0,5)}) - {s.subject?.subject_name} ม.{s.classroom?.level}/{s.classroom?.room}
                </option>
              ))}
            </select>
            <button 
              onClick={() => selectedSchedule && startSessionMutation.mutate(selectedSchedule)}
              disabled={!selectedSchedule || startSessionMutation.isPending}
              className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-3"
            >
              <MonitorPlay size={24} />
              {startSessionMutation.isPending ? 'กำลังเปิดระบบ...' : 'เริ่มเปิด QR Code บนหน้าจอ'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QR Code Section */}
          <div className="lg:col-span-2 bg-white p-10 rounded-2xl shadow-xl border-2 border-indigo-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
              <div className="h-full bg-indigo-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 10) * 100}%` }}></div>
            </div>
            
            <h2 className="text-4xl font-extrabold text-gray-800 mb-3 mt-4">สแกนเพื่อเช็คชื่อเข้าเรียน</h2>
            <p className="text-gray-500 mb-10 text-xl">รหัส QR Code จะเปลี่ยนอัตโนมัติในอีก <span className="font-bold text-indigo-600 text-3xl mx-2">{timeLeft}</span> วินาที</p>
            
            <div className="flex justify-center mb-10">
              <div className="p-8 bg-white border-4 border-indigo-50 rounded-[2rem] shadow-sm">
                <QRCodeSVG value={activeSession.qr_code} size={400} level="H" includeMargin={false} />
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => refreshQRMutation.mutate(activeSession.id)}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={20} /> เปลี่ยนรหัสใหม่ทันที
              </button>
              <button 
                onClick={() => {
                  if(window.confirm('คุณต้องการปิดรับการเช็คชื่อในคาบนี้ใช่หรือไม่?')) {
                    closeSessionMutation.mutate(activeSession.id)
                  }
                }}
                className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <XCircle size={24} /> ปิดรับการเช็คชื่อ
              </button>
            </div>
          </div>

          {/* Realtime Attendance List Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col h-[700px]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={24} className="text-indigo-600" />
                เช็คชื่อล่าสุด
              </h3>
              <span className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                {attendanceList?.length || 0} คน
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {attendanceList?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-pulse mb-4"><MonitorPlay size={48} className="text-gray-300"/></div>
                  <p className="font-medium">กำลังรอการสแกนจากนักเรียน...</p>
                </div>
              ) : (
                attendanceList?.map((record: any) => (
                  <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center gap-4 transition-all duration-300 hover:shadow-md border-l-4 border-l-green-500">
                    <div className="bg-green-100 p-2 rounded-full text-green-600 shadow-sm">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{record.students?.first_name} {record.students?.last_name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        รหัส: <span className="text-indigo-600">{record.students?.student_code}</span> • เวลา: {new Date(record.checkin_time).toLocaleTimeString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
