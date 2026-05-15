# Development Plan: School Attendance Management System (SAMS)
## แผนการพัฒนาและแบ่งเฟสการทำงาน (อ้างอิงจาก School.md)

เพื่อการทำงานที่เป็นระบบและสามารถส่งมอบฟีเจอร์ที่ใช้งานได้จริงในแต่ละช่วงเวลา เราจะแบ่งการพัฒนาออกเป็น 5 เฟส ดังนี้:

---

### Phase 1: Foundation & Core Data Management (วางรากฐานและระบบจัดการข้อมูลหลัก)
*เป้าหมาย: สร้างโครงสร้างโปรเจกต์ ตั้งค่าฐานข้อมูล ระบบล็อคอิน และการจัดการข้อมูลพื้นฐานที่จำเป็นทั้งหมด*

1.  **Project Setup & Architecture**
    - [x] Initialize โปรเจกต์ด้วย React + Vite + TypeScript
    - [x] ติดตั้งและตั้งค่า TailwindCSS, React Router, Zustand, React Query
    - [x] วางโครงสร้างโฟลเดอร์ (src/components, src/pages, etc.)
2.  **Database & Backend Setup (Supabase)**
    - [x] สร้างโปรเจกต์ใน Supabase
    - [x] สร้าง Tables ทั้งหมดตาม ER Diagram (users, students, teachers, subjects, classrooms ฯลฯ)
    - [x] ตั้งค่า Row Level Security (RLS) เบื้องต้น
3.  **Authentication Module**
    - [x] ระบบ Login / Logout ด้วย Supabase Auth
    - [x] การจัดการสิทธิ์การเข้าถึง (Role-based Access Control: Admin, Teacher, Student, Parent)
4.  **Core Management Modules (CRUD Operations)**
    - [x] ระบบจัดการบุคลากร: Teacher Module
    - [x] ระบบจัดการนักเรียนและห้องเรียน: Student & Classroom Module
    - [x] ระบบจัดการวิชาเรียน: Subject Module

---

### Phase 2: Scheduling & Basic Attendance (ระบบตารางเรียนและการเช็คชื่อพื้นฐาน)
*เป้าหมาย: สามารถจัดตารางสอนและให้ครูทำการเช็คชื่อนักเรียนในห้องเรียนหรือเข้าแถวได้แบบ Manual ก่อน*

1.  **Schedule Module**
    - [x] ระบบจัดตารางเรียน / ตารางสอน
    - [x] การตรวจสอบการชนกันของตาราง (เวลา, ครู, ห้อง)
2.  **Homeroom Attendance (เช็คเข้าแถว)**
    - [x] หน้าจอสำหรับครูที่ปรึกษาในการเช็คชื่อเข้าแถว (แบบ Manual)
    - [x] บันทึกสถานะ (มา, สาย, ขาด, ลา)
3.  **Classroom Attendance (เช็คเข้าเรียนรายคาบ)**
    - [x] หน้าจอสำหรับครูผู้สอนเปิด Session การสอน
    - [x] หน้าจอเช็คชื่อนักเรียนรายคาบ (แบบ Manual)
4.  **Basic Dashboards**
    - [x] Dashboard เบื้องต้นสำหรับแสดงตารางเรียนของวันนั้นๆ (ตอนนี้ใช้สำหรับแสดงสถิติเบื้องต้น)
    - [x] สรุปจำนวนการเข้าเรียนเบื้องต้น (รวมอยู่กับสถิติภาพรวม)

---

### Phase 3: Smart Attendance & Anti-Cheat (ระบบเช็คชื่ออัจฉริยะและป้องกันการทุจริต)
*เป้าหมาย: ยกระดับการเช็คชื่อให้นักเรียนสามารถสแกนด้วยตัวเองได้ พร้อมระบบป้องกันการโกง*

1.  **QR Code Generation**
    - [x] สร้างระบบสร้าง Dynamic QR Code สำหรับแต่ละ Session ที่มีการหมดอายุ
2.  **Student Self Check-in**
    - [x] หน้านักเรียนสำหรับสแกน QR Code เพื่อเช็คชื่อ
3.  **Validation & Anti-Cheat System (ข้ามไปก่อนตามคำขอ)**
    - [ ] ระบบตรวจสอบพิกัด (GPS Validation) เพื่อให้แน่ใจว่าอยู่ในบริเวณโรงเรียน
    - [ ] ระบบตรวจสอบอุปกรณ์ (Device Validation & IP Address) ป้องกันการฝากเช็คชื่อ
4.  **Realtime Integration**
    - [x] นำ Supabase Realtime มาใช้ เพื่อให้ครูเห็นนักเรียนที่เช็คชื่อเข้ามาแบบสดๆ ทันที

---

### Phase 4: Leave Management & Notifications (ระบบการลาและการแจ้งเตือน)
*เป้าหมาย: เพิ่มความสะดวกให้ผู้ปกครองและนักเรียนในการลา และการสื่อสารผ่านการแจ้งเตือน*

1.  **Leave Request Module**
    - [x] หน้านักเรียน/ผู้ปกครองสำหรับยื่นใบลาพร้อมแนบหลักฐาน (Supabase Storage)
    - [x] หน้าครูสำหรับอนุมัติ/ปฏิเสธใบลา
2.  **Notification Engine**
    - [ ] พัฒนาระบบแจ้งเตือนภายในแอปพลิเคชัน (In-app notifications)
    - [ ] เชื่อมต่อระบบแจ้งเตือนภายนอก (LINE Notify / LINE Messaging API หรือ Telegram Bot) เพื่อแจ้งเตือนเมื่อขาดเรียน/สาย หรือแจ้งผลการอนุมัติใบลา
3.  **Parent Portal**
    - [x] หน้า Dashboard สำหรับผู้ปกครองเพื่อดูประวัติการเข้าเรียนและการลาของบุตรหลาน

---

### Phase 5: Reporting, Analytics & Polish (ระบบรายงานผลและการปรับปรุงขั้นสุดท้าย)
*เป้าหมาย: ระบบวิเคราะห์ข้อมูลเชิงลึกสำหรับผู้บริหารและปรับปรุงประสบการณ์การใช้งาน*

1.  **Reports & Analytics Dashboard**
    - [x] Dashboard สถิติขั้นสูงสำหรับ Admin (กราฟรายวัน/รายเดือน, ห้องที่ขาดมากสุด, นักเรียนกลุ่มเสี่ยง)
2.  **Export System**
    - [x] ระบบออกรายงานในรูปแบบ PDF
    - [x] ระบบ Export ข้อมูลเป็น Excel / CSV
3.  **Audit Logs**
    - [ ] ระบบเก็บบันทึกการกระทำของผู้ใช้เพื่อความปลอดภัยและตรวจสอบย้อนหลัง
4.  **Optimization & UI/UX Polish**
    - [ ] ตรวจสอบ Performance และ Mobile Responsiveness
    - [ ] ทดสอบระบบ (Testing) และแก้ไข Bug
    - [ ] เตรียมความพร้อมสำหรับการ Deployment ขึ้น Vercel แบบ Production

---

**สรุปสิ่งที่ต้องเตรียมสำหรับเริ่ม Phase 1:**
- [ ] ยืนยันโครงสร้าง Database
- [ ] สร้าง Repository (GitHub)
- [ ] เตรียมโปรเจกต์ Supabase
