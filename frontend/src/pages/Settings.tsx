import React, { useState, useEffect } from 'react'
import { Save, Bell, Shield, Smartphone } from 'lucide-react'

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
    
    // จำลองการบันทึกข้อมูลเข้าระบบ
    setTimeout(() => {
      localStorage.setItem('sams_line_token', lineToken)
      localStorage.setItem('sams_tg_token', telegramToken)
      localStorage.setItem('sams_tg_chat_id', telegramChatId)
      
      setIsSaving(false)
      alert('บันทึกการตั้งค่าระบบแจ้งเตือนสำเร็จ!')
    }, 800)
  }

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

        <div className="flex justify-end pt-4">
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
    </div>
  )
}
