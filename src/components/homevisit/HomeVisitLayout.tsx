import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Home, Users, LayoutDashboard, Menu, X, ArrowLeft, LogOut } from 'lucide-react'

const NavItem = ({ to, icon: Icon, children, onClick }: { to: string, icon: any, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to) && (to !== '/homevisit/dashboard' || location.pathname === '/homevisit/dashboard');
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm border border-emerald-100' : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600 font-medium'}`}
    >
      <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
      {children}
    </Link>
  )
}

export default function HomeVisitLayout({ children }: { children: React.ReactNode }) {
  const { user, role, signOut } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [teacherDisplayName, setTeacherDisplayName] = useState('')
  const userDisplayName = role === 'ADMIN' ? 'แอดมิน' : (teacherDisplayName || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้งาน'))
  
  const closeSidebar = () => setIsSidebarOpen(false)

  useEffect(() => {
    const loadTeacherName = async () => {
      if (!user?.id || role === 'ADMIN') {
        setTeacherDisplayName('')
        return
      }
      const { data } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim()
        setTeacherDisplayName(fullName)
      } else {
        setTeacherDisplayName('')
      }
    }
    loadTeacherName()
  }, [user?.id, role])

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl lg:shadow-sm border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">ระบบเยี่ยมบ้าน</h2>
            <p className="text-xs text-gray-600 font-semibold mt-1">ยินดีต้อนรับ {userDisplayName}</p>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <NavItem to="/homevisit/dashboard" icon={LayoutDashboard} onClick={closeSidebar}>ภาพรวม (Dashboard)</NavItem>
          <NavItem to="/homevisit/students" icon={Users} onClick={closeSidebar}>รายชื่อนักเรียน</NavItem>
        </nav>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <div className="mb-5 px-2">
            <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1 capitalize">{role}</p>
          </div>
          
          <Link to="/portal" className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={18} /> กลับสู่ App Portal
          </Link>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-xl transition-all shadow-sm">
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-100 p-4 flex items-center gap-3 z-30 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors">
            <Menu size={26} />
          </button>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Home Visit</h2>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
