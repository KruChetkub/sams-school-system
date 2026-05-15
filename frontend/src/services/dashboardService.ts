import { supabase } from '../lib/supabase'

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

export const getAnalyticsData = async () => {
  // ดึงข้อมูลจริงทั้งหมด (จำกัด 1000 รายการล่าสุด)
  const { data: rawAttendance } = await supabase
    .from('attendance')
    .select(`
      id, checkin_time, status,
      students ( student_code, first_name, last_name, classrooms(level, room) ),
      attendance_sessions ( session_date, subjects(subject_name) )
    `)
    .order('checkin_time', { ascending: false })
    .limit(1000)

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
