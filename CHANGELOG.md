# Changelog - Smart School Platform

ประวัติการปรับปรุงระบบและสถานะเวอร์ชันของแพลตฟอร์ม (Smart School Operating System)

> [!IMPORTANT]
> **ข้อควรระวังสำหรับนักพัฒนา (Developer Note)**:
> ทุกครั้งที่มีการแก้ไขเวอร์ชัน (Version) ในไฟล์ `CHANGELOG.md` นี้ จะต้องตามไปแก้ไขอัปเดตเลขเวอร์ชันในโค้ดระบบอีก 2 จุดเสมอ:
> 1. **หน้า Login**: ไฟล์ [Login.tsx](file:///d:/sams-school-system-main/frontend/src/pages/Login.tsx) (บริเวณแสดงรุ่น v ด้านล่างของฟอร์ม)
> 2. **หน้า Portal**: ไฟล์ [Portal.tsx](file:///d:/sams-school-system-main/frontend/src/pages/portal/Portal.tsx) (บริเวณลิขสิทธิ์ที่ Footer ท้ายเว็บ)

---

## [v2.3.0] - 2026-06-23 (เวอร์ชันปัจจุบัน)

### Added
- **Cross-App Language & Theme Syncing**: เชื่อมประสานระบบเปลี่ยนภาษา (TH/EN) และการสลับโหมดสว่าง/มืด (Light/Dark Mode) ข้ามทั้ง 3 ระบบ ([App.tsx](file:///d:/sams-school-system-main/frontend/src/App.tsx), Home Visit, Student Support) ให้แชร์การตั้งค่าพร้อมกันทันทีผ่าน `localStorage` (`portal-lang`, `portal-theme`)
- **Portal Mobile App Icons**: จัดเรียงระบบหลักทั้ง 3 ในรูปแบบ "App Shortcut Icons" ขนาดกะทัดรัด (Squircle) วางแนวนอนแถวเดียว (`grid-cols-3`) บนมือถือ ทำให้ประหยัดพื้นที่และแสดงผลเต็มหน้าจอโดยไม่ต้องเลื่อนจอขึ้นลงในหน้า Portal
- **Cyber AI Portal Background**: แสดงผลภาพพื้นหลังแนว Cyber AI เทคโนโลยีสีม่วงสว่างสวยงามเฉพาะในหน้า [Portal.tsx](file:///d:/sams-school-system-main/frontend/src/pages/portal/Portal.tsx) เมื่อเปิดโหมดสว่าง (Light Mode)

### Removed
- **Custom Color & Supabase Theme Sync**: ยกเลิกระบบปรับสีพื้นหลังแบบเลือกสีเองและการเชื่อมโยงเซฟฟิลด์ `theme_bg` ไปที่ Supabase ในหน้าตั้งค่าระบบ ([Settings.tsx](file:///d:/sams-school-system-main/frontend/src/pages/Settings.tsx)) และ App.tsx ทั้งหมดเพื่อเปลี่ยนมาใช้ระบบ Light/Dark Mode มาตรฐาน

### Fixed
- **Portal Text Contrast & Readability**: ปรับระดับเลเยอร์ความขุ่นขาวในโหมดสว่างเป็น 40% และปรับสีตัวหนังสือเป็นสีดำสนิท/เข้มชัดเจนเพื่อความคมชัดสูง แก้ไขตัวหนังสือเบลอหรือกลืนไปกับพื้นหลัง Cyber AI
- **Mobile Sign Out Relocation**: ย้ายปุ่มออกจากระบบ (Sign Out) บนหน้าจอมือถือไปเป็นปุ่มขนาดเล็กใน Header ด้านบนขวาติดกับชื่อผู้ใช้ และยกเลิกปุ่มสีแดงแถบใหญ่ที่ Footer ออกเพื่อความคล่องตัว
- **Style Contrast Fixes**: แก้ไขคอนทราสต์ตัวอักษรของตาราง บันทึกผล และฟิลด์กรอกข้อมูลต่าง ๆ ใน SAMS และแดชบอร์ดให้คมชัดในทุกสภาพสีธีม

---

## [v2.2.0] - 2026-06-22

### Added
- **Portal V2**: ปรับปรุงหน้า [Portal.tsx](file:///d:/sams-school-system-main/frontend/src/pages/portal/Portal.tsx) ตามสเปค V2 ใหม่ทั้งหมด
- **Real-time Statistics (Supabase)**: ดึงข้อมูลยอดผู้ใช้งานจริงจากตาราง `students`, `teachers`, และ `classrooms` ของ Supabase โดยตรงแทนข้อมูลจำลอง
- **Light / Dark Mode**: รองรับการสลับธีม สภาพสี และความโปร่งแสงตามค่าใน Spec โดยประยุกต์ร่วมกับ Lottie background ฉากหลังได้อย่างสมบูรณ์
- **Multi-language (TH/EN)**: สลับภาษาในคลิกเดียวโดยไม่รีโหลดหน้าเพจ (No Page Reload) และจัดเก็บสถานะลงใน LocalStorage
- **Responsive Layout**: จัด Grid ระบบตาม Breakpoints มาตรฐานของโปรเจกต์ และปรับปรุงขนาดปุ่มให้รองรับการแตะสัมผัส (Touch Targets >= 44x44px)

### Fixed
- **Mobile Header Optimization**: ซ่อนกล่องโลโก้/ชื่อระบบ `School Portal Ckw` บนหน้าจอมือถือเพื่อเพิ่มพื้นที่แสดงผล และจัดให้กล่องเมนูปุ่มกดอยู่กึ่งกลางสวยงาม
- **Sign Out Button Placement**: ย้ายปุ่ม Sign Out ในโหมด Desktop ไปอยู่ถัดจากป้ายโปรไฟล์ผู้ใช้ด้านบนขวา และคงปุ่มเด่นที่ Footer ไว้เฉพาะในโหมดหน้าจอมือถือ
- **Search Bar removal**: เอาช่องค้นหาระบบออกเพื่อลดความซับซ้อนตามฟีดแบ็คผู้ใช้

---

## [v2.1.0] - 2026-06-22

### Added
- **Dashboard Responsive**: ปรับปรุงหน้า [Dashboard.tsx](file:///d:/sams-school-system-main/frontend/src/pages/Dashboard.tsx) ให้รองรับการแสดงผลแบบ Mobile First
- **Stats Card Icon overlaps**: แก้ไขปัญหาไอคอนสถิติซ้อนทับและบังตัวเลขสถิติบนขนาดจอต่าง ๆ โดยซ่อนไอคอนในบาง breakpoint

### Fixed
- **Vite compilation error**: ตรวจแก้ปัญหาโค้ด JSX/HTML บิดเบี้ยวช่วงท้ายไฟล์จากรอบการแก้ไขก่อนหน้า ซึ่งช่วยคลีนข้อผิดพลาด Runtime 500 (Vite build) สำเร็จลุล่วง
