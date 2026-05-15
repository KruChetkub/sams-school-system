import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Teachers from './pages/Teachers'
import Classrooms from './pages/Classrooms'
import Students from './pages/Students'
import Subjects from './pages/Subjects'
import Schedules from './pages/Schedules'
import Homeroom from './pages/Homeroom'
import Attendance from './pages/Attendance'
import Dashboard from './pages/Dashboard'
import Parents from './pages/Parents'
import QRSession from './pages/QRSession'
import StudentScan from './pages/StudentScan'
import LeaveRequests from './pages/LeaveRequests'
import ParentDashboard from './pages/ParentDashboard'
import AppSettings from './pages/Settings' // Renamed import to avoid conflict with lucide Settings icon
import { LogOut, Users, Home, Settings, BookOpen, GraduationCap, Library, Calendar, CheckSquare, ClipboardCheck, HeartHandshake, QrCode, ScanLine, FileText, LayoutDashboard } from 'lucide-react'

// Layout Component
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user, role } = useAuthStore()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-600">SAMS</h2>
          <p className="text-sm text-gray-500">Admin Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <Home size={20} /> หน้าหลัก
          </Link>
          <Link to="/teachers" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <Users size={20} /> จัดการบุคลากร
          </Link>
          <Link to="/classrooms" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <BookOpen size={20} /> จัดการห้องเรียน
          </Link>
          <Link to="/students" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <GraduationCap size={20} /> จัดการนักเรียน
          </Link>
          <Link to="/parents" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <HeartHandshake size={20} /> จัดการผู้ปกครอง
          </Link>
          <Link to="/subjects" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <Library size={20} /> จัดการวิชาเรียน
          </Link>
          <Link to="/schedules" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <Calendar size={20} /> จัดตารางเรียน
          </Link>
          <Link to="/homeroom" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <CheckSquare size={20} /> เช็คชื่อเข้าแถว
          </Link>
          <Link to="/attendance" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <ClipboardCheck size={20} /> เช็คชื่อรายวิชา
          </Link>

          <Link to="/leaves" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <FileText size={20} /> ระบบการลา
          </Link>
          <Link to="/parent-dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition border-t mt-2 pt-4">
            <LayoutDashboard size={20} /> แดชบอร์ดผู้ปกครอง
          </Link>
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
            <Settings size={20} /> ตั้งค่าระบบ
          </Link>
        </nav>
        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500">Role: {role || 'Loading...'}</p>
          </div>
          <button 
            onClick={signOut} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
          >
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function App() {
  const { user, setUser, fetchRole, isLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null, session)
      if (session?.user) fetchRole(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null, session)
      if (session?.user) fetchRole(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [setUser, fetchRole])

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <DashboardLayout><Dashboard /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/teachers" element={user ? <DashboardLayout><Teachers /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/classrooms" element={user ? <DashboardLayout><Classrooms /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/students" element={user ? <DashboardLayout><Students /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/parents" element={user ? <DashboardLayout><Parents /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/subjects" element={user ? <DashboardLayout><Subjects /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/schedules" element={user ? <DashboardLayout><Schedules /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/homeroom" element={user ? <DashboardLayout><Homeroom /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/attendance" element={user ? <DashboardLayout><Attendance /></DashboardLayout> : <Navigate to="/login" />} />

        <Route path="/leaves" element={user ? <DashboardLayout><LeaveRequests /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/parent-dashboard" element={user ? <DashboardLayout><ParentDashboard /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <DashboardLayout><AppSettings /></DashboardLayout> : <Navigate to="/login" />} />
        
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
