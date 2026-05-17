# Development Plan: School Attendance Management System (SAMS) - Version 6
## Checklist RLS Rollout (Safe-by-Step)

เอกสารนี้ใช้เป็น checklist สำหรับเปิด Row Level Security (RLS) บน Supabase แบบค่อยเป็นค่อยไป เพื่อไม่ให้ระบบ production ที่ deploy บน Vercel ล่ม

---

## เป้าหมาย
- เปิด RLS ครบทุกตารางสำคัญ
- ให้การใช้งานของ `ADMIN / TEACHER / STUDENT / PARENT / ADVISOR` ไม่พัง
- ลดความเสี่ยงจากการเปิดทีเดียวทั้งระบบ

---

## หลักการทำงาน
- เปิด RLS ทีละตาราง
- สร้าง Policy ให้ครบก่อนใช้งานจริง
- ทดสอบหน้าในระบบทุกครั้งหลังเปิด RLS แต่ละตาราง
- ถ้าเจอหน้า error ให้ rollback ตารางนั้นก่อน (ปิด RLS ชั่วคราวหรือเพิ่ม policy ให้ครบ)

---

## ตารางสำคัญที่ต้องทำก่อน (Core)
1. `users`
2. `teachers`
3. `students`
4. `classrooms`
5. `subjects`
6. `schedules`
7. `attendance_sessions`
8. `attendance`
9. `homeroom_attendance`

## ตารางรอง (หลัง core ผ่าน)
1. `parents`
2. `leave_requests`
3. `notifications`
4. `audit_logs`

---

## Checklist เตรียมก่อนเปิด
- [ ] สำรอง schema/policies ปัจจุบัน (SQL backup)
- [ ] ยืนยันว่ามี role ในตาราง `users` ครบและถูกต้อง
- [ ] ยืนยัน mapping ของ user กับ `teachers/students/parents`
- [ ] เตรียมบัญชีทดสอบอย่างน้อย 1 บัญชีต่อ role
- [ ] เตรียมชุดทดสอบหน้าระบบ (Smoke Test List)

---

## RLS Rollout Checklist (ทีละตาราง)

### Phase A: Master Data Read
- [ ] เปิด RLS ตาราง `users`
  - [ ] Policy: ผู้ใช้เห็น record ตัวเอง
  - [ ] Policy: ADMIN จัดการผู้ใช้ทั้งหมดได้
  - [ ] ทดสอบหน้า Settings > User Management

- [ ] เปิด RLS ตาราง `teachers`
  - [ ] Policy: ADMIN อ่าน/เขียน
  - [ ] Policy: TEACHER อ่านข้อมูลตัวเอง
  - [ ] ทดสอบหน้า Teachers / Sidebar welcome name

- [ ] เปิด RLS ตาราง `classrooms`
  - [ ] Policy: ADMIN/TEACHER อ่าน
  - [ ] Policy: ADMIN เขียน
  - [ ] ทดสอบหน้า Classrooms

- [ ] เปิด RLS ตาราง `subjects`
  - [ ] Policy: ADMIN/TEACHER อ่าน
  - [ ] Policy: ADMIN เขียน
  - [ ] ทดสอบหน้า Subjects / Reports#subject

- [ ] เปิด RLS ตาราง `students`
  - [ ] Policy: ADMIN อ่าน/เขียน
  - [ ] Policy: TEACHER อ่านตามห้องที่เกี่ยวข้อง (ถ้ามีเงื่อนไข)
  - [ ] ทดสอบหน้า Students / Reports#student / Attendance/Homeroom

### Phase B: Schedules & Attendance
- [ ] เปิด RLS ตาราง `schedules`
  - [ ] Policy: ADMIN อ่าน/เขียนทั้งหมด
  - [ ] Policy: TEACHER อ่านเฉพาะ schedule ตัวเอง
  - [ ] ทดสอบหน้า Schedules / Attendance

- [ ] เปิด RLS ตาราง `attendance_sessions`
  - [ ] Policy: ADMIN อ่าน/เขียน
  - [ ] Policy: TEACHER อ่าน session ที่เกี่ยวกับ schedule ตัวเอง
  - [ ] ทดสอบ QR session / Reports / Dashboard analytics

- [ ] เปิด RLS ตาราง `attendance`
  - [ ] Policy: ADMIN อ่าน/เขียน
  - [ ] Policy: TEACHER อ่าน/เขียนเฉพาะ session ตัวเอง
  - [ ] Policy: STUDENT/Parent อ่านเฉพาะข้อมูลตนเอง (ถ้ารองรับ)
  - [ ] ทดสอบหน้า Attendance / Parent Dashboard / Reports / Dashboard

- [ ] เปิด RLS ตาราง `homeroom_attendance`
  - [ ] Policy: ADMIN/TEACHER อ่าน/เขียนตามห้องที่รับผิดชอบ
  - [ ] ทดสอบหน้า Homeroom / Reports#homeroom / Dashboard homeroom card

### Phase C: Secondary Modules
- [ ] เปิด RLS ตาราง `parents`
- [ ] เปิด RLS ตาราง `leave_requests`
- [ ] เปิด RLS ตาราง `notifications`
- [ ] เปิด RLS ตาราง `audit_logs`

---

## Smoke Test หลังเปิดแต่ละตาราง
- [ ] Login ได้ทุก role ทดสอบ
- [ ] Sidebar และ routing ปกติ
- [ ] Dashboard โหลดได้
- [ ] Attendance บันทึกได้
- [ ] Homeroom บันทึกได้ + กันซ้ำทำงาน
- [ ] Reports ทุกแท็บโหลดได้
- [ ] Settings (admin) ใช้งานได้

---

## Rollback Plan
ถ้าเปิด RLS แล้วหน้าพัง:
- [ ] ตรวจ error query ใน Supabase logs
- [ ] เพิ่ม policy ที่ขาด
- [ ] ถ้าระบบใช้งานไม่ได้ ให้ปิด RLS เฉพาะตารางนั้นชั่วคราว
- [ ] บันทึกสาเหตุและ policy ที่แก้ไว้ใน changelog

---

## หมายเหตุ
- ไม่แนะนำเปิด RLS ทุกตารางพร้อมกันในรอบเดียว
- ให้ push policy เป็น migration ทีละชุด และทดสอบทีละ phase
- หลังทุก phase ผ่าน ค่อยประกาศ production-ready RLS
