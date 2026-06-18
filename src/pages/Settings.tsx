import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Bell, Shield, Smartphone, UserCog, Palette, Plus, Edit, Trash2 } from 'lucide-react'
import { getUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from '../services/userService'
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

const resolveHexForColorInput = (themeValue: string) => {
  const gradient = gradientThemes[themeValue]
  if (gradient) return gradient.fallback
  if (/^#([0-9A-Fa-f]{6})$/.test(themeValue)) return themeValue
  return '#f3f4f6'
}

export default function Settings() {
  const { role, user } = useAuthStore()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const hasSettingsAccess = role === 'ADMIN' || role === 'SUPER_ADMIN'

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

  // Create User modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRole, setCreateRole] = useState('TEACHER')
  const [createAdminAllowed, setCreateAdminAllowed] = useState(false)

  // Edit User modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState<{ id: string; email: string; role: string; is_admin_allowed?: boolean } | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState('TEACHER')
  const [editAdminAllowed, setEditAdminAllowed] = useState(false)

  // Delete User modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null)

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
      setCustomBgColor(resolveHexForColorInput(resolvedBgColor))
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
    } catch (error) {
      const err = error as Error
      setIsSavingAppearance(false)
      setResultModalType('error')
      setResultModalMessage(err?.message || 'ไม่สามารถบันทึกธีมได้')
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
    enabled: hasSettingsAccess
  })

  const createUserMutation = useMutation({
    mutationFn: ({ email, password, role, isAdminAllowed }: { email: string; password: string; role: string; isAdminAllowed: boolean }) =>
      adminCreateUser(email, password, role, isAdminAllowed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setResultModalType('success')
      setResultModalMessage('สร้างบัญชีผู้ใช้งานใหม่สำเร็จแล้ว')
      setShowResultModal(true)
      setShowCreateModal(false)
      setCreateEmail('')
      setCreatePassword('')
      setCreateRole('TEACHER')
      setCreateAdminAllowed(false)
    },
    onError: (err: Error) => {
      setResultModalType('error')
      setResultModalMessage('เกิดข้อผิดพลาด: ' + err.message)
      setShowResultModal(true)
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, email, password, role, isAdminAllowed }: { userId: string; email: string; password?: string | null; role: string; isAdminAllowed: boolean }) =>
      adminUpdateUser(userId, email, password, role, isAdminAllowed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setResultModalType('success')
      setResultModalMessage('แก้ไขข้อมูลผู้ใช้งานสำเร็จเรียบร้อยแล้ว')
      setShowResultModal(true)
      setShowEditModal(false)
      setEditTarget(null)
    },
    onError: (err: Error) => {
      setResultModalType('error')
      setResultModalMessage('เกิดข้อผิดพลาด: ' + err.message)
      setShowResultModal(true)
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminDeleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setResultModalType('success')
      setResultModalMessage('ลบผู้ใช้งานสำเร็จเรียบร้อยแล้ว')
      setShowResultModal(true)
      setShowDeleteModal(false)
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      setResultModalType('error')
      setResultModalMessage('เกิดข้อผิดพลาด: ' + err.message)
      setShowResultModal(true)
    }
  })

  if (!hasSettingsAccess) {
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



      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="h-1.5 w-full bg-purple-600" />
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!createEmail || !createPassword) return;
              createUserMutation.mutate({ email: createEmail, password: createPassword, role: createRole, isAdminAllowed: createAdminAllowed });
            }}>
              <div className="p-7">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-sans">เพิ่มผู้ใช้งานใหม่</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">สร้างบัญชีผู้ใช้งานในระบบและ Supabase Auth</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">อีเมล (Email)</label>
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="user@school.ac.th"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">รหัสผ่าน (Password)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">บทบาท (Role)</label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-sans"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADVISOR">ADVISOR</option>
                      <option value="STUDENT">STUDENT</option>
                      <option value="PARENT">PARENT</option>
                    </select>
                  </div>

                  {createRole !== 'ADMIN' && createRole !== 'SUPER_ADMIN' && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                      <input
                        type="checkbox"
                        id="createAdminAllowed"
                        checked={createAdminAllowed}
                        onChange={(e) => setCreateAdminAllowed(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor="createAdminAllowed" className="text-xs font-semibold text-slate-700 cursor-pointer select-none font-sans">
                        อนุญาตสิทธิ์ผู้ดูแลระบบเสริม (Admin Access เสริม)
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 px-7 pb-7">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors font-sans text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors shadow-sm font-sans text-sm disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="h-1.5 w-full bg-indigo-600" />
            <form onSubmit={(e) => {
              e.preventDefault();
              updateUserMutation.mutate({
                userId: editTarget.id,
                email: editEmail,
                password: editPassword || null,
                role: editRole,
                isAdminAllowed: editAdminAllowed
              });
            }}>
              <div className="p-7">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <Edit size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-sans">แก้ไขข้อมูลผู้ใช้งาน</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">อัปเดตอีเมล บทบาท หรือเปลี่ยนรหัสผ่านใน Supabase</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 font-sans">อีเมล (Email)</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="user@school.ac.th"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-sans"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-600 font-sans">รหัสผ่านใหม่ (Password)</label>
                      <span className="text-[10px] text-slate-400 font-sans font-medium">เว้นว่างไว้หากไม่ต้องการเปลี่ยน</span>
                    </div>
                    <input
                      type="password"
                      minLength={6}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="ป้อนรหัสผ่านใหม่เพื่อทำการรีเซ็ต"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-600 font-sans">บทบาท (Role)</label>
                      {editTarget.id === user?.id && (
                        <span className="text-[10px] text-amber-600 font-sans font-medium">ไม่สามารถเปลี่ยนบทบาทของตัวเองได้</span>
                      )}
                    </div>
                    <select
                      disabled={editTarget.id === user?.id}
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-sans disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADVISOR">ADVISOR</option>
                      <option value="STUDENT">STUDENT</option>
                      <option value="PARENT">PARENT</option>
                    </select>
                  </div>

                  {editRole !== 'ADMIN' && editRole !== 'SUPER_ADMIN' && (
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                      <input
                        type="checkbox"
                        id="editAdminAllowed"
                        checked={editAdminAllowed}
                        onChange={(e) => setEditAdminAllowed(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="editAdminAllowed" className="text-xs font-semibold text-slate-700 cursor-pointer select-none font-sans">
                        อนุญาตสิทธิ์ผู้ดูแลระบบเสริม (Admin Access เสริม)
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 px-7 pb-7">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors font-sans text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm font-sans text-sm disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="h-1.5 w-full bg-rose-600" />
            <div className="p-7">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0 text-rose-500">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-sans">ยืนยันการลบผู้ใช้งาน</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 font-medium font-sans">
                คุณต้องการลบผู้ใช้ <strong className="text-rose-950">{deleteTarget.email}</strong> ออกจากระบบและ Supabase Auth ใช่หรือไม่?
              </p>
            </div>
            <div className="flex gap-3 px-7 pb-7">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors font-sans text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate(deleteTarget.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-sm font-sans text-sm disabled:opacity-50"
              >
                {deleteUserMutation.isPending ? 'กำลังลบ...' : 'ตกลง'}
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
                  setCustomBgColor(resolveHexForColorInput(theme.key))
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

      {activeTab === 'users' && hasSettingsAccess && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><UserCog className="text-purple-600" size={24} /></div>
              <h2 className="text-xl font-bold text-gray-800">User Management & Roles</h2>
            </div>
            <div className="flex items-center gap-2">
              {!isSuperAdmin && (
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200">
                  Read Only (สิทธิ์อ่านเท่านั้น)
                </span>
              )}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateEmail('')
                    setCreatePassword('')
                    setCreateRole('TEACHER')
                    setShowCreateModal(true)
                  }}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 shadow-sm font-sans"
                >
                  <Plus size={16} />
                  เพิ่มผู้ใช้งาน
                </button>
              )}
            </div>
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
                    <th className="px-6 py-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users?.map(u => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800 border border-red-200' :
                            u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            u.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            u.role === 'ADVISOR' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                            u.role === 'STUDENT' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {u.role}
                          </span>
                          {u.is_admin_allowed && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-200" title="ได้รับสิทธิ์ผู้ดูแลระบบเสริม">
                              + Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTarget({ id: u.id, email: u.email, role: u.role, is_admin_allowed: u.is_admin_allowed })
                                setEditEmail(u.email)
                                setEditRole(u.role)
                                setEditAdminAllowed(!!u.is_admin_allowed)
                                setEditPassword('')
                                setShowEditModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors hover:text-indigo-600"
                              title="แก้ไขผู้ใช้งาน"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={u.id === user?.id}
                              onClick={() => {
                                setDeleteTarget({ id: u.id, email: u.email })
                                setShowDeleteModal(true)
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors hover:text-rose-600 disabled:opacity-40 disabled:hover:text-slate-600 disabled:cursor-not-allowed"
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">-</span>
                        )}
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
