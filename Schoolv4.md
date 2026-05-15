# Development Plan: School Attendance Management System (SAMS) - Version 4
## แผนการพัฒนาและประวัติการอัปเดตระบบ (อ้างอิงจาก Schoolv3.md)

ไฟล์นี้เป็นจุด Checkpoint สำหรับอ้างอิงสถานะล่าสุดของโปรเจกต์ เพื่อให้ AI หรือนักพัฒนาคนต่อไปสามารถอ่านและทำงานต่อยอดได้อย่างราบรื่น

---

### 🟢 สรุปฟีเจอร์ที่เพิ่งพัฒนาเสร็จสิ้น (Recent Accomplishments in V4)
**Session วันที่: 15 พฤษภาคม 2569**

1. **Reports & Analytics — แท็บข้อมูลจริงครบ 3 แท็บ**:
    - พัฒนา `dashboardService.ts` เพิ่ม 3 ฟังก์ชันใหม่:
      - `getClassroomReport(timeFilter)` — ดึงสถิติการเข้าเรียนแยกตามห้องเรียน
      - `getStudentReport(timeFilter, classroomId?)` — ดึงสถิติรายบุคคล (รองรับ filter ห้องเรียน)
      - `getSubjectReport(timeFilter)` — ดึงสถิติแยกตามรายวิชา
      - `getStartDate(timeFilter)` — Helper function คำนวณ startDate แบบ centralized
    - พัฒนา `Reports.tsx` ให้แท็บ **รายห้องเรียน / รายบุคคล / รายวิชา** แสดงตารางข้อมูลจริง
    - แต่ละแท็บ Lazy Load (ดึงข้อมูลเฉพาะเมื่อกดเข้า) ลด API calls
    - ตัวกรองเวลา (วันนี้, สัปดาห์, เดือน, เทอม, ทั้งปี) ทำงานกับทุกแท็บ
    - มี Loading Spinner และ Empty State แสดงผลอย่างถูกต้อง
    - คอลัมน์ % มาเรียน แสดงด้วย Badge สี (🟢 ≥80% / 🟡 ≥60% / 🔴 <60%)

2. **RBAC — เพิ่มสิทธิ์เมนูสำหรับครู**:
    - เพิ่มเมนู **"จัดตารางเรียน" (`/schedules`)** ให้ TEACHER เห็นและเข้าใช้ได้ (เดิมเป็น ADMIN-only)
    - ย้ายเมนู **"รายงานสรุป"** ไปอยู่ล่างสุดของ Sidebar เพื่อ UX ที่ดีกว่า

3. **Bug Fix — Label ห้องเรียนซ้ำซ้อน**:
    - แก้บั๊ก `"ม.ม.1/4"` → `"ม.1/4"` เกิดจากโค้ดเติม `"ม."` ซ้ำทั้งที่ DB เก็บ `level = "ม.1"` อยู่แล้ว
    - แก้ไขใน `getClassroomReport` และ `getStudentReport`

4. **CI/CD — Deploy อัตโนมัติ**:
    - Push ทุก commit ขึ้น GitHub (`KruChetkub/sams-school-system`) branch `main`
    - Vercel เชื่อมต่อและ auto-deploy ทุกครั้งที่ push

---

### 🟡 สถานะการพัฒนาแบ่งตาม Phase (ปัจจุบัน)

#### Phase 1: Foundation & Core Data Management
*สถานะ: เสร็จสมบูรณ์ (100%)*
- [x] Project Setup (React, Vite, Tailwind, Zustand, React Query)
- [x] Database & Backend (Supabase, Tables, RLS)
- [x] Authentication Module & RBAC
- [x] Core CRUD: บุคลากร, นักเรียน, ห้องเรียน, วิชาเรียน
- [x] แก้ไขบั๊กการเพิ่มบัญชีครู (RPC Fix)

#### Phase 2: Scheduling & Basic Attendance
*สถานะ: เสร็จสมบูรณ์ (100%)*
- [x] ระบบจัดตารางเรียน / ตารางสอน (ครูเข้าถึงได้แล้ว)
- [x] หน้าเช็คชื่อเข้าแถว (Homeroom)
- [x] หน้าเช็คชื่อรายวิชา (Attendance)
- [x] Executive Dashboard สำหรับผู้บริหาร

#### Phase 3: Smart Attendance & Anti-Cheat
*สถานะ: Deferred (ระงับชั่วคราว)*
- [x] Dynamic QR Code
- [x] หน้านักเรียนสแกน QR
- [ ] GPS + IP Validation (ยังไม่เปิดใช้งาน)

#### Phase 4: Leave Management & Notifications
*สถานะ: Paused (ระงับชั่วคราว)*
- [x] UI การลาเบื้องต้น
- [x] Parent Dashboard
- [ ] เมนู "ระบบการลา" ถูกซ่อนใน `App.tsx` รอพัฒนาต่อ

#### Phase 5: Reporting, Analytics & Polish
*สถานะ: กำลังดำเนินการ (In Progress ~80%)*
- [x] Dashboard สถิติขั้นสูงสำหรับ Admin
- [x] หน้า Reports — แท็บ: ภาพรวม ✅, รายห้องเรียน ✅, รายบุคคล ✅, รายวิชา ✅
- [x] ตัวกรองเวลา Real-time (วัน, สัปดาห์, เดือน, เทอม, ปี)
- [ ] *สิ่งที่ต้องทำต่อ: Export ข้อมูลเป็น CSV และ PDF อย่างเป็นทางการ (ปุ่มมีแล้ว แต่ยังไม่มี logic)*
- [ ] ระบบ Audit Logs (บันทึกการกระทำของผู้ใช้)

---

### 📁 ไฟล์ที่เกี่ยวข้องและแก้ไขใน Session นี้

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/services/dashboardService.ts` | เพิ่ม `getStartDate`, `getClassroomReport`, `getStudentReport`, `getSubjectReport` + แก้บั๊ก label |
| `src/pages/Reports.tsx` | พัฒนา 3 แท็บให้แสดงตารางข้อมูลจริงพร้อม lazy load |
| `src/App.tsx` | เพิ่มเมนู `/schedules` ให้ TEACHER + ย้าย รายงานสรุป ล่างสุด |

---

### 🚀 สิ่งที่คาดหวังใน Session ต่อไป (Next Steps for Next AI Session)

1. **Export ข้อมูล** — เขียน logic ปุ่ม "ส่งออกเป็น CSV" และ "ส่งออกเป็น PDF" ในแท็บ "ออกรายงาน" ของ Reports.tsx
   - CSV: ใช้ library `xlsx` ที่ติดตั้งไว้แล้วใน package.json
   - PDF: ใช้ `jsPDF` + `autoTable` (ต้องติดตั้งเพิ่ม)
   - ควรให้ Export ข้อมูลจากแท็บที่กำลังดูอยู่ (classroom/student/subject)

2. **RLS Policies** — ตรวจสอบและเพิ่ม Row Level Security บน Supabase เพื่อความปลอดภัยก่อนใช้งานจริง

3. **ระบบการลา (Phase 4)** — เปิดเมนูและพัฒนาต่อเมื่อพร้อม
