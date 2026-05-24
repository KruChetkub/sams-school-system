# Development Plan: School Attendance Management System (SAMS) - Version 9
## สรุปการอัปเดตล่าสุด + Baseline สำหรับพัฒนาต่อจาก V8

เอกสารนี้สรุปงานที่พัฒนาเพิ่มเติมในรอบล่าสุด เพื่อใช้เป็น baseline ของ V9 โดยเน้น 4 แกนหลัก: UI Consistency, Executive Dashboard, Theme System, และ UX Loading Flow

---

## 1) สถานะความสำเร็จในรอบล่าสุด (V9 Completed)

### 1.1 Schedule + Attendance Color Consistency
- [x] ปรับหน้า `จัดการตารางเรียน (Schedules)` ให้การ์ดวิชาใช้สีแบบ gradient แยกตามรายวิชา
- [x] ผูกสีแบบ deterministic (hash จาก `subject_id + subject_code`) เพื่อให้วิชาเดิมได้สีเดิมเสมอ
- [x] ทำให้หน้า `เช็คชื่อรายวิชา (Classroom Attendance)` ใช้ palette/logic เดียวกันกับ Schedules
- [x] เพิ่มธีมตารางใน Classroom Attendance (เลือกได้เหมือน Schedules)
- [x] ทำให้ธีมตาราง Schedules และ Attendance จำค่าบนเครื่อง (`localStorage`)

ไฟล์ที่แก้:
- `src/pages/Schedules.tsx`
- `src/pages/Attendance.tsx`

### 1.2 Homeroom Visual Upgrade
- [x] เพิ่มสี gradient แยกตามห้องเรียนในหน้า `เช็คชื่อเข้าแถว (Homeroom)`
- [x] ผูกสีแบบ deterministic ตาม `classroom_id + classroom_label` เพื่อแยกห้องได้ชัดเจน

ไฟล์ที่แก้:
- `src/pages/Homeroom.tsx`

### 1.3 Executive Dashboard: Daily Summary by Selected Date
- [x] เพิ่มบล็อก `สรุปสถานะนักเรียนตามวันที่เลือก`
- [x] เพิ่ม date selector แบบไทย (`วว/ดด/ปปปป` + ปฏิทินไทย)
- [x] ปรับให้เปลี่ยนค่าหลังกรอกเสร็จ (`Enter`/`blur`) หรือเลือกจากปฏิทิน
- [x] แก้ timezone/date shift bug (เลิกใช้ `toISOString()` ในจุดที่ทำให้วันคลาดเคลื่อน)
- [x] แยกสรุปเป็น 2 ส่วน:
  - `1. สรุปรายวิชา` (จาก classroom attendance)
  - `2. สรุปเข้าแถว` (จาก homeroom attendance)
- [x] เพิ่มพื้นหลัง gradient ให้บล็อกสรุป และเพิ่ม gradient แยกแต่ละส่วนย่อย
- [x] ซ่อนชั่วคราว 3 บล็อก analytics เดิม:
  - อัตราเข้าเรียนวันนี้ เทียบเมื่อวาน
  - Top 5 ห้องเสี่ยง
  - อัตราการเข้าเรียนเฉลี่ย

ไฟล์ที่แก้:
- `src/pages/Dashboard.tsx`
- `src/services/dashboardService.ts`

### 1.4 Theme & Branding (System Settings) Expansion
- [x] เพิ่มตัวเลือกธีม gradient ใน `Appearance > Theme & Branding`
- [x] เพิ่มธีมโทนเข้มอีก 4 สี:
  - `Midnight Ink`
  - `Royal Velvet`
  - `Ember Night`
  - `Aurora Deep`
- [x] รองรับการแสดง gradient ทั้งระบบผ่าน CSS vars (`--app-bg`, `--app-bg-image`)
- [x] แก้ bug `type=color` รับค่า gradient key ไม่ได้ (เช่น `grad_royal`) โดย map เป็น fallback hex

ไฟล์ที่แก้:
- `src/pages/Settings.tsx`
- `src/App.tsx`
- `src/index.css`

### 1.5 Theme Sync Across Devices (with Safe Fallback)
- [x] เพิ่ม logic พยายามอ่าน/เขียน `theme_bg` จากตาราง `users` เพื่อรองรับข้ามเครื่อง
- [x] ถ้า schema ยังไม่รองรับคอลัมน์ `theme_bg` จะ fallback local ได้โดยไม่ทำให้ระบบพัง
- [x] เลี่ยง query ที่เสี่ยง 400 (`select=theme_bg`) ด้วยแนวทาง safe detect

หมายเหตุ schema:
- ถ้าต้องการ sync ข้ามเครื่องจริง 100% ต้องมีคอลัมน์ `theme_bg` ใน `users`
- SQL แนะนำ:
  - `alter table public.users add column if not exists theme_bg text;`

### 1.6 Login / Logout UX Animation
- [x] เพิ่ม full-screen glass loading overlay ตอน `กำลังเข้าสู่ระบบ...`
- [x] เพิ่ม full-screen glass loading overlay ตอน `กำลังออกจากระบบ...`
- [x] ปรับความรู้สึกให้ลื่นขึ้นด้วย minimum loading overlay time สั้น (`~250ms`)

ไฟล์ที่แก้:
- `src/pages/Login.tsx`
- `src/App.tsx`

### 1.7 Perceived Performance Improvements
- [x] ปรับโหลดธีมให้ใช้ค่าท้องถิ่นก่อน แล้ว sync จาก DB แบบ background
- [x] ปรับบาง query ใน Dashboard ให้ไม่ block first render ทั้งหมด
- [x] เพิ่ม `staleTime` และปิด `refetchOnWindowFocus` ในหลาย query เพื่อลดโหลดกระชาก

ไฟล์ที่แก้:
- `src/App.tsx`
- `src/pages/Dashboard.tsx`

---

## 2) Stability Check (V9)

- [x] `npm run build` ผ่านหลังทุกกลุ่มการแก้ไขสำคัญ
- [x] ฟีเจอร์เดิมไม่ถูกลบแบบแตกหัก (ทำแบบ additive และ hide เฉพาะที่ร้องขอ)
- [x] ระบบยังทำงานได้แม้ฐานข้อมูลยังไม่มี `users.theme_bg` (fallback local)

Known Warning (ไม่ใช่ error):
- bundle size > 500kb (ยังเป็น warning เดิม)

---

## 3) Baseline มาตรฐานสำหรับงานถัดไป

### 3.1 Color System Governance
- ใช้ deterministic mapping สำหรับสีรายวิชา/รายห้องต่อไป
- หากเพิ่ม palette ใหม่ ต้องใช้ชุดเดียวกันในหน้าที่เกี่ยวข้องเพื่อรักษา consistency

### 3.2 Dashboard Data Governance
- สรุป `รายวิชา` ให้ยึดข้อมูลจาก `attendance_sessions` + `attendance`
- สรุป `เข้าแถว` ให้ยึดข้อมูลจาก `homeroom_attendance`
- ทุกจุดเลือกวันที่ ต้องระวัง timezone และหลีกเลี่ยงการแปลงวันที่ด้วย UTC หากทำให้ day shift

### 3.3 Theme Persistence Governance
- localStorage ใช้เป็น fallback เสมอ
- ถ้าต้องการข้ามเครื่องจริง ให้ migration `users.theme_bg` เป็น requirement

### 3.4 UX/Performance Governance
- Loader animation ควรสั้นและไม่ block เกินจำเป็น
- Query ในหน้า dashboard ควรจัดลำดับ critical/non-critical ให้ชัด

---

## 4) แผนพัฒนาต่อ (V9 Next)

### Priority A: Theme Sync Completion
- [ ] ทำ migration `users.theme_bg` ในทุก environment
- [ ] เพิ่ม validation สี/gradient key ฝั่ง service

### Priority B: Dashboard Reactivation Plan
- [ ] เมื่อพร้อมใช้งาน ให้นำ 3 บล็อก analytics ที่ซ่อนอยู่กลับมาแบบ feature flag
- [ ] แยก skeleton loading ราย section แทน loading ทั้งหน้า

### Priority C: Reporting Continuation
- [ ] CSV ภาษาไทยพร้อม BOM
- [ ] PDF รายงานภาษาไทยมาตรฐานโรงเรียน

### Priority D: RLS Rollout Continuation
- [ ] เดินตาม V6 checklist แบบเป็น phase
- [ ] ทดสอบ role-based smoke test ทุกครั้งหลังเพิ่ม policy

---

## 5) Acceptance Checklist สำหรับ V9 Baseline

- [x] สีรายวิชา Schedules/Attendance สอดคล้องกัน
- [x] Homeroom มี gradient แยกห้องชัดเจน
- [x] Dashboard สรุปตามวันที่เลือก + แยกสองหัวข้อ
- [x] Theme gradient เพิ่มและใช้งานได้จริง
- [x] Login/Logout มี loading animation ที่ลื่นขึ้น
- [x] โค้ด build ผ่าน ไม่พัง

---

## 6) ไฟล์ที่มีการเปลี่ยนแปลงสำคัญในรอบนี้

- `src/pages/Schedules.tsx`
- `src/pages/Attendance.tsx`
- `src/pages/Homeroom.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Settings.tsx`
- `src/pages/Login.tsx`
- `src/services/dashboardService.ts`
- `src/App.tsx`
- `src/index.css`
