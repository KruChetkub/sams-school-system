# Changelog - Smart School Platform

ประวัติการปรับปรุงระบบและสถานะเวอร์ชันของแพลตฟอร์ม (Smart School Operating System)

---

## [v2.2.0] - 2026-06-22 (เวอร์ชันปัจจุบัน)

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
