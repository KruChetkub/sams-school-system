# Development Plan: School Attendance Management System (SAMS) - Version 8
## สรุปการอัปเดตล่าสุด + แนวทางพัฒนาต่อจาก V7

เอกสารนี้บันทึกสิ่งที่อัปเดตแล้วในรอบล่าสุด (วันนี้) เพื่อใช้เป็น baseline สำหรับการพัฒนาต่อไป โดยเน้น 3 แกนหลัก: Mobile UX, Branding, และ PWA Readiness

---

## 1) สถานะความสำเร็จในรอบล่าสุด (V8 Completed)

### 1.1 Classroom Attendance รองรับมือถือ (Mobile-First View)
- [x] เพิ่มมุมมองสำหรับมือถือในหน้า `เช็คชื่อรายวิชา (Classroom Attendance)`
- [x] แสดงรายการคาบเรียนแบบการ์ดบนจอเล็กแทนตารางแนวนอน
- [x] คงมุมมองตารางเดิมไว้สำหรับ Desktop (`hidden md:block`)
- [x] ใช้ state/logic เดิมทั้งหมด (`selectedSchedule`, `attendanceState`) เพื่อไม่กระทบ flow เช็คชื่อ
- [x] การบันทึกยังเชื่อม Supabase ผ่าน service เดิม (`saveClassroomAttendance`) โดยไม่เปลี่ยน behavior

ไฟล์ที่แก้:
- `src/pages/Attendance.tsx`

### 1.2 Rebrand ชื่อระบบเป็น SAMS
- [x] เปลี่ยนชื่อระบบในหน้าเว็บเป็น `SAMS` แล้ว
- [x] เปลี่ยน package name จาก `frontend` เป็น `sams`
- [x] ปรับ lockfile ให้สอดคล้อง

ไฟล์ที่แก้:
- `index.html` (`<title>SAMS</title>`)
- `package.json` (`"name": "sams"`)
- `package-lock.json` (sync ชื่อ package)

หมายเหตุ:
- การเปลี่ยนชื่อ package **ไม่กระทบ** การ deploy บน GitHub/Vercel

### 1.3 เปิดใช้ PWA สำหรับ SAMS
- [x] ติดตั้ง `vite-plugin-pwa`
- [x] ตั้งค่า PWA ใน `vite.config.ts` พร้อม manifest
- [x] ตั้งค่า `registerType: 'autoUpdate'`
- [x] ตั้งค่า `navigateFallback: '/index.html'` สำหรับ SPA routes
- [x] เพิ่มไอคอน PWA ขนาด 192x192 และ 512x512

ไฟล์ที่แก้:
- `vite.config.ts`
- `public/pwa-192.png`
- `public/pwa-512.png`

ผลลัพธ์ build:
- สร้าง `dist/manifest.webmanifest`
- สร้าง `dist/sw.js` และ `dist/registerSW.js`

### 1.4 รองรับ iOS Home Screen Icon
- [x] เพิ่ม `apple-touch-icon` สำหรับ iPhone/iPad
- [x] สร้างไอคอนขนาด 180x180

ไฟล์ที่แก้:
- `public/apple-touch-icon.png`
- `index.html` (`<link rel="apple-touch-icon" ...>`)

---

## 2) สถานะความเสถียร (Stability Check)

- [x] `npm run build` ผ่านหลังทุกการแก้ไขหลัก
- [x] Flow เช็คชื่อรายวิชายังทำงานร่วมกับ Supabase เหมือนเดิม
- [x] Desktop view เดิมไม่ถูกลบ (เพิ่มเฉพาะ mobile layer)

Known Warning (ไม่ใช่ error):
- bundle size > 500kb (สามารถ optimize ในรอบถัดไปด้วย code splitting)

---

## 3) Baseline มาตรฐานสำหรับงานถัดไป

### 3.1 Attendance UX
- ใช้แนวทาง dual-view ต่อไป: Mobile cards + Desktop table
- ห้ามแก้ logic save attendance โดยไม่ทำ regression test
- ทุกการแก้หน้า Attendance ต้องทดสอบ:
  1. เลือกคาบ
  2. เปลี่ยนสถานะนักเรียน
  3. บันทึก
  4. แสดงผลสำเร็จ/ผิดพลาด

### 3.2 PWA Governance
- หากเปลี่ยน branding/logo ต้อง regenerate ไฟล์:
  - `public/pwa-192.png`
  - `public/pwa-512.png`
  - `public/apple-touch-icon.png`
- คง `short_name: "SAMS"` และชื่อเต็มใน manifest ให้ตรงกันทั้งระบบ

### 3.3 Deployment (GitHub + Vercel)
- ใช้ขั้นตอน deploy เดิมได้ทันที
- ไม่ต้องตั้งค่า Vercel เพิ่มสำหรับ PWA พื้นฐาน
- ควรทดสอบหลัง deploy:
  1. โหลดหน้าเว็บได้
  2. เปิดไฟล์ `manifest.webmanifest` ได้
  3. service worker register สำเร็จ

---

## 4) แผนพัฒนาต่อ (V8 Next)

### Priority A: Reports & Export (ต่อจาก V7)
- [ ] CSV ภาษาไทยพร้อม BOM ทุกแท็บรายงาน
- [ ] PDF รายงานภาษาไทยมาตรฐานโรงเรียน

### Priority B: RLS Rollout (ต่อจาก V6 checklist)
- [ ] เปิด RLS แบบทีละ phase (Core -> Attendance -> Secondary)
- [ ] ทำ smoke test ราย role ทุกครั้งหลังเพิ่ม policy

### Priority C: PWA Advanced
- [ ] เพิ่ม offline fallback page
- [ ] กำหนด cache strategy สำหรับ static/assets/API อย่างเหมาะสม
- [ ] ทดสอบ Add to Home Screen บน Android และ iOS จริง

---

## 5) Acceptance Checklist สำหรับ V8 Baseline

- [x] Mobile attendance view ใช้งานได้
- [x] Branding เป็น SAMS ครบจุดหลัก
- [x] PWA เปิดใช้งานและ build ผ่าน
- [x] apple-touch-icon พร้อมใช้งาน
- [x] โค้ดไม่พังและยัง deploy ได้ตามปกติ

---

## 6) ไฟล์ที่มีการเปลี่ยนแปลงสำคัญในรอบนี้

- `src/pages/Attendance.tsx`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `public/pwa-192.png`
- `public/pwa-512.png`
- `public/apple-touch-icon.png`
