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
    const label = `${classroom.level}/${classroom.room}`
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
  prefix?: string
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
      students ( id, student_code, prefix, first_name, last_name, classroom_id, classrooms(level, room) )
    `)
    .gte('checkin_time', startDate)

  const { data } = await query

  const statsMap: Record<string, StudentReportRow> = {}

  data?.forEach((att: any) => {
    const s = att.students
    if (!s) return
    if (classroomId && s.classroom_id !== classroomId) return
    const id = s.id
    const classroom = s.classrooms ? `${s.classrooms.level}/${s.classrooms.room}` : '-'
    if (!statsMap[id]) {
      statsMap[id] = {
        studentId: id,
        studentCode: s.student_code,
        prefix: s.prefix || '',
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

export interface StudentAttendanceHistoryRow {
  id: string
  date: string
  subjectName: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  checkinTime?: string
}

export interface StudentHomeroomHistoryRow {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  checkinTime?: string
}

export interface StudentDetailReport {
  studentId: string
  studentCode: string
  prefix?: string
  fullName: string
  classroom: string
  classroomAttendanceSummary: {
    present: number
    absent: number
    late: number
    leave: number
    total: number
  }
  homeroomSummary: {
    present: number
    absent: number
    late: number
    leave: number
    total: number
  }
  classroomAttendanceHistory: StudentAttendanceHistoryRow[]
  homeroomHistory: StudentHomeroomHistoryRow[]
}

export const getStudentDetailReport = async (studentId: string, timeFilter: string = 'month'): Promise<StudentDetailReport | null> => {
  const startDate = getStartDate(timeFilter)

  const { data: studentData } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, classrooms(level, room)')
    .eq('id', studentId)
    .single()

  if (!studentData) return null

  const { data: attendanceData } = await supabase
    .from('attendance')
    .select(`
      id, status, checkin_time,
      attendance_sessions ( session_date, subjects(subject_name) )
    `)
    .eq('student_id', studentId)
    .gte('checkin_time', startDate)
    .order('checkin_time', { ascending: false })
    .limit(2000)

  const { data: homeroomData } = await supabase
    .from('homeroom_attendance')
    .select('id, attendance_date, status, checkin_time')
    .eq('student_id', studentId)
    .gte('attendance_date', startDate.split('T')[0])
    .order('attendance_date', { ascending: false })
    .limit(2000)

  const classroomAttendanceSummary = { present: 0, absent: 0, late: 0, leave: 0, total: 0 }
  const homeroomSummary = { present: 0, absent: 0, late: 0, leave: 0, total: 0 }

  const classroomAttendanceHistory: StudentAttendanceHistoryRow[] = (attendanceData || []).map((row: any) => {
    classroomAttendanceSummary.total++
    if (row.status === 'PRESENT') classroomAttendanceSummary.present++
    if (row.status === 'ABSENT') classroomAttendanceSummary.absent++
    if (row.status === 'LATE') classroomAttendanceSummary.late++
    if (row.status === 'LEAVE') classroomAttendanceSummary.leave++

    return {
      id: row.id,
      date: row.attendance_sessions?.session_date || row.checkin_time?.split('T')[0] || '-',
      subjectName: row.attendance_sessions?.subjects?.subject_name || '-',
      status: row.status,
      checkinTime: row.checkin_time,
    }
  })

  const homeroomHistory: StudentHomeroomHistoryRow[] = (homeroomData || []).map((row: any) => {
    homeroomSummary.total++
    if (row.status === 'PRESENT') homeroomSummary.present++
    if (row.status === 'ABSENT') homeroomSummary.absent++
    if (row.status === 'LATE') homeroomSummary.late++
    if (row.status === 'LEAVE') homeroomSummary.leave++

    return {
      id: row.id,
      date: row.attendance_date,
      status: row.status,
      checkinTime: row.checkin_time,
    }
  })

  return {
    studentId: studentData.id,
    studentCode: studentData.student_code,
    prefix: studentData.prefix || '',
    fullName: `${studentData.first_name} ${studentData.last_name}`,
    classroom: studentData.classrooms ? `${studentData.classrooms.level}/${studentData.classrooms.room}` : '-',
    classroomAttendanceSummary,
    homeroomSummary,
    classroomAttendanceHistory,
    homeroomHistory,
  }
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

export interface PendingClassroomCheckResult {
  pendingClassroomCount: number
  pendingClassrooms: string[]
}

export const getPendingClassroomChecksToday = async (): Promise<PendingClassroomCheckResult> => {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun..6=Sat
  const dayOfWeek = jsDay === 0 ? 7 : jsDay // 1=Mon..7=Sun
  const pad = (n: number) => String(n).padStart(2, '0')
  // ใช้วันที่ local (ไทย) แทน UTC เพื่อให้เทียบ attendance_date ตรงวันจริง
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const { data: todaySchedules } = await supabase
    .from('schedules')
    .select('id, classroom_id, classrooms(level, room)')
    .eq('day_of_week', dayOfWeek)

  if (!todaySchedules || todaySchedules.length === 0) {
    return { pendingClassroomCount: 0, pendingClassrooms: [] }
  }

  const scheduleIds = todaySchedules.map((s: any) => s.id)
  let todayAttendance: any = []
  try {
    // Log for debugging why requests sometimes fail ( bad request 400 )
    console.debug('[getPendingClassroomChecksToday] today=', today, 'scheduleIds=', scheduleIds)
    const res = await supabase
      .from('attendance')
      .select('schedule_id')
      .in('schedule_id', scheduleIds)
      .eq('attendance_date', today)
    if (res.error) {
      console.error('[getPendingClassroomChecksToday] supabase error:', res.error)
    }
    todayAttendance = res.data || []
  } catch (err) {
    console.error('[getPendingClassroomChecksToday] unexpected error:', err)
    todayAttendance = []
  }

  // นับในระดับ "ห้อง" (ถ้าเช็คแล้วอย่างน้อย 1 คาบในห้องนั้น ถือว่าเช็คแล้ว)
  const scheduleToClassroom = new Map<string, string>()
  const allClassroomsSet = new Set<string>()
  todaySchedules.forEach((s: any) => {
    const classroomLabel = s.classrooms ? `${s.classrooms.level}/${s.classrooms.room}` : '-'
    scheduleToClassroom.set(s.id, classroomLabel)
    allClassroomsSet.add(classroomLabel)
  })

  const checkedClassroomsSet = new Set<string>()
  ;(todayAttendance || []).forEach((row: any) => {
    const classroomLabel = scheduleToClassroom.get(row.schedule_id)
    if (classroomLabel) checkedClassroomsSet.add(classroomLabel)
  })

  const pendingClassrooms = Array.from(allClassroomsSet).filter((room) => !checkedClassroomsSet.has(room)).sort((a, b) => a.localeCompare(b))
  return {
    pendingClassroomCount: pendingClassrooms.length,
    pendingClassrooms,
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
