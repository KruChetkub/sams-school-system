# Graph Report - D:\sams-school-system-main\frontend  (2026-06-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 631 nodes · 998 edges · 37 communities (29 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 1.0)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication and Dashboards|Authentication and Dashboards]]
- [[_COMMUNITY_Database Schema and Security|Database Schema and Security]]
- [[_COMMUNITY_Classroom and Schedule Management|Classroom and Schedule Management]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Attendance Analytics and Reporting|Attendance Analytics and Reporting]]
- [[_COMMUNITY_SAMS Development Guide|SAMS Development Guide]]
- [[_COMMUNITY_Leave and Parent Management|Leave and Parent Management]]
- [[_COMMUNITY_Visit Form Components|Visit Form Components]]
- [[_COMMUNITY_Student Portfolio Management|Student Portfolio Management]]
- [[_COMMUNITY_Student Assessment Dashboard|Student Assessment Dashboard]]
- [[_COMMUNITY_Student Management Database|Student Management Database]]
- [[_COMMUNITY_Homeroom UI Logic|Homeroom UI Logic]]
- [[_COMMUNITY_Application TypeScript Configuration|Application TypeScript Configuration]]
- [[_COMMUNITY_Academic Year Management|Academic Year Management]]
- [[_COMMUNITY_Node TypeScript Configuration|Node TypeScript Configuration]]
- [[_COMMUNITY_System Documentation|System Documentation]]
- [[_COMMUNITY_Attendance Calendar Logic|Attendance Calendar Logic]]
- [[_COMMUNITY_User and Theme Settings|User and Theme Settings]]
- [[_COMMUNITY_Implementation and Update Plan|Implementation and Update Plan]]
- [[_COMMUNITY_Teacher Dashboard Services|Teacher Dashboard Services]]
- [[_COMMUNITY_Project Implementation Roadmap|Project Implementation Roadmap]]
- [[_COMMUNITY_Smart School Platform Components|Smart School Platform Components]]
- [[_COMMUNITY_Student Activity Service|Student Activity Service]]
- [[_COMMUNITY_Core Application Files|Core Application Files]]
- [[_COMMUNITY_Admin and Teacher Data|Admin and Teacher Data]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Vercel Routing Config|Vercel Routing Config]]
- [[_COMMUNITY_Hero Image Assets|Hero Image Assets]]
- [[_COMMUNITY_PWA App Icons|PWA App Icons]]
- [[_COMMUNITY_PWA Large Icon|PWA Large Icon]]
- [[_COMMUNITY_Branding Assets|Branding Assets]]

## God Nodes (most connected - your core abstractions)
1. `supabase` - 47 edges
2. `useAcademicYearStore` - 31 edges
3. `ตารางที่เกี่ยวข้อง` - 30 edges
4. `useAuthStore` - 29 edges
5. `compilerOptions` - 17 edges
6. `compilerOptions` - 16 edges
7. `Phane — คู่มือสรุปสำหรับนักพัฒนาและ AI ในการต่อยอดระบบ SAMS` - 14 edges
8. `🔐 แผนเปิดใช้งาน Row Level Security (RLS) — ระบบ SAMS` - 13 edges
9. `Student360()` - 8 edges
10. `getStartDate()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Changelog - Smart School Platform` --references--> `Dashboard Component`  [EXTRACTED]
  CHANGELOG.md → frontend/src/pages/Dashboard.tsx
- `Changelog - Smart School Platform` --references--> `Portal Component`  [EXTRACTED]
  CHANGELOG.md → frontend/src/pages/portal/Portal.tsx
- `Dashboard()` --calls--> `useAcademicYearStore`  [EXTRACTED]
  src/pages/Dashboard.tsx → src/store/academicYearStore.ts
- `Parents()` --calls--> `useAcademicYearStore`  [EXTRACTED]
  src/pages/Parents.tsx → src/store/academicYearStore.ts
- `Settings()` --calls--> `useAuthStore`  [EXTRACTED]
  src/pages/Settings.tsx → src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (37 total, 8 thin omitted)

### Community 0 - "Authentication and Dashboards"
Cohesion: 0.07
Nodes (35): HomeVisitDashboard(), supabase, Reports(), Subjects(), Portal(), translations, AuditLogInput, getIpAddress() (+27 more)

### Community 1 - "Database Schema and Security"
Cohesion: 0.05
Nodes (48): 1.1 ตาราง `academic_years`, 1.2 ตาราง `semesters`, 1.3 ตาราง `subjects`, 1. ภาพรวมระบบและ Role, 2.1 ตาราง `users`, 2.1 หลักคิด, 2.2 Helper Function สำหรับตรวจ Role, 2.2 ตาราง `teachers` (+40 more)

### Community 2 - "Classroom and Schedule Management"
Cohesion: 0.07
Nodes (30): classroomCardPalettes, Classrooms(), CALENDAR_THEMES, DAYS, DEFAULT_TIME_SLOTS, Classroom, createClassroom(), deleteClassroom() (+22 more)

### Community 3 - "Project Dependencies"
Cohesion: 0.04
Nodes (44): dependencies, html2canvas, html5-qrcode, html-to-image, leaflet, lottie-react, lucide-react, qrcode.react (+36 more)

### Community 4 - "Attendance Analytics and Reporting"
Cohesion: 0.08
Nodes (38): Dashboard(), AttendanceDailyRatePoint, AttendanceStatusSummaryByDate, AttendanceTrendTodayResult, CheckedHomeroomTodayResult, ClassroomReportRow, getAnalyticsData(), getAttendanceDailyRates() (+30 more)

### Community 5 - "SAMS Development Guide"
Cohesion: 0.05
Nodes (36): 1. สร้าง Service ก่อน Page เสมอ, 2. Service Pattern มาตรฐาน, 3. Page Pattern มาตรฐาน, 4. เพิ่ม Route ใน App.tsx, 5. ถ้าเพิ่มเมนูใหม่ใน Sidebar, 6. ถ้าต้องการ Layout แยก (เช่น ระบบย่อยใหม่), Commands, Deploy (+28 more)

### Community 6 - "Leave and Parent Management"
Cohesion: 0.11
Nodes (25): Parents(), getLeaveRequests(), submitLeaveRequest(), updateLeaveStatus(), assignParentToStudent(), createParent(), deleteParent(), getParents() (+17 more)

### Community 7 - "Visit Form Components"
Cohesion: 0.11
Nodes (19): SignaturePadProps, FormData, INITIAL_FORM_DATA, VisitForm(), icons, VisitMapProps, compressImage(), createHomeVisit() (+11 more)

### Community 8 - "Student Portfolio Management"
Cohesion: 0.10
Nodes (22): categories, pad(), parseThaiBEInputDate(), thaiMonths, thaiWeekdays, createPortfolioItem(), deletePortfolioItem(), getPortfolioSummary() (+14 more)

### Community 9 - "Student Assessment Dashboard"
Cohesion: 0.07
Nodes (26): ✅ 1.1 EqAssessment Interface — V14 Dimension Fields, ✅ 1.2 calculateEqScore() — เกณฑ์ V14 (139–168), ✅ 2.1 Helper Functions (Module-level — ไม่อยู่ใน Component), ✅ 2.2 ตัวแปรใน Component (หลัง profile destructuring), ✅ 2.3 SDQ_EQ Tab — 4 Sections, ✅ 3.1 State เพิ่มเติม, ✅ 3.2 Computed Variables (จาก students state ที่มีอยู่แล้ว), ✅ 3.3 V14 Charts Row (5-column grid) (+18 more)

### Community 10 - "Student Management Database"
Cohesion: 0.07
Nodes (26): 10. ตาราง `public.attendance`, 11. ตาราง `public.homeroom_attendance`, 12. ตาราง `public.leave_requests`, 13. ตาราง `public.home_visits` (และตารางพ่วง `home_visit_assessments`, `home_visit_photos`), 14. ตารางคัดกรองช่วยเหลือ (`student_support_sdq`, `student_support_eq`, `student_support_risk_analysis`), 15. ตารางบริหารความสัมพันธ์และสมาชิกย่อย (`student_group_memberships`, `activity_groups`, `activity_group_members`, `notifications`), 16. ปรับเปลี่ยนคุณสมบัติของวิว `public.active_students`, 1. ตาราง `public.audit_logs` (+18 more)

### Community 11 - "Homeroom UI Logic"
Cohesion: 0.15
Nodes (16): classroomCardPalettes, formatInputDate(), formatThaiBuddhistDate(), getDaysInMonth(), Homeroom(), pad(), thaiMonths, thaiWeekdays (+8 more)

### Community 12 - "Application TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 13 - "Academic Year Management"
Cohesion: 0.19
Nodes (16): formatThaiBEEInputDate(), getDaysInMonth(), pad(), parseThaiBEInputDate(), ThaiDatePicker(), thaiMonths, thaiWeekdays, createAcademicYear() (+8 more)

### Community 14 - "Node TypeScript Configuration"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 15 - "System Documentation"
Cohesion: 0.12
Nodes (16): 1. Prerequisites (สิ่งที่ต้องมี), 2. Installation (การติดตั้ง), 3. Environment Variables (การตั้งค่าตัวแปรแวดล้อม), 4. Running the Application (การรันระบบ), Credits, 🏫 School Attendance Management System (SAMS), Terms of Use (เงื่อนไขเฉพาะ), 🔧 การตั้งค่าระบบหลังบ้านเพิ่มเติม (Configuration & Deployment) (+8 more)

### Community 16 - "Attendance Calendar Logic"
Cohesion: 0.16
Nodes (9): ATTENDANCE_CALENDAR_THEMES, DAYS, formatInputDate(), pad(), thaiMonths, thaiWeekdays, subjectCardPalettes, getStudentsForSchedule() (+1 more)

### Community 17 - "User and Theme Settings"
Cohesion: 0.19
Nodes (9): gradientThemes, Settings(), SettingsTab, themeOptions, adminCreateUser(), adminDeleteUser(), adminUpdateUser(), AppUser (+1 more)

### Community 18 - "Implementation and Update Plan"
Cohesion: 0.17
Nodes (11): 1. ปรับปรุงฐานข้อมูล (Supabase SQL), 2. ปรับปรุงระดับสิทธิ์ฝั่ง React (authStore.ts), 3. ปรับปรุงระดับ Service (userService.ts), 4. ปรับปรุงหน้า UI ตั้งค่าผู้ใช้งาน (Settings.tsx), [MODIFY] [authStore.ts](file:///d:/sams-school-system-main/frontend/src/store/authStore.ts), [MODIFY] [Settings.tsx](file:///d:/sams-school-system-main/frontend/src/pages/Settings.tsx), [MODIFY] [userService.ts](file:///d:/sams-school-system-main/frontend/src/services/userService.ts), การทดสอบด้วยตนเอง (Manual Verification) (+3 more)

### Community 19 - "Teacher Dashboard Services"
Cohesion: 0.33
Nodes (7): getTeacherByUserId(), getTeacherClassrooms(), getTeacherHomeroomToday(), getTeacherHomeVisitProgress(), getTeacherStudentRiskSummary(), getTeacherSubjectAttendanceToday(), TeacherProfile

### Community 20 - "Project Implementation Roadmap"
Cohesion: 0.20
Nodes (10): ✅ Checklist ทดสอบรายเฟส, Checklist ทดสอบหลังเปิด RLS, Phase 0, Phase 1 — Master Data, Phase 2 — บุคลากร, Phase 3 — นักเรียน, Phase 4 — เช็คชื่อ/ลา/เยี่ยมบ้าน, Phase 5 — ดูแลช่วยเหลือ (+2 more)

### Community 21 - "Smart School Platform Components"
Cohesion: 0.22
Nodes (9): Changelog - Smart School Platform, Dashboard Component, Lottie Background, Portal Component, Smart School Platform, Classrooms Table, Supabase, Students Table (+1 more)

### Community 23 - "Core Application Files"
Cohesion: 0.40
Nodes (3): favicon.svg, SAMS, queryClient

## Knowledge Gaps
- **276 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+271 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `Authentication and Dashboards` to `Classroom and Schedule Management`, `Attendance Analytics and Reporting`, `Leave and Parent Management`, `Visit Form Components`, `Student Portfolio Management`, `Homeroom UI Logic`, `Academic Year Management`, `Attendance Calendar Logic`, `User and Theme Settings`, `Teacher Dashboard Services`, `Student Activity Service`, `Notification Management Service`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `useAcademicYearStore` connect `Authentication and Dashboards` to `Classroom and Schedule Management`, `Attendance Analytics and Reporting`, `Leave and Parent Management`, `Visit Form Components`, `Student Portfolio Management`, `Homeroom UI Logic`, `Academic Year Management`, `Attendance Calendar Logic`, `Teacher Dashboard Services`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Authentication and Dashboards` to `Classroom and Schedule Management`, `Attendance Analytics and Reporting`, `Leave and Parent Management`, `Visit Form Components`, `Student Portfolio Management`, `Homeroom UI Logic`, `Attendance Calendar Logic`, `User and Theme Settings`, `Teacher Dashboard Services`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _276 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication and Dashboards` be split into smaller, more focused modules?**
  _Cohesion score 0.07067307692307692 - nodes in this community are weakly interconnected._
- **Should `Database Schema and Security` be split into smaller, more focused modules?**
  _Cohesion score 0.045068027210884355 - nodes in this community are weakly interconnected._
- **Should `Classroom and Schedule Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06826241134751773 - nodes in this community are weakly interconnected._