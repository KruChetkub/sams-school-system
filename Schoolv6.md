# Development Plan: School Attendance Management System (SAMS) - Version 6
## แผนงานต่อเนื่องจาก V5 + งานที่ทำระหว่าง Session ล่าสุด

เอกสารนี้เป็นแผนดำเนินงานละเอียดสำหรับรอบถัดไป โดยเน้น 3 แกนหลัก:
1) ความพร้อมใช้งานจริงของ Attendance/Homeroom  
2) รองรับวิชาเรียนรวมหลายห้องแบบไม่ทำข้อมูลนักเรียนซ้ำ  
3) ความปลอดภัยข้อมูล (RLS) และความเสถียร production

---

## 1) สถานะล่าสุด (Checkpoint Summary)

### 1.1 สิ่งที่ทำแล้วในรอบล่าสุด
- `Schedules`:
  - เพิ่มมุมมองตารางสอนรายสัปดาห์
  - รองรับย้ายคาบ + สลับคาบ (swap) และอัปเดต Supabase
  - ปรับธีมสี/ความ responsive
  - รองรับเลือกหลายห้องในคาบเดียว (ห้องหลัก + ห้องเสริม)
- `Homeroom`:
  - รองรับแก้ย้อนหลังตาม role (`ADMIN` ทั้งหมด, `TEACHER` ภายในช่วงกำหนด)
  - เพิ่มการ์ดสถานะห้อง (เช็คแล้ว/ยังไม่เช็ค + สรุป มา/ขาด/สาย/ลา/คงเหลือ)
  - เพิ่ม scroll UX (เลือกห้องแล้วเลื่อนลง, บันทึกเสร็จเลื่อนขึ้น)
- `Attendance`:
  - ปรับเป็นตารางเลือกคาบแบบ visual
  - รองรับแก้ย้อนหลังตาม role
  - ปรับ responsive + สีรายวิชาแบบ deterministic
  - ดึงนักเรียนจากหลายห้องในคาบเดียว (จาก metadata ใน schedule)
- `Students`:
  - ปรับ error duplicate ให้บอก “รหัสซ้ำกับใคร”
  - เพิ่ม flow “ค้นหาแล้วย้ายห้อง” โดยไม่ต้องสร้างนักเรียนใหม่
  - เพิ่ม flow “เพิ่มนักเรียนเข้ารายวิชาเรียนรวม (ไม่ย้ายห้องหลัก)”
  - เพิ่ม modal confirm สำหรับปุ่มเพิ่ม/ลบสมาชิกในรายวิชาเรียนรวม

### 1.2 ปัญหาที่ยังค้าง/ต้องเก็บงาน
- ฝั่ง Supabase ยังต้องรัน SQL ตารางเชื่อม `student_group_memberships` ก่อนใช้งานเต็ม
- ตารางรายชื่อนักเรียนล่าง (`รายชื่อนักเรียนทั้งหมด`) ต้องยืนยัน behavior ให้ตรงกับตัวกรอง “กลุ่มรายวิชาเรียนรวม” ทุกเคส
- ต้องเชื่อม Attendance ให้ใช้รายชื่อจาก `student_group_memberships` สำหรับคาบที่เป็น “วิชาเรียนรวม” แบบสมบูรณ์

---

## 2) เป้าหมาย V6 (Definition of Done)

### Goal A: วิชาเรียนรวมใช้งานจริง end-to-end
- [ ] เลือกรายวิชาในหน้า Students แล้วเพิ่ม/ลบสมาชิกได้เสถียร
- [ ] รายชื่อนักเรียนทั้งหมดแสดงสถานะกลุ่มรวมถูกต้อง
- [ ] หน้า Attendance ดึงนักเรียนจากกลุ่มรายวิชา (ถ้ามี) ก่อน fallback ไปห้องหลัก/ห้องเสริม
- [ ] รายงานและ dashboard ไม่เพี้ยนจากการเพิ่มกลุ่มรายวิชา

### Goal B: Export รายงานพร้อมใช้งาน
- [ ] Export CSV ใช้งานจริงทุกแท็บหลักใน Reports
- [ ] Export PDF ใช้งานจริง (format อ่านง่าย)

### Goal C: Security + Production Hardening
- [ ] เปิด RLS ตาม checklist แบบ phased (อ้างอิง `Schoolv6checklist RLS.md`)
- [ ] ไม่เกิด regression ในหน้า core

---

## 3) แผนงานละเอียด (Work Breakdown)

## Phase 1: ปิดงานกลุ่มรายวิชาเรียนรวม (สำคัญสุด)

### 3.1 Database / Supabase
- [ ] รัน SQL:
  - `supabase_student_group_memberships.sql`
- [ ] ยืนยันว่าตาราง REST endpoint ใช้ได้ (ไม่มี 404)
- [ ] เพิ่ม RLS policy ขั้นต่ำเฉพาะตารางนี้:
  - `ADMIN`: read/write
  - `TEACHER`: read/write (หรือ scope ตามนโยบายโรงเรียน)

### 3.2 Students UI/UX
- [ ] ตรวจ flow:
  - เลือกรายวิชา
  - เลือกห้องก่อนแสดงรายชื่อ
  - เพิ่มสมาชิก
  - ลบสมาชิก
  - modal confirm ทั้งเพิ่ม/ลบ
- [ ] เพิ่มสถานะ loading/progress ในปุ่มเพิ่ม/ลบ (กันกดซ้ำ)
- [ ] เพิ่มข้อความ empty state ให้ชัดเจนขึ้นเมื่อยังไม่เลือกห้อง/ไม่มีรายชื่อ

### 3.3 Data Consistency (รายการล่าง)
- [ ] `รายชื่อนักเรียนทั้งหมด`:
  - แสดง badge “กลุ่มรวม” จาก membership จริง
  - ตัวกรอง `-- กลุ่มรายวิชาเรียนรวม --` แสดงถูกต้อง
- [ ] ทดสอบกรณี:
  - นักเรียน 1 คนอยู่หลายรายวิชา
  - นักเรียนไม่มีห้องหลัก แต่มี membership
  - ลบ membership แล้ว badge หายทันที

---

## Phase 2: Attendance เชื่อมกลุ่มรายวิชาเต็มรูปแบบ

### 3.4 Attendance Service
- [ ] ปรับ `getStudentsForSchedule`:
  - Step 1: หา membership ตาม `schedule.subject_id` (group_type = SUBJECT)
  - Step 2: ถ้ามี membership ใช้รายชื่อจาก membership เป็นหลัก
  - Step 3: ถ้าไม่มี membership fallback ตามห้องหลัก/ห้องเสริมเดิม

### 3.5 Attendance UI
- [ ] เพิ่ม hint ในคาบที่ใช้รายชื่อจาก “กลุ่มรายวิชา”
- [ ] ยืนยันว่าการบันทึกยังเข้าตาราง attendance เดิม (ไม่แตก schema)
- [ ] ทดสอบย้อนหลัง + role permission ครบ

---

## Phase 3: Reports Export (CSV/PDF)

### 3.6 CSV Export
- [ ] Export ตามแท็บปัจจุบัน (overview/classroom/student/subject/homeroom)
- [ ] ชื่อไฟล์มีวันที่และแท็บ
- [ ] Encoding ภาษาไทยอ่านได้ใน Excel

### 3.7 PDF Export
- [ ] ติดตั้งและเชื่อม `jsPDF` + `autoTable`
- [ ] ออกแบบหัวรายงานมาตรฐานโรงเรียน
- [ ] ทดสอบข้อมูลยาว/หลายหน้า

---

## Phase 4: RLS Rollout (อ้างอิง checklist)

### 3.8 เริ่มจาก Core tables
- [ ] users / teachers / classrooms / subjects / students
- [ ] schedules / attendance_sessions / attendance / homeroom_attendance
- [ ] student_group_memberships (ใหม่)

### 3.9 Smoke Test ทุก role
- [ ] ADMIN
- [ ] TEACHER
- [ ] STUDENT
- [ ] PARENT

---

## 4) ไฟล์ที่คาดว่าจะเกี่ยวข้องในรอบถัดไป

- `src/pages/Students.tsx`
- `src/services/studentGroupService.ts`
- `src/services/attendanceService.ts`
- `src/pages/Attendance.tsx`
- `src/pages/Reports.tsx`
- `src/services/dashboardService.ts`
- `supabase_student_group_memberships.sql`
- (RLS SQL migrations ตาม phase)

---

## 5) Risk & Guardrails

- ห้ามสร้างนักเรียนซ้ำเพื่อย้ายกลุ่ม (ใช้ membership แทน)
- ทุกการเพิ่ม/ลบสมาชิกกลุ่มต้องไม่กระทบ `students.classroom_id`
- ถ้ายังไม่รัน SQL membership จะเกิด 404 (ต้องแจ้งใน release note)
- เปลี่ยนทีละ phase พร้อม build + smoke test ทุกครั้ง

---

## 6) Acceptance Checklist (ก่อนปิด V6)

- [ ] ไม่พบ 404 ของ `student_group_memberships`
- [ ] เพิ่ม/ลบสมาชิกวิชาเรียนรวมได้จริงจากหน้า Students
- [ ] Attendance ดึงรายชื่อถูกต้องตามวิชาเรียนรวม
- [ ] Export CSV/PDF ใช้ได้
- [ ] RLS phase core ผ่านโดยไม่พังหน้าใช้งาน
- [ ] build production ผ่าน และตรวจ regression หน้าหลักครบ

