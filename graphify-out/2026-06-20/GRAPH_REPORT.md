# Graph Report - D:\sams-school-system-main\frontend  (2026-06-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 658 nodes · 1104 edges · 39 communities (34 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b35a6510`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `supabase` - 48 edges
2. `useAcademicYearStore` - 42 edges
3. `useAuthStore` - 38 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `Phane — คู่มือสรุปสำหรับนักพัฒนาและ AI ในการต่อยอดระบบ SAMS` - 14 edges
7. `🔐 แผนเปิดใช้งาน Row Level Security (RLS) — ระบบ SAMS` - 13 edges
8. `studentSupportService` - 9 edges
9. `ตารางที่เกี่ยวข้อง` - 9 edges
10. `Student360()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Dashboard()` --calls--> `useAcademicYearStore`  [EXTRACTED]
  src/pages/Dashboard.tsx → src/store/academicYearStore.ts
- `LeaveRequests()` --calls--> `useAcademicYearStore`  [EXTRACTED]
  src/pages/LeaveRequests.tsx → src/store/academicYearStore.ts
- `ParentDashboard()` --calls--> `useAuthStore`  [EXTRACTED]
  src/pages/ParentDashboard.tsx → src/store/authStore.ts
- `Parents()` --calls--> `useAcademicYearStore`  [EXTRACTED]
  src/pages/Parents.tsx → src/store/academicYearStore.ts
- `Settings()` --calls--> `useAuthStore`  [EXTRACTED]
  src/pages/Settings.tsx → src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (39 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (30): supabase, Reports(), Students(), ActivityGroup, AuditLogInput, getIpAddress(), logAuditEvent(), closeSession() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (32): classroomCardPalettes, Classrooms(), CALENDAR_THEMES, DAYS, DEFAULT_TIME_SLOTS, formatThai24Hour(), Schedules(), splitTime() (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (38): Dashboard(), AttendanceDailyRatePoint, AttendanceStatusSummaryByDate, AttendanceTrendTodayResult, CheckedHomeroomTodayResult, ClassroomReportRow, getAnalyticsData(), getAttendanceDailyRates() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (19): ReportPrintViewProps, SignaturePadProps, FormData, INITIAL_FORM_DATA, VisitForm(), icons, VisitMapProps, compressImage() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (13): categories, getDaysInMonth(), pad(), parseThaiBEInputDate(), StudentPortfolio(), thaiMonths, thaiWeekdays, createPortfolioItem() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (45): dependencies, html2canvas, html5-qrcode, html-to-image, leaflet, lottie-react, lucide-react, qrcode.react (+37 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (23): Parents(), assignParentToStudent(), createParent(), deleteParent(), getParents(), Parent, addMembership(), getAllMemberships() (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (16): classroomCardPalettes, formatInputDate(), formatThaiBuddhistDate(), getDaysInMonth(), Homeroom(), pad(), thaiMonths, thaiWeekdays (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (25): AcademicYears(), formatThaiBEEInputDate(), getDaysInMonth(), pad(), parseThaiBEInputDate(), ThaiDatePicker(), thaiMonths, thaiWeekdays (+17 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (36): 1. สร้าง Service ก่อน Page เสมอ, 2. Service Pattern มาตรฐาน, 3. Page Pattern มาตรฐาน, 4. เพิ่ม Route ใน App.tsx, 5. ถ้าเพิ่มเมนูใหม่ใน Sidebar, 6. ถ้าต้องการ Layout แยก (เช่น ระบบย่อยใหม่), Commands, Deploy (+28 more)

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (14): Attendance(), ATTENDANCE_CALENDAR_THEMES, DAYS, formatInputDate(), formatThaiBuddhistDate(), getDaysInMonth(), pad(), subjectCardPalettes (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (9): gradientThemes, Settings(), SettingsTab, themeOptions, adminCreateUser(), adminDeleteUser(), adminUpdateUser(), AppUser (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (24): HomeVisitDashboard(), HomeVisitLayout(), StudentsList(), getHomeVisitsByTeacher(), TeacherDashboard(), Portal(), getTeacherByUserId(), getTeacherClassrooms() (+16 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (26): ✅ 1.1 EqAssessment Interface — V14 Dimension Fields, ✅ 1.2 calculateEqScore() — เกณฑ์ V14 (139–168), ✅ 2.1 Helper Functions (Module-level — ไม่อยู่ใน Component), ✅ 2.2 ตัวแปรใน Component (หลัง profile destructuring), ✅ 2.3 SDQ_EQ Tab — 4 Sections, ✅ 3.1 State เพิ่มเติม, ✅ 3.2 Computed Variables (จาก students state ที่มีอยู่แล้ว), ✅ 3.3 V14 Charts Row (5-column grid) (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (18): ParentDashboard(), getParentStudents(), getStudentAttendanceSummary(), getStudentHomeVisitInfo(), getStudentLeaveHistory(), getStudentSupportSummary(), BehaviorPoint, behaviorService (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (26): 10. ตาราง `public.attendance`, 11. ตาราง `public.homeroom_attendance`, 12. ตาราง `public.leave_requests`, 13. ตาราง `public.home_visits` (และตารางพ่วง `home_visit_assessments`, `home_visit_photos`), 14. ตารางคัดกรองช่วยเหลือ (`student_support_sdq`, `student_support_eq`, `student_support_risk_analysis`), 15. ตารางบริหารความสัมพันธ์และสมาชิกย่อย (`student_group_memberships`, `activity_groups`, `activity_group_members`, `notifications`), 16. ปรับเปลี่ยนคุณสมบัติของวิว `public.active_students`, 1. ตาราง `public.audit_logs` (+18 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (16): 1. Prerequisites (สิ่งที่ต้องมี), 2. Installation (การติดตั้ง), 3. Environment Variables (การตั้งค่าตัวแปรแวดล้อม), 4. Running the Application (การรันระบบ), Credits, 🏫 School Attendance Management System (SAMS), Terms of Use (เงื่อนไขเฉพาะ), 🔧 การตั้งค่าระบบหลังบ้านเพิ่มเติม (Configuration & Deployment) (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.17
Nodes (11): 1. ปรับปรุงฐานข้อมูล (Supabase SQL), 2. ปรับปรุงระดับสิทธิ์ฝั่ง React (authStore.ts), 3. ปรับปรุงระดับ Service (userService.ts), 4. ปรับปรุงหน้า UI ตั้งค่าผู้ใช้งาน (Settings.tsx), [MODIFY] [authStore.ts](file:///d:/sams-school-system-main/frontend/src/store/authStore.ts), [MODIFY] [Settings.tsx](file:///d:/sams-school-system-main/frontend/src/pages/Settings.tsx), [MODIFY] [userService.ts](file:///d:/sams-school-system-main/frontend/src/services/userService.ts), การทดสอบด้วยตนเอง (Manual Verification) (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (10): 2.1 หลักคิด, 2.2 Helper Function สำหรับตรวจ Role, 2. หลักการออกแบบ RLS Policy, Phase 0 — เตรียมความพร้อม, Phase 4 — ระบบเช็คชื่อ/ลา/เข้าแถว, 📅 Timeline แนะนำ, ขั้นตอน, ตรวจสอบข้อมูลเบื้องต้น (+2 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (10): ✅ Checklist ทดสอบรายเฟส, Checklist ทดสอบหลังเปิด RLS, Phase 0, Phase 1 — Master Data, Phase 2 — บุคลากร, Phase 3 — นักเรียน, Phase 4 — เช็คชื่อ/ลา/เยี่ยมบ้าน, Phase 5 — ดูแลช่วยเหลือ (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (9): 4.1 ตาราง `schedules`, 4.2 ตาราง `attendance_sessions`, 4.3 ตาราง `attendance`, 4.4 ตาราง `homeroom_attendance`, 4.5 ตาราง `leave_requests`, 4.6 ตาราง `home_visits`, 4.7 ตาราง `home_visit_assessments`, 4.8 ตาราง `home_visit_photos` (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (8): 3.1 ตาราง `classrooms`, 3.2 ตาราง `students`, 3.3 ตาราง `student_group_memberships`, 3.4 ตาราง `activity_groups`, 3.5 ตาราง `activity_group_members`, 3.6 ตาราง `student_portfolios`, Phase 3 — ข้อมูลนักเรียนและห้องเรียน, ตารางที่เกี่ยวข้อง

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (8): 5.1 ตาราง `student_support_sdq`, 5.2 ตาราง `student_support_eq`, 5.3 ตาราง `student_support_risk_analysis`, 5.4 ตาราง `student_support_cases`, 5.5 ตาราง `student_support_case_logs`, 5.6 ตาราง `student_behavior_points`, Phase 5 — ระบบดูแลช่วยเหลือนักเรียน, ตารางที่เกี่ยวข้อง

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): 1.1 ตาราง `academic_years`, 1.2 ตาราง `semesters`, 1.3 ตาราง `subjects`, Phase 1 — Master Data (อ่านอย่างเดียว), ขั้นตอนการทำ (ทำทีละตาราง), ตารางที่เกี่ยวข้อง, หลักการ

### Community 33 - "Community 33"
Cohesion: 0.40
Nodes (5): 2.1 ตาราง `users`, 2.2 ตาราง `teachers`, 2.3 ตาราง `parents`, Phase 2 — ข้อมูลบุคลากร, ตารางที่เกี่ยวข้อง

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (4): 6.1 ตาราง `audit_logs`, 6.2 ตาราง `notifications`, Phase 6 — Audit Logs & Notifications, ตารางที่เกี่ยวข้อง

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (3): 1. ภาพรวมระบบและ Role, Role ในระบบ, ตารางทั้งหมดในระบบ (24 ตาราง)

## Knowledge Gaps
- **280 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+275 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 12`, `Community 13`, `Community 14`, `Community 16`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `useAcademicYearStore` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 12`, `Community 14`, `Community 16`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Community 14` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 6`, `Community 7`, `Community 8`, `Community 12`, `Community 13`, `Community 16`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _280 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.059887005649717516 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07751937984496124 - nodes in this community are weakly interconnected._