import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Bell, Shield, Smartphone, UserCog, Palette } from 'lucide-react'
import { getUsers, updateUserRole } from '../services/userService'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

type SettingsTab = 'appearance' | 'notifications' | 'users'

const themeOptions = [
  { key: '#f3f4f6', label: 'Slate Light' },
  { key: '#eef6ff', label: 'Sky Mist' },
  { key: '#f7f6ff', label: 'Lavender Soft' },
  { key: '#fff7ed', label: 'Warm Sand' },
  { key: '#f0fdf4', label: 'Mint Calm' },
  { key: '#fef2f2', label: 'Rose Blush' },
  { key: '#ecfeff', label: 'Aqua Breeze' },
  { key: 'grad_dawn', label: 'Dawn Glow' },
  { key: 'grad_ocean', label: 'Ocean Breeze' },
  { key: 'grad_forest', label: 'Forest Mist' },
  { key: 'grad_midnight', label: 'Midnight Ink' },
  { key: 'grad_royal', label: 'Royal Velvet' },
  { key: 'grad_ember', label: 'Ember Night' },
  { key: 'grad_aurora', label: 'Aurora Deep' },
]

const gradientThemes: Record<string, { image: string; fallback: string }> = {
  grad_dawn: { image: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fee2e2 100%)', fallback: '#fff7ed' },
  grad_ocean: { image: 'linear-gradient(135deg, #ecfeff 0%, #e0f2fe 50%, #e0e7ff 100%)', fallback: '#ecfeff' },
  grad_forest: { image: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfccb 100%)', fallback: '#f0fdf4' },
  grad_midnight: { image: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #111827 100%)', fallback: '#111827' },
  grad_royal: { image: 'linear-gradient(135deg, #3b0764 0%, #4c1d95 45%, #1e1b4b 100%)', fallback: '#312e81' },
  grad_ember: { image: 'linear-gradient(135deg, #3f1d1d 0%, #7c2d12 50%, #1f2937 100%)', fallback: '#3f1d1d' },
  grad_aurora: { image: 'linear-gradient(135deg, #052e16 0%, #164e63 48%, #1e293b 100%)', fallback: '#0f172a' },
}

const applyThemeVars = (themeValue: string) => {
  const gradient = gradientThemes[themeValue]
  if (gradient) {
    document.documentElement.style.setProperty('--app-bg', gradient.fallback)
    document.documentElement.style.setProperty('--app-bg-image', gradient.image)
    return
  }
  document.documentElement.style.setProperty('--app-bg', themeValue)
  document.documentElement.style.setProperty('--app-bg-image', 'none')
}

export default function Settings() {
  const { role, user } = useAuthStore()
  const isAdmin = role === 'ADMIN'

  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
  const [lineToken, setLineToken] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [selectedBgColor, setSelectedBgColor] = useState('#f3f4f6')
  const [customBgColor, setCustomBgColor] = useState('#f3f4f6')
  const [isSavingAppearance, setIsSavingAppearance] = useState(false)
  const [isSavingNotify, setIsSavingNotify] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultModalType, setResultModalType] = useState<'success' | 'error'>('success')
  const [resultModalMessage, setResultModalMessage] = useState('')
  const [isThemeBgColumnSupported, setIsThemeBgColumnSupported] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const savedLine = localStorage.getItem('sams_line_token') || ''
      const savedTgToken = localStorage.getItem('sams_tg_token') || ''
      const savedTgChatId = localStorage.getItem('sams_tg_chat_id') || ''
      const localBgColor = localStorage.getItem('sams_theme_bg') || '#f3f4f6'
      setLineToken(savedLine)
      setTelegramToken(savedTgToken)
      setTelegramChatId(savedTgChatId)

      let resolvedBgColor = localBgColor
      if (user?.id) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        const supportsThemeBg = !!(data && Object.prototype.hasOwnProperty.call(data, 'theme_bg'))
        setIsThemeBgColumnSupported(supportsThemeBg)
        if (supportsThemeBg && data?.theme_bg && /^#([0-9A-Fa-f]{6})$/.test(data.theme_bg)) {
          resolvedBgColor = data.theme_bg
          localStorage.setItem('sams_theme_bg', resolvedBgColor)
        }
      }

      setSelectedBgColor(resolvedBgColor)
      setCustomBgColor(resolvedBgColor)
      applyThemeVars(resolvedBgColor)
    }
    loadSettings()
  }, [user?.id])

  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingAppearance(true)
    try {
      localStorage.setItem('sams_theme_bg', selectedBgColor)
      applyThemeVars(selectedBgColor)
      if (user?.id && isThemeBgColumnSupported) {
        const { error } = await supabase
          .from('users')
          .update({ theme_bg: selectedBgColor })
          .eq('id', user.id)
        if (error) {
          console.warn('save theme_bg to users failed:', error.message)
        }
      }
      setIsSavingAppearance(false)
      setResultModalType('success')
      setResultModalMessage('บันทึกธีมเรียบร้อย')
      setShowResultModal(true)
    } catch (error: any) {
      setIsSavingAppearance(false)
      setResultModalType('error')
      setResultModalMessage(error?.message || 'ไม่สามารถบันทึกธีมได้')
      setShowResultModal(true)
    }
  }

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingNotify(true)
    setTimeout(() => {
      localStorage.setItem('sams_line_token', lineToken)
      localStorage.setItem('sams_tg_token', telegramToken)
      localStorage.setItem('sams_tg_chat_id', telegramChatId)
      setIsSavingNotify(false)
      setResultModalType('success')
      setResultModalMessage('บันทึกการตั้งค่าแจ้งเตือนสำเร็จ')
      setShowResultModal(true)
    }, 600)
  }

  const queryClient = useQueryClient()
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      alert('อัปเดตสิทธิ์สำเร็จ')
    },
    onError: (err: any) => {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    }
  })

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          ไม่มีสิทธิ์เข้าถึงหน้าตั้งค่าระบบ
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowResultModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white shadow-2xl">
            <div className={`h-1.5 w-full ${resultModalType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <div className="p-7 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${resultModalType === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <Save size={26} className={resultModalType === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-800">
                {resultModalType === 'success' ? 'บันทึกสำเร็จ' : 'บันทึกไม่สำเร็จ'}
              </h3>
              <p className="text-sm text-gray-600">{resultModalMessage}</p>
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 font-semibold text-white transition ${
                  resultModalType === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-8">
        <Shield className="text-indigo-600" size={32} />
        <h1 className="text-3xl font-bold text-gray-800">ตั้งค่าระบบ (System Settings)</h1>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex overflow-x-auto mb-6">
        <button onClick={() => setActiveTab('appearance')} className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'appearance' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          Appearance
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'notifications' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          Notifications
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          User Management
        </button>
      </div>

      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveAppearance} className="bg-white p-8 rounded-2xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-indigo-100 p-2 rounded-lg"><Palette className="text-indigo-600" size={24} /></div>
            <h2 className="text-xl font-bold text-gray-800">Theme & Branding</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">เลือกสีพื้นหลังหลักของระบบให้เหมาะกับโรงเรียน</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {themeOptions.map((theme) => (
              <button
                key={theme.key}
                type="button"
                onClick={() => {
                  setSelectedBgColor(theme.key)
                  applyThemeVars(theme.key)
                }}
                className={`rounded-xl border p-3 text-left transition ${selectedBgColor === theme.key ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}
              >
                <div className="h-10 rounded-lg border border-white/70" style={gradientThemes[theme.key] ? { backgroundImage: gradientThemes[theme.key].image } : { backgroundColor: theme.key }} />
                <p className="text-xs font-semibold mt-2 text-gray-700">{theme.label}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">กำหนดสีเอง (Custom)</p>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => {
                  const color = e.target.value
                  setCustomBgColor(color)
                  setSelectedBgColor(color)
                  document.documentElement.style.setProperty('--app-bg', color)
                }}
                className="h-11 w-20 cursor-pointer rounded-lg border border-gray-300 bg-white p-1"
              />
              <input
                type="text"
                value={customBgColor}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomBgColor(value)
                  if (/^#([0-9A-Fa-f]{6})$/.test(value)) {
                    setSelectedBgColor(value)
                    document.documentElement.style.setProperty('--app-bg', value)
                  }
                }}
                placeholder="#RRGGBB"
                className="w-full md:w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (/^#([0-9A-Fa-f]{6})$/.test(customBgColor)) {
                    setSelectedBgColor(customBgColor)
                    document.documentElement.style.setProperty('--app-bg', customBgColor)
                  }
                }}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                ใช้สีนี้
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">รองรับรหัสสีแบบ Hex เช่น `#dbeafe`</p>
          </div>
          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isSavingAppearance} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
              <Save size={18} />
              {isSavingAppearance ? 'กำลังบันทึก...' : 'บันทึกธีม'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-green-100 p-2 rounded-lg"><Bell className="text-green-600" size={24} /></div>
              <h2 className="text-xl font-bold text-gray-800">LINE Notify</h2>
            </div>
            <label className="block text-sm font-bold text-gray-700 mb-2">LINE Notify Access Token</label>
            <input type="password" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500 font-mono" value={lineToken} onChange={e => setLineToken(e.target.value)} />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-lg"><Smartphone className="text-blue-600" size={24} /></div>
              <h2 className="text-xl font-bold text-gray-800">Telegram Bot</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Telegram Bot Token</label>
                <input type="password" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Default Chat ID</label>
                <input type="text" className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSavingNotify} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
              <Save size={18} />
              {isSavingNotify ? 'กำลังบันทึก...' : 'บันทึกการแจ้งเตือน'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'users' && isAdmin && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-purple-100 p-2 rounded-lg"><UserCog className="text-purple-600" size={24} /></div>
            <h2 className="text-xl font-bold text-gray-800">User Management & Roles</h2>
          </div>
          {isUsersLoading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-center">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.email}</td>
                      <td className="px-6 py-4">{u.role}</td>
                      <td className="px-6 py-4 text-center">
                        <select
                          className="border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500"
                          value={u.role}
                          onChange={(e) => {
                            if (window.confirm(`ต้องการเปลี่ยนสิทธิ์ของ ${u.email} เป็น ${e.target.value} ใช่หรือไม่?`)) {
                              updateRoleMutation.mutate({ userId: u.id, role: e.target.value })
                            }
                          }}
                          disabled={updateRoleMutation.isPending}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="TEACHER">TEACHER</option>
                          <option value="ADVISOR">ADVISOR</option>
                          <option value="STUDENT">STUDENT</option>
                          <option value="PARENT">PARENT</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
