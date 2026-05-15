import { supabase } from '../lib/supabase'

// Helper: คำนวณวันที่เริ่มต้นตาม timeFilter
export const getStartDate = (timeFilter: string): string => {
  const now = new Date()
  let startDate = new Date()
  if (timeFilter === 'today') {
    startDate.setHours(0, 0, 0, 0)
  } else if (timeFilter === 'week') {
    startDate.setDate(now.getDate() - 7)
  } else if (timeFilter === 'month') {
    startDate.setMonth(now.getMonth() - 1)
  } else if (timeFilter === 'term') {
    startDate.setMonth(now.getMonth() - 4)
  } else if (timeFilter === 'year') {
    startDate.setFullYear(now.getFullYear() - 1)
  }
  return startDate.toISOString()
}

// ข้อมูลสรุปรายห้องเรียน
export interface ClassroomReportRow {
  classroomId: string
  label: string        // เช่น "ม.1/1"
  present: number
  absent: number
  late: number
  total: number
  rate: number         // % มาเรียน
}

export const getClassroomReport = async (timeFilter: string = 'month'): Promise<ClassroomReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  const { data } = await supabase
    .from('attendance')
    .select(`
      status,
      students ( classroom_id, classrooms(id, level, room) )
    `)
    .gte('checkin_time', startDate)

  const statsMap: Record<string, ClassroomReportRow> = {}

  data?.forEach((att: any) => {
    const classroom = att.students?.classrooms
    if (!classroom) return
    const id = classroom.id
    const label = `ม.${classroom.level}/${classroom.room}`
    if (!statsMap[id]) {
      statsMap[id] = { classroomId: id, label, present: 0, absent: 0, late: 0, total: 0, rate: 0 }
    }
    statsMap[id].total++
    if (att.status === 'PRESENT') statsMap[id].present++
    else if (att.status === 'ABSENT') statsMap[id].absent++
    else if (att.status === 'LATE') statsMap[id].late++
  })

  return Object.values(statsMap)
    .map(r => ({ ...r, rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0 }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// ข้อมูลสรุปรายบุคคล
export interface StudentReportRow {
  studentId: string
  studentCode: string
  fullName: string
  classroom: string
  present: number
  absent: number
  late: number
  total: number
  rate: number
}

export const getStudentReport = async (timeFilter: string = 'month', classroomId?: string): Promise<StudentReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  let query = supabase
    .from('attendance')
    .select(`
      status,
      students ( id, student_code, first_name, last_name, classroom_id, classrooms(level, room) )
    `)
    .gte('checkin_time', startDate)

  const { data } = await query

  const statsMap: Record<string, StudentReportRow> = {}

  data?.forEach((att: any) => {
    const s = att.students
    if (!s) return
    if (classroomId && s.classroom_id !== classroomId) return
    const id = s.id
    const classroom = s.classrooms ? `ม.${s.classrooms.level}/${s.classrooms.room}` : '-'
    if (!statsMap[id]) {
      statsMap[id] = {
        studentId: id,
        studentCode: s.student_code,
        fullName: `${s.first_name} ${s.last_name}`,
        classroom,
        present: 0, absent: 0, late: 0, total: 0, rate: 0
      }
    }
    statsMap[id].total++
    if (att.status === 'PRESENT') statsMap[id].present++
    else if (att.status === 'ABSENT') statsMap[id].absent++
    else if (att.status === 'LATE') statsMap[id].late++
  })

  return Object.values(statsMap)
    .map(r => ({ ...r, rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0 }))
    .sort((a, b) => a.studentCode.localeCompare(b.studentCode))
}

// ข้อมูลสรุปรายวิชา
export interface SubjectReportRow {
  subjectId: string
  subjectCode: string
  subjectName: string
  present: number
  absent: number
  late: number
  total: number
  rate: number
}

export const getSubjectReport = async (timeFilter: string = 'month'): Promise<SubjectReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  const { data } = await supabase
    .from('attendance')
    .select(`
      status,
      attendance_sessions ( subject_id, subjects(id, subject_code, subject_name) )
    `)
    .gte('checkin_time', startDate)

  const statsMap: Record<string, SubjectReportRow> = {}

  data?.forEach((att: any) => {
    const subject = att.attendance_sessions?.subjects
    if (!subject) return
    const id = subject.id
    if (!statsMap[id]) {
      statsMap[id] = {
        subjectId: id,
        subjectCode: subject.subject_code,
        subjectName: subject.subject_name,
        present: 0, absent: 0, late: 0, total: 0, rate: 0
      }
    }
    statsMap[id].total++
    if (att.status === 'PRESENT') statsMap[id].present++
    else if (att.status === 'ABSENT') statsMap[id].absent++
    else if (att.status === 'LATE') statsMap[id].late++
  })

  return Object.values(statsMap)
    .map(r => ({ ...r, rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0 }))
    .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode))
}

export const getDashboardStats = async () => {
  const [
    { count: teachersCount },
    { count: studentsCount },
    { count: classroomsCount },
    { count: subjectsCount }
  ] = await Promise.all([
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('classrooms').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true })
  ])

  return {
    teachers: teachersCount || 0,
    students: studentsCount || 0,
    classrooms: classroomsCount || 0,
    subjects: subjectsCount || 0,
  }
}

export const getAnalyticsData = async (timeFilter: string = 'month') => {
  // คำนวณวันที่เริ่มต้นตาม timeFilter
  const now = new Date()
  let startDate = new Date()
  
  if (timeFilter === 'today') {
    startDate.setHours(0, 0, 0, 0)
  } else if (timeFilter === 'week') {
    startDate.setDate(now.getDate() - 7)
  } else if (timeFilter === 'month') {
    startDate.setMonth(now.getMonth() - 1)
  } else if (timeFilter === 'term') {
    startDate.setMonth(now.getMonth() - 4) // สมมติว่าเทอมนึง 4 เดือน
  } else if (timeFilter === 'year') {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  // ดึงข้อมูลจริงทั้งหมด (จำกัด 2000 รายการ)
  const { data: rawAttendance } = await supabase
    .from('attendance')
    .select(`
      id, checkin_time, status,
      students ( student_code, first_name, last_name, classrooms(level, room) ),
      attendance_sessions ( session_date, subjects(subject_name) )
    `)
    .gte('checkin_time', startDate.toISOString())
    .order('checkin_time', { ascending: false })
    .limit(2000)

  // ประมวลผลข้อมูลจริง
  let totalPresent = 0
  let totalAbsent = 0
  let totalLate = 0

  const dailyStats: Record<string, { present: number, absent: number, late: number }> = {}

  rawAttendance?.forEach(att => {
    // นับสำหรับ Pie Chart
    if (att.status === 'PRESENT') totalPresent++
    if (att.status === 'ABSENT') totalAbsent++
    if (att.status === 'LATE') totalLate++

    // นับสำหรับ Bar Chart (แยกตามวัน)
    const dateStr = att.attendance_sessions?.session_date || att.checkin_time.split('T')[0]
    // ตัดเอาเฉพาะชื่อวันแบบย่อภาษาไทย เช่น จ. อ. พ.
    const shortDate = new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'short' })
    
    if (!dailyStats[shortDate]) {
      dailyStats[shortDate] = { present: 0, absent: 0, late: 0 }
    }
    
    if (att.status === 'PRESENT') dailyStats[shortDate].present++
    if (att.status === 'ABSENT') dailyStats[shortDate].absent++
    if (att.status === 'LATE') dailyStats[shortDate].late++
  })

  // แปลง object เป็น array สำหรับ Recharts
  const chartData = Object.entries(dailyStats).map(([name, stats]) => ({
    name,
    present: stats.present,
    absent: stats.absent,
    late: stats.late
  })).reverse() // ให้วันเก่าอยู่ซ้าย วันใหม่อยู่ขวา

  // ถ้ายังไม่มีข้อมูลเลย ให้แสดงข้อมูลเป็น 0
  const pieData = (totalPresent === 0 && totalAbsent === 0 && totalLate === 0) 
    ? [{ name: 'ยังไม่มีข้อมูล', value: 1, fill: '#E2E8F0' }]
    : [
        { name: 'มาเรียน', value: totalPresent, fill: '#10B981' },
        { name: 'ขาดเรียน', value: totalAbsent, fill: '#EF4444' },
        { name: 'มาสาย', value: totalLate, fill: '#F59E0B' },
      ]

  return { chartData, pieData, rawAttendance: rawAttendance || [] }
}
