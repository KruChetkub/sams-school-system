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

export const getTeacherClassroomIds = async (teacherId: string, academicYearId?: string): Promise<string[]> => {
  // 1. Get advisor classrooms
  let advisorQuery = supabase
    .from('classrooms')
    .select('id')
    .eq('advisor_id', teacherId)
  
  if (academicYearId) {
    advisorQuery = advisorQuery.eq('academic_year_id', academicYearId)
  }
  
  const { data: advisorRooms } = await advisorQuery
  const advisorRoomIds = (advisorRooms || []).map(r => r.id)

  // 2. Get classrooms from teacher schedules
  let scheduleQuery = supabase
    .from('schedules')
    .select('classroom_id')
    .eq('teacher_id', teacherId)
  
  const { data: scheduleRooms } = await scheduleQuery
  const scheduleRoomIds = (scheduleRooms || []).map(r => r.classroom_id).filter(Boolean) as string[]

  // Combine and deduplicate
  return Array.from(new Set([...advisorRoomIds, ...scheduleRoomIds]))
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

export interface HomeroomReportRow {
  classroomId: string
  label: string
  present: number
  absent: number
  late: number
  leave: number
  total: number
  rate: number
}

export interface HomeroomClassroomStudentRow {
  studentId: string
  studentCode: string
  prefix?: string
  fullName: string
  present: number
  absent: number
  late: number
  leave: number
  total: number
  rate: number
  latestStatus?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  latestDate?: string
}

export interface HomeroomClassroomDetailReport {
  classroomId: string
  classroomLabel: string
  students: HomeroomClassroomStudentRow[]
}

export const getHomeroomReport = async (
  timeFilter: string = 'month',
  academicYearId?: string,
  teacherId?: string
): Promise<HomeroomReportRow[]> => {
  const startDate = getStartDate(timeFilter).split('T')[0]
  let selectStr = `
    status,
    students ( classroom_id, classrooms(id, level, room) )
  `
  if (teacherId) {
    selectStr = `
      status,
      students!inner ( classroom_id, classrooms!inner(id, level, room, advisor_id) )
    `
  }

  let query = supabase
    .from('homeroom_attendance')
    .select(selectStr)
    .gte('attendance_date', startDate)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  if (teacherId) {
    query = query.eq('students.classrooms.advisor_id', teacherId)
  }

  const { data } = await query

  const statsMap: Record<string, HomeroomReportRow> = {}

  data?.forEach((att: any) => {
    const classroom = att.students?.classrooms
    if (!classroom) return
    const id = classroom.id
    const label = `${classroom.level}/${classroom.room}`
    if (!statsMap[id]) {
      statsMap[id] = { classroomId: id, label, present: 0, absent: 0, late: 0, leave: 0, total: 0, rate: 0 }
    }
    statsMap[id].total++
    if (att.status === 'PRESENT') statsMap[id].present++
    else if (att.status === 'ABSENT') statsMap[id].absent++
    else if (att.status === 'LATE') statsMap[id].late++
    else if (att.status === 'LEAVE') statsMap[id].leave++
  })

  return Object.values(statsMap)
    .map(r => ({ ...r, rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0 }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export const getHomeroomClassroomDetailReport = async (
  classroomId: string,
  timeFilter: string = 'month',
  academicYearId?: string,
  semesterId?: string
): Promise<HomeroomClassroomDetailReport | null> => {
  const startDate = getStartDate(timeFilter).split('T')[0]

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, level, room')
    .eq('id', classroomId)
    .maybeSingle()

  if (!classroom) return null

  const { data: students } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name')
    .eq('classroom_id', classroomId)
    .order('student_code')

  let homeroomQuery = supabase
    .from('homeroom_attendance')
    .select('student_id, attendance_date, status')
    .gte('attendance_date', startDate)
    .in('student_id', (students || []).map((s: any) => s.id))

  if (academicYearId) {
    homeroomQuery = homeroomQuery.eq('academic_year_id', academicYearId)
  }
  if (semesterId) {
    homeroomQuery = homeroomQuery.eq('semester_id', semesterId)
  }

  const { data: homeroomRows } = await homeroomQuery.order('attendance_date', { ascending: false })

  const rowsByStudent: Record<string, HomeroomClassroomStudentRow> = {}

  ;(students || []).forEach((s: any) => {
    rowsByStudent[s.id] = {
      studentId: s.id,
      studentCode: s.student_code || '-',
      prefix: s.prefix || '',
      fullName: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      total: 0,
      rate: 0,
    }
  })

  ;(homeroomRows || []).forEach((h: any) => {
    const row = rowsByStudent[h.student_id]
    if (!row) return
    row.total++
    if (h.status === 'PRESENT') row.present++
    else if (h.status === 'ABSENT') row.absent++
    else if (h.status === 'LATE') row.late++
    else if (h.status === 'LEAVE') row.leave++
    if (!row.latestDate) {
      row.latestDate = h.attendance_date
      row.latestStatus = h.status
    }
  })

  const resultStudents = Object.values(rowsByStudent)
    .map((r) => ({ ...r, rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0 }))
    .sort((a, b) => a.studentCode.localeCompare(b.studentCode))

  return {
    classroomId: classroom.id,
    classroomLabel: `${classroom.level}/${classroom.room}`,
    students: resultStudents,
  }
}

export const getClassroomReport = async (
  timeFilter: string = 'month',
  academicYearId?: string,
  teacherId?: string
): Promise<ClassroomReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  let selectStr = `
    status,
    students ( classroom_id, classrooms(id, level, room) )
  `
  if (teacherId || academicYearId) {
    const classroomJoin = academicYearId 
      ? `classrooms!inner(id, level, room, academic_year_id)`
      : `classrooms(id, level, room)`
    selectStr = `
      status,
      students!inner ( classroom_id, ${classroomJoin} )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate)

  if (academicYearId) {
    query = query.eq('students.classrooms.academic_year_id', academicYearId)
  }

  if (teacherId) {
    const teacherClassroomIds = await getTeacherClassroomIds(teacherId, academicYearId)
    if (teacherClassroomIds.length === 0) return []
    query = query.in('students.classroom_id', teacherClassroomIds)
  }

  const { data } = await query

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

export const getStudentReport = async (
  timeFilter: string = 'month',
  classroomId?: string,
  academicYearId?: string,
  teacherId?: string
): Promise<StudentReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  let selectStr = `
    status,
    students ( id, student_code, prefix, first_name, last_name, classroom_id, classrooms(level, room) )
  `
  if (teacherId || academicYearId) {
    const classroomJoin = academicYearId
      ? `classrooms!inner(level, room, academic_year_id)`
      : `classrooms(level, room)`
    selectStr = `
      status,
      students!inner ( id, student_code, prefix, first_name, last_name, classroom_id, ${classroomJoin} )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate)

  if (academicYearId) {
    query = query.eq('students.classrooms.academic_year_id', academicYearId)
  }

  if (teacherId) {
    const teacherClassroomIds = await getTeacherClassroomIds(teacherId, academicYearId)
    if (teacherClassroomIds.length === 0) return []
    query = query.in('students.classroom_id', teacherClassroomIds)
  }

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

export const getStudentDetailReport = async (
  studentId: string,
  timeFilter: string = 'month',
  academicYearId?: string,
  semesterId?: string
): Promise<StudentDetailReport | null> => {
  const startDate = getStartDate(timeFilter)

  const { data: studentData } = await supabase
    .from('students')
    .select('id, student_code, prefix, first_name, last_name, classrooms(level, room)')
    .eq('id', studentId)
    .single()

  if (!studentData) return null

  let attQuery = supabase
    .from('attendance')
    .select(`
      id, status, checkin_time,
      attendance_sessions!inner(
        session_date,
        subjects!inner(subject_name, academic_year_id, semester_id)
      )
    `)
    .eq('student_id', studentId)
    .gte('checkin_time', startDate)

  if (academicYearId) {
    attQuery = attQuery.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }
  if (semesterId) {
    attQuery = attQuery.eq('attendance_sessions.subjects.semester_id', semesterId)
  }

  const { data: attendanceData } = await attQuery
    .order('checkin_time', { ascending: false })
    .limit(2000)

  let homeroomQuery = supabase
    .from('homeroom_attendance')
    .select('id, attendance_date, status, checkin_time')
    .eq('student_id', studentId)
    .gte('attendance_date', startDate.split('T')[0])

  if (academicYearId) {
    homeroomQuery = homeroomQuery.eq('academic_year_id', academicYearId)
  }
  if (semesterId) {
    homeroomQuery = homeroomQuery.eq('semester_id', semesterId)
  }

  const { data: homeroomData } = await homeroomQuery
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
  classroomLabel: string // เพิ่มคอลัมน์ห้องเรียน
  students: {
    studentId: string
    studentCode: string
    prefix?: string
    fullName: string
  }[]
  present: number
  absent: number
  late: number
  total: number
  rate: number
}

// รายละเอียดรายคาบของวิชา (นักเรียนรายคน)
export interface SubjectSessionStudent {
  studentId: string
  studentCode: string
  prefix?: string
  fullName: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
}

export interface SubjectSessionDetail {
  sessionId: string
  sessionDate: string
  classroomLabel: string   // เช่น "ม.1/1"
  students: SubjectSessionStudent[]
}

export interface SubjectDetailReport {
  subjectId: string
  subjectCode: string
  subjectName: string
  sessions: SubjectSessionDetail[]
}

export const getSubjectDetailReport = async (subjectId: string, timeFilter: string = 'month'): Promise<SubjectDetailReport | null> => {
  const startDate = getStartDate(timeFilter)

  const { data: subjectData } = await supabase
    .from('subjects')
    .select('id, subject_code, subject_name')
    .eq('id', subjectId)
    .single()

  if (!subjectData) return null

  const { data: sessionsData, error } = await supabase
    .from('attendance_sessions')
    .select(`
      id, session_date,
      schedules ( classroom_id, classrooms(level, room) ),
      attendance (
        id, status,
        students ( id, student_code, prefix, first_name, last_name )
      )
    `)
    .eq('subject_id', subjectId)
    .gte('session_date', startDate.split('T')[0])
    .order('session_date', { ascending: false })

  if (error) console.error('[getSubjectDetailReport] error:', error)

  const sessions: SubjectSessionDetail[] = (sessionsData || []).map((session: any) => {
    const cls = session.schedules?.classrooms
    const classroomLabel = cls ? `${cls.level}/${cls.room}` : '-'
    return {
      sessionId: session.id,
      sessionDate: session.session_date,
      classroomLabel,
      students: (session.attendance || [])
        .map((att: any) => ({
          studentId: att.students?.id || '',
          studentCode: att.students?.student_code || '',
          prefix: att.students?.prefix || '',
          fullName: `${att.students?.first_name || ''} ${att.students?.last_name || ''}`.trim(),
          status: att.status,
        }))
        .sort((a: SubjectSessionStudent, b: SubjectSessionStudent) => a.studentCode.localeCompare(b.studentCode))
    }
  })

  return {
    subjectId: subjectData.id,
    subjectCode: subjectData.subject_code,
    subjectName: subjectData.subject_name,
    sessions,
  }
}

export const getSubjectReport = async (
  timeFilter: string = 'month',
  academicYearId?: string,
  semesterId?: string,
  teacherId?: string
): Promise<SubjectReportRow[]> => {
  const startDate = getStartDate(timeFilter)
  let selectStr = `
    status,
    students ( id, student_code, prefix, first_name, last_name ),
    attendance_sessions (
      subject_id,
      subjects(id, subject_code, subject_name),
      schedules(classroom_id, classrooms(level, room))
    )
  `
  if (teacherId) {
    selectStr = `
      status,
      students ( id, student_code, prefix, first_name, last_name ),
      attendance_sessions!inner (
        subject_id,
        subjects!inner(id, subject_code, subject_name, academic_year_id, semester_id),
        schedules!inner(classroom_id, classrooms(level, room), teacher_id)
      )
    `
  } else if (academicYearId || semesterId) {
    selectStr = `
      status,
      students ( id, student_code, prefix, first_name, last_name ),
      attendance_sessions!inner (
        subject_id,
        subjects!inner(id, subject_code, subject_name, academic_year_id, semester_id),
        schedules(classroom_id, classrooms(level, room))
      )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate)

  if (academicYearId) {
    query = query.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }
  if (semesterId) {
    query = query.eq('attendance_sessions.subjects.semester_id', semesterId)
  }
  if (teacherId) {
    query = query.eq('attendance_sessions.schedules.teacher_id', teacherId)
  }

  const { data } = await query

  const statsMap: Record<string, SubjectReportRow> = {}

  data?.forEach((att: any) => {
    const session = att.attendance_sessions
    const subject = session?.subjects
    const schedule = session?.schedules
    const classroom = schedule?.classrooms
    
    if (!subject) return
    
    const subjectId = subject.id
    const classroomId = schedule?.classroom_id || 'unknown'
    const classroomLabel = classroom ? `${classroom.level}/${classroom.room}` : '-'
    
    // สร้าง key แยกตามวิชา + ห้องเรียน
    const key = `${subjectId}-${classroomId}`

    if (!statsMap[key]) {
      statsMap[key] = {
        subjectId: subjectId,
        subjectCode: subject.subject_code,
        subjectName: subject.subject_name,
        classroomLabel: classroomLabel,
        students: [],
        present: 0, absent: 0, late: 0, total: 0, rate: 0
      }
    }
    statsMap[key].total++
    if (att.status === 'PRESENT') statsMap[key].present++
    else if (att.status === 'ABSENT') statsMap[key].absent++
    else if (att.status === 'LATE') statsMap[key].late++

    const student = att.students
    if (student?.id && !statsMap[key].students.some((s) => s.studentId === student.id)) {
      statsMap[key].students.push({
        studentId: student.id,
        studentCode: student.student_code || '-',
        prefix: student.prefix || '',
        fullName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      })
    }
  })

  return Object.values(statsMap)
    .map(r => ({
      ...r,
      students: r.students.sort((a, b) => a.studentCode.localeCompare(b.studentCode)),
      rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0
    }))
    .sort((a, b) => {
      // เรียงตามรหัสวิชา แล้วตามด้วยชื่อห้องเรียน
      const codeCompare = a.subjectCode.localeCompare(b.subjectCode)
      if (codeCompare !== 0) return codeCompare
      return a.classroomLabel.localeCompare(b.classroomLabel)
    })
}

export const getDashboardStats = async (academicYearId?: string) => {
  let studentQuery = supabase.from('students').select('*', { count: 'exact', head: true }).is('deleted_at', null)
  let classroomQuery = supabase.from('classrooms').select('*', { count: 'exact', head: true })
  let subjectQuery = supabase.from('subjects').select('*', { count: 'exact', head: true })

  if (academicYearId) {
    studentQuery = supabase.from('students')
      .select('classroom:classroom_id!inner(academic_year_id)', { count: 'exact', head: true })
      .eq('classroom.academic_year_id', academicYearId)
      .is('deleted_at', null)

    classroomQuery = classroomQuery.eq('academic_year_id', academicYearId)
    subjectQuery = subjectQuery.eq('academic_year_id', academicYearId)
  }

  const [
    { count: teachersCount },
    { count: studentsCount },
    { count: classroomsCount },
    { count: subjectsCount }
  ] = await Promise.all([
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    studentQuery,
    classroomQuery,
    subjectQuery
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

export interface CheckedHomeroomTodayResult {
  checkedClassroomCount: number
  checkedClassrooms: string[]
}

export interface AttendanceTrendTodayResult {
  todayPresent: number
  todayTotal: number
  todayRate: number
  yesterdayPresent: number
  yesterdayTotal: number
  yesterdayRate: number
  deltaRate: number
}

export interface AttendanceDailyRatePoint {
  date: string
  label: string
  present: number
  total: number
  rate: number
}

export interface MonthlyAttendanceCompareResult {
  currentMonthRate: number
  previousMonthRate: number
  deltaRate: number
}

export interface AttendanceStatusSummaryByDate {
  date: string
  present: number
  late: number
  absent: number
  leave: number
  total: number
}

export interface HomeroomStatusSummaryByDate {
  date: string
  present: number
  late: number
  absent: number
  leave: number
  total: number
}

export const getAttendanceStatusSummaryByDate = async (date: string, academicYearId?: string): Promise<AttendanceStatusSummaryByDate> => {
  let selectStr = `
    id,
    session_date,
    attendance ( status )
  `
  if (academicYearId) {
    selectStr = `
      id,
      session_date,
      subjects!inner(academic_year_id),
      attendance ( status )
    `
  }

  let query = supabase
    .from('attendance_sessions')
    .select(selectStr)
    .eq('session_date', date)

  if (academicYearId) {
    query = query.eq('subjects.academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getAttendanceStatusSummaryByDate] error:', error)
    return { date, present: 0, late: 0, absent: 0, leave: 0, total: 0 }
  }

  let present = 0
  let late = 0
  let absent = 0
  let leave = 0

  ;(data || []).forEach((session: any) => {
    ;(session.attendance || []).forEach((row: any) => {
      if (row.status === 'PRESENT') present++
      else if (row.status === 'LATE') late++
      else if (row.status === 'ABSENT') absent++
      else if (row.status === 'LEAVE') leave++
    })
  })

  return {
    date,
    present,
    late,
    absent,
    leave,
    total: present + late + absent + leave,
  }
}

export const getHomeroomStatusSummaryByDate = async (date: string, academicYearId?: string): Promise<HomeroomStatusSummaryByDate> => {
  let query = supabase
    .from('homeroom_attendance')
    .select('status')
    .eq('attendance_date', date)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getHomeroomStatusSummaryByDate] error:', error)
    return { date, present: 0, late: 0, absent: 0, leave: 0, total: 0 }
  }

  let present = 0
  let late = 0
  let absent = 0
  let leave = 0

  ;(data || []).forEach((row: any) => {
    if (row.status === 'PRESENT') present++
    else if (row.status === 'LATE') late++
    else if (row.status === 'ABSENT') absent++
    else if (row.status === 'LEAVE') leave++
  })

  return {
    date,
    present,
    late,
    absent,
    leave,
    total: present + late + absent + leave,
  }
}

export const getMonthlyAttendanceCompare = async (academicYearId?: string): Promise<MonthlyAttendanceCompareResult> => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let selectStr = `
    status,
    attendance_sessions ( session_date )
  `
  if (academicYearId) {
    selectStr = `
      status,
      attendance_sessions!inner ( session_date, subjects!inner(academic_year_id) )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', prevMonthStart.toISOString())

  if (academicYearId) {
    query = query.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getMonthlyAttendanceCompare] error:', error)
    return { currentMonthRate: 0, previousMonthRate: 0, deltaRate: 0 }
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthKey = `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}`
  const prevKey = `${prevMonthStart.getFullYear()}-${pad(prevMonthStart.getMonth() + 1)}`

  let currentPresent = 0
  let currentTotal = 0
  let prevPresent = 0
  let prevTotal = 0

  ;(data || []).forEach((row: any) => {
    const date = row.attendance_sessions?.session_date || ''
    const key = typeof date === 'string' ? date.slice(0, 7) : ''
    if (key === monthKey) {
      currentTotal++
      if (row.status === 'PRESENT') currentPresent++
    } else if (key === prevKey) {
      prevTotal++
      if (row.status === 'PRESENT') prevPresent++
    }
  })

  const currentMonthRate = currentTotal > 0 ? Math.round((currentPresent / currentTotal) * 100) : 0
  const previousMonthRate = prevTotal > 0 ? Math.round((prevPresent / prevTotal) * 100) : 0

  return {
    currentMonthRate,
    previousMonthRate,
    deltaRate: currentMonthRate - previousMonthRate,
  }
}

export const getAttendanceDailyRates = async (days: number = 7, academicYearId?: string): Promise<AttendanceDailyRatePoint[]> => {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  let selectStr = `
    status,
    attendance_sessions ( session_date )
  `
  if (academicYearId) {
    selectStr = `
      status,
      attendance_sessions!inner ( session_date, subjects!inner(academic_year_id) )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate.toISOString())

  if (academicYearId) {
    query = query.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getAttendanceDailyRates] error:', error)
    return []
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const keys: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }

  const map: Record<string, { present: number; total: number }> = {}
  keys.forEach((k) => {
    map[k] = { present: 0, total: 0 }
  })

  ;(data || []).forEach((row: any) => {
    const k = row.attendance_sessions?.session_date
    if (!k || !map[k]) return
    map[k].total++
    if (row.status === 'PRESENT') map[k].present++
  })

  return keys.map((k) => {
    const date = new Date(`${k}T00:00:00`)
    const label = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric' })
    const total = map[k].total
    const present = map[k].present
    return {
      date: k,
      label,
      present,
      total,
      rate: total > 0 ? Math.round((present / total) * 100) : 0
    }
  })
}

export const getAttendanceTrendToday = async (academicYearId?: string): Promise<AttendanceTrendTodayResult> => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = `${yesterdayDate.getFullYear()}-${pad(yesterdayDate.getMonth() + 1)}-${pad(yesterdayDate.getDate())}`

  const startDate = new Date(yesterdayDate)
  startDate.setHours(0, 0, 0, 0)

  let selectStr = `
    status,
    attendance_sessions ( session_date )
  `
  if (academicYearId) {
    selectStr = `
      status,
      attendance_sessions!inner ( session_date, subjects!inner(academic_year_id) )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate.toISOString())

  if (academicYearId) {
    query = query.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getAttendanceTrendToday] error:', error)
    return {
      todayPresent: 0, todayTotal: 0, todayRate: 0,
      yesterdayPresent: 0, yesterdayTotal: 0, yesterdayRate: 0,
      deltaRate: 0
    }
  }

  let todayPresent = 0
  let todayTotal = 0
  let yesterdayPresent = 0
  let yesterdayTotal = 0

  ;(data || []).forEach((row: any) => {
    const sessionDate = row.attendance_sessions?.session_date || ''
    if (sessionDate === today) {
      todayTotal++
      if (row.status === 'PRESENT') todayPresent++
    } else if (sessionDate === yesterday) {
      yesterdayTotal++
      if (row.status === 'PRESENT') yesterdayPresent++
    }
  })

  const todayRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0
  const yesterdayRate = yesterdayTotal > 0 ? Math.round((yesterdayPresent / yesterdayTotal) * 100) : 0

  return {
    todayPresent,
    todayTotal,
    todayRate,
    yesterdayPresent,
    yesterdayTotal,
    yesterdayRate,
    deltaRate: todayRate - yesterdayRate,
  }
}

export const getCheckedHomeroomClassroomsToday = async (academicYearId?: string): Promise<CheckedHomeroomTodayResult> => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  let query = supabase
    .from('homeroom_attendance')
    .select(`
      students (
        classrooms ( level, room )
      )
    `)
    .eq('attendance_date', today)

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[getCheckedHomeroomClassroomsToday] error:', error)
    return { checkedClassroomCount: 0, checkedClassrooms: [] }
  }

  const set = new Set<string>()
  ;(data || []).forEach((row: any) => {
    const classroom = row.students?.classrooms
    if (!classroom) return
    set.add(`${classroom.level}/${classroom.room}`)
  })

  const checkedClassrooms = Array.from(set).sort((a, b) => a.localeCompare(b))
  return {
    checkedClassroomCount: checkedClassrooms.length,
    checkedClassrooms
  }
}

export const getPendingClassroomChecksToday = async (academicYearId?: string): Promise<PendingClassroomCheckResult> => {
  const now = new Date()
  const jsDay = now.getDay() // 0=Sun..6=Sat
  const dayOfWeek = jsDay === 0 ? 7 : jsDay // 1=Mon..7=Sun
  const pad = (n: number) => String(n).padStart(2, '0')
  // ใช้วันที่ local (ไทย) แทน UTC เพื่อให้เทียบ attendance_date ตรงวันจริง
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

  const classroomSelect = academicYearId ? 'classrooms!inner(level, room, academic_year_id)' : 'classrooms(level, room)'
  let scheduleQuery = supabase
    .from('schedules')
    .select(`id, classroom_id, ${classroomSelect}`)
    .eq('day_of_week', dayOfWeek)

  if (academicYearId) {
    // schedules joins classrooms, so filter classrooms by academic_year_id
    scheduleQuery = scheduleQuery.filter('classrooms.academic_year_id', 'eq', academicYearId)
  }

  const { data: todaySchedules } = await scheduleQuery

  if (!todaySchedules || todaySchedules.length === 0) {
    return { pendingClassroomCount: 0, pendingClassrooms: [] }
  }

  const scheduleIds = todaySchedules.map((s: any) => s.id)
  // ตรวจสอบผ่าน attendance_sessions (มี schedule_id และ session_date จริง)
  let checkedSessionScheduleIds: string[] = []
  try {
    console.debug('[getPendingClassroomChecksToday] today=', today, 'scheduleIds=', scheduleIds)
    const res = await supabase
      .from('attendance_sessions')
      .select('schedule_id')
      .in('schedule_id', scheduleIds)
      .eq('session_date', today)
    if (res.error) {
      console.error('[getPendingClassroomChecksToday] supabase error:', res.error)
    }
    checkedSessionScheduleIds = (res.data || []).map((r: any) => r.schedule_id)
  } catch (err) {
    console.error('[getPendingClassroomChecksToday] unexpected error:', err)
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
  checkedSessionScheduleIds.forEach((scheduleId) => {
    const classroomLabel = scheduleToClassroom.get(scheduleId)
    if (classroomLabel) checkedClassroomsSet.add(classroomLabel)
  })

  const pendingClassrooms = Array.from(allClassroomsSet).filter((room) => !checkedClassroomsSet.has(room)).sort((a, b) => a.localeCompare(b))
  return {
    pendingClassroomCount: pendingClassrooms.length,
    pendingClassrooms,
  }
}

export const getAnalyticsData = async (
  timeFilter: string = 'month',
  academicYearId?: string,
  teacherId?: string
) => {
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

  let selectStr = `
    id, checkin_time, status,
    students ( student_code, first_name, last_name, classrooms(level, room) ),
    attendance_sessions ( session_date, subjects(subject_name) )
  `
  if (teacherId) {
    selectStr = `
      id, checkin_time, status,
      students!inner ( student_code, first_name, last_name, classroom_id, classrooms(level, room) ),
      attendance_sessions ( session_date, subjects(subject_name) )
    `
    if (academicYearId) {
      selectStr = `
        id, checkin_time, status,
        students!inner ( student_code, first_name, last_name, classroom_id, classrooms(level, room) ),
        attendance_sessions!inner ( session_date, subjects!inner(subject_name, academic_year_id) )
      `
    }
  } else if (academicYearId) {
    selectStr = `
      id, checkin_time, status,
      students ( student_code, first_name, last_name, classrooms(level, room) ),
      attendance_sessions!inner ( session_date, subjects!inner(subject_name, academic_year_id) )
    `
  }

  let query = supabase
    .from('attendance')
    .select(selectStr)
    .gte('checkin_time', startDate.toISOString())

  if (academicYearId) {
    query = query.eq('attendance_sessions.subjects.academic_year_id', academicYearId)
  }

  if (teacherId) {
    const teacherClassroomIds = await getTeacherClassroomIds(teacherId, academicYearId)
    if (teacherClassroomIds.length === 0) return { chartData: [], pieData: [], rawAttendance: [] }
    query = query.in('students.classroom_id', teacherClassroomIds)
  }

  const { data: rawAttendance } = await query
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
