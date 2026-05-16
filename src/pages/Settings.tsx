import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Bell, Shield, Smartphone, Users, UserCog } from 'lucide-react'
import { getUsers, updateUserRole } from '../services/userService'

export default function Settings() {
  const [lineToken, setLineToken] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // โหลดข้อมูลเก่าจาก Local Storage (หรือในอนาคตดึงจาก Database)
    const savedLine = localStorage.getItem('sams_line_token') || ''
    const savedTgToken = localStorage.getItem('sams_tg_token') || ''
    const savedTgChatId = localStorage.getItem('sams_tg_chat_id') || ''
    
    setLineToken(savedLine)
    setTelegramToken(savedTgToken)
    setTelegramChatId(savedTgChatId)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    setTimeout(() => {
      localStorage.setItem('sams_line_token', lineToken)
      localStorage.setItem('sams_tg_token', telegramToken)
      localStorage.setItem('sams_tg_chat_id', telegramChatId)
      
      setIsSaving(false)
      alert('บันทึกการตั้งค่าระบบแจ้งเตือนสำเร็จ!')
    }, 800)
  }

  const queryClient = useQueryClient()
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('อัปเดตสิทธิ์การใช้งานสำเร็จ')
    },
    onError: (err: any) => {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    }
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">ตั้งค่าระบบ (System Settings)</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* LINE Notify Settings */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-green-100 p-2 rounded-lg"><Bell className="text-green-600" size={24} /></div>
            <h2 className="text-xl font-bold text-gray-800">ตั้งค่า LINE Notify</h2>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">LINE Notify Access Token</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono tracking-wider"
              placeholder="Ex: abcdefghijklmnopqrstuvwxyz1234567890"
              value={lineToken}
              onChange={e => setLineToken(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-2">
              รับ Token ได้ที่ <a href="https://notify-bot.line.me/my/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-medium">notify-bot.line.me</a> (ใช้สำหรับให้ระบบส่งข้อความแจ้งเตือน)
            </p>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-blue-100 p-2 rounded-lg"><Smartphone className="text-blue-600" size={24} /></div>
            <h2 className="text-xl font-bold text-gray-800">ตั้งค่า Telegram Bot</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Telegram Bot Token</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono tracking-wider"
                placeholder="Ex: 123456789:ABCDefghIJKLmnopQRSTuvwxYZ"
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-2">
                รับ Token ได้จากการสร้างบอทผ่าน <strong className="text-gray-700">@BotFather</strong> ในแอป Telegram
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Default Chat ID (สำหรับแจ้งเตือนรวมของระบบ)</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                placeholder="Ex: -1001234567890"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mb-10">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
          >
            <Save size={24} />
            {isSaving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการตั้งค่าระบบ'}
          </button>
        </div>
      </form>

      {/* User Management Section */}
      <div className="mt-10 bg-white p-8 rounded-2xl shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="bg-purple-100 p-2 rounded-lg"><UserCog className="text-purple-600" size={24} /></div>
          <h2 className="text-xl font-bold text-gray-800">จัดการสิทธิ์ผู้ใช้งาน (User Management)</h2>
        </div>
        
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          ส่วนนี้สำหรับ Super Admin เพื่อกำหนดสิทธิ์ระดับระบบ เช่น อนุมัติครูให้เป็นแอดมินระบบ หรือเปลี่ยนสถานะผู้ใช้งาน
        </p>

        {isUsersLoading ? (
          <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">อีเมล (Email)</th>
                  <th className="px-6 py-4">สิทธิ์ปัจจุบัน (Role)</th>
                  <th className="px-6 py-4 text-center">จัดการสิทธิ์ (Change Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users?.map(u => (
                  <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        className="border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-all"
                        value={u.role}
                        onChange={(e) => {
                          if(window.confirm(`ต้องการเปลี่ยนสิทธิ์ของ ${u.email} เป็น ${e.target.value} ใช่หรือไม่?`)) {
                            updateRoleMutation.mutate({ userId: u.id, role: e.target.value })
                          }
                        }}
                        disabled={updateRoleMutation.isPending}
                      >
                        <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
                        <option value="TEACHER">TEACHER (ครู)</option>
                        <option value="STUDENT">STUDENT (นักเรียน)</option>
                        <option value="PARENT">PARENT (ผู้ปกครอง)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
