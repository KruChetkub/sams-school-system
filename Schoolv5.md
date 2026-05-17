# Development Plan: School Attendance Management System (SAMS) - Version 5
## แผนการพัฒนาและประวัติการอัปเดตระบบ (อ้างอิงจาก Schoolv4.md)

ไฟล์นี้เป็นจุด Checkpoint ล่าสุดของ Session วันนี้ เพื่อใช้ส่งต่องานให้ AI/นักพัฒนาคนต่อไปทำงานต่อได้ทันที

---

### 🟢 สรุปฟีเจอร์ที่พัฒนาเพิ่มใน V5 (Session ล่าสุด)
**Session วันที่: 16 พฤษภาคม 2569**

1. **Reports — แท็บรายวิชา ปรับ UX เป็นการ์ด + ตารางเจาะลึก**
   - แท็บ `reports#subject` เปลี่ยนจากตารางรวมเป็น **การ์ดรายวิชา**
   - คลิกการ์ดแล้วเปิด modal รายละเอียดเป็น **ตารางนักเรียน x วันที่เช็คชื่อ**
   - ช่องสถานะแสดงสีชัดเจน:
     - มา = เขียว
     - ขาด = แดง
     - สาย = เหลือง
     - ลา = ฟ้า
   - จำนวนคอลัมน์วันที่เพิ่มอัตโนมัติตามจำนวน session จริงของวิชานั้น

2. **Reports — เพิ่มแท็บเช็คชื่อเข้าแถว (`#homeroom`)**
   - เพิ่มแท็บใหม่ใน Reports สำหรับข้อมูลจาก `homeroom_attendance`
   - แสดงสรุปรายห้องเรียน: มา/ขาด/สาย/ลา/รวม/%มา
   - เพิ่มปุ่ม `ดูรายชื่อ` เปิด modal รายชื่อนักเรียนในห้องนั้น
   - ใน modal มีสรุปรายบุคคล + สถานะล่าสุด

3. **Homeroom Page — ป้องกันเช็คซ้ำรายวัน**
   - เพิ่มกล่องแจ้งเตือนบนหน้า `Homeroom` ว่าวันนี้ห้องใดเช็คไปแล้ว
   - ถ้าเลือกห้องที่เช็คแล้วในวันเดียวกัน จะ disable ปุ่มบันทึกทันที
   - หลังบันทึกสำเร็จ ระบบ refresh สถานะห้องที่เช็คแล้วแบบทันที

4. **Attendance Page — เปลี่ยนเลือกคาบจาก Dropdown เป็นการ์ด**
   - หน้า `Attendance` เปลี่ยน UI เลือกคาบ/วิชาเป็น **การ์ดสีรายวิชา**
   - ต้องคลิกการ์ดก่อน จึงโหลดรายชื่อนักเรียน
   - สีการ์ดผูกกับวิชาแบบ deterministic (วิชาเดิมได้สีเดิม)

5. **Executive Dashboard — เพิ่ม Insight และยกระดับกราฟ**
   - เพิ่มการ์ดใหม่: `ห้องที่เช็คเข้าแถววันนี้` (คลิกไป `reports#homeroom`)
   - เพิ่มบล็อก Insight:
     - อัตราเข้าเรียนวันนี้เทียบเมื่อวาน (Donut + Delta + Sparkline 7 วัน)
     - Top 5 ห้องเสี่ยง (Ranked Horizontal Bar + เส้นเป้าหมาย 80%)
   - กราฟสถิติรายสัปดาห์ปรับเป็น **Dual View**:
     - แท่ง: มา/ขาด/สาย
     - เส้น: อัตรามาเรียน (%)
   - บล็อกอัตราการเข้าเรียนเฉลี่ยปรับเป็น **Gauge + Target + Monthly Delta**

6. **Recharts Stability Fix**
   - แก้ warning `width(-1)/height(-1)` โดยปรับ container และ ResponsiveContainer หลายจุด
   - เพิ่ม `minWidth/minHeight` และปรับ width/height ให้เสถียรขึ้น

7. **Settings — ปรับโครงใหม่เป็นแท็บ + RBAC**
   - หน้า Settings ปรับเป็น 3 แท็บ:
     - Appearance (Theme & Branding)
     - Notifications
     - User Management
   - ใช้สิทธิ์ `ADMIN` เป็นหลัก (ไม่มี SUPER_ADMIN ในฐานข้อมูลตอนนี้)
   - User Management รองรับ role: ADMIN / TEACHER / ADVISOR / STUDENT / PARENT

8. **Theme & Branding — เปลี่ยนสีพื้นหลังระบบได้จริง**
   - เก็บค่าใน localStorage (`sams_theme_bg`)
   - ผูกกับ CSS variable `--app-bg` ให้พื้นหลังระบบเปลี่ยนทันที
   - เพิ่ม preset สีใหม่ + โหมด custom color (input color + hex)
   - เพิ่ม preset ใหม่วันนี้: `Rose Blush`, `Aqua Breeze`

9. **Settings Save UX — เปลี่ยนจาก alert เป็น Modal ตามระบบ**
   - หลังบันทึกธีมและบันทึก notifications ใช้ modal แจ้งผลแบบเดียวกับหน้าอื่น

10. **Sidebar Personalization**
   - ตำแหน่งข้อความใต้โลโก้ `SAMS`
   - ถ้า role = ADMIN แสดง `Admin Portal` เหมือนเดิม
   - ถ้าไม่ใช่ ADMIN ดึงชื่อจริงจากตาราง `teachers` (first_name + last_name ตาม user_id) มาแสดงข้อความต้อนรับ

---

### 🟡 สถานะ Phase (อัปเดตหลัง Session นี้)

#### Phase 1: Foundation & Core Data Management
*สถานะ: เสร็จสมบูรณ์ (100%)*

#### Phase 2: Scheduling & Basic Attendance
*สถานะ: เสร็จสมบูรณ์ (100%)*

#### Phase 3: Smart Attendance & Anti-Cheat
*สถานะ: Deferred*
- [ ] GPS + IP Validation (ยังไม่เปิด)

#### Phase 4: Leave Management & Notifications
*สถานะ: Paused / Partially Enhanced*
- [x] ปรับ Notifications ใน Settings ให้เป็นแท็บ
- [ ] Workflow แจ้งเตือนจริงผ่าน provider ยังต้องต่อระบบ backend จริง

#### Phase 5: Reporting, Analytics & Polish
*สถานะ: ก้าวหน้าอย่างมาก (ประมาณ 90%+)*
- [x] Reports รายวิชาแบบการ์ด + ตารางเจาะลึก
- [x] Reports เข้าแถว (homeroom) + modal รายชื่อ
- [x] Dashboard analytics และ insight สำหรับผู้บริหาร
- [ ] Export CSV/PDF ยังไม่ได้ลง logic จริง
- [ ] Audit Logs ยังไม่เริ่ม

---

### 📁 ไฟล์ที่แก้ใน Session นี้

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/Reports.tsx` | ปรับรายวิชาเป็นการ์ด + modal ตาราง, เพิ่มแท็บ homeroom, เพิ่ม modal รายชื่อห้อง |
| `src/services/dashboardService.ts` | เพิ่ม service หลายตัว: homeroom report/detail, checked homeroom today, attendance trend daily/monthly |
| `src/pages/Homeroom.tsx` | เพิ่มกล่องแจ้งห้องที่เช็คแล้ว + disable บันทึกซ้ำ |
| `src/services/homeroomService.ts` | เพิ่มฟังก์ชันดึงห้องที่เช็คเข้าแถวแล้วตามวันที่ |
| `src/pages/Attendance.tsx` | เปลี่ยนเลือกคาบจาก dropdown เป็นการ์ดสีรายวิชา |
| `src/pages/Dashboard.tsx` | เพิ่มการ์ด homeroom วันนี้ + insight blocks + chart upgrade หลายจุด |
| `src/pages/Settings.tsx` | รีดีไซน์เป็นแท็บ, theme/custom color, modal save result, RBAC admin |
| `src/index.css` | ใช้ `--app-bg` เป็นพื้นหลังหลัก |
| `src/App.tsx` | ปรับ sidebar/background ให้รองรับธีม + ปรับข้อความต้อนรับจากชื่อครู |

---

### 🚀 Next Steps (แนะนำ Session ถัดไป)

1. **Export Reports (CSV/PDF) ให้ใช้งานจริง**
   - เชื่อมปุ่มในแท็บ Export กับข้อมูลจากแท็บปัจจุบัน

2. **เสริมธีมระดับองค์กรมากขึ้น**
   - เพิ่มการตั้งค่าสี Active Menu / Sidebar / Primary Button แยกจากพื้นหลัง

3. **Hardening ด้านสิทธิ์และ policy**
   - ตรวจ RLS ของตารางใหม่ที่ถูกใช้งานใน analytics/homeroom detail ให้ครบ

4. **Performance pass**
   - เริ่ม split chunk สำหรับหน้า Dashboard/Reports (bundle เริ่มใหญ่)

5. **Leave System (Phase 4) ต่อเนื่อง**
   - เปิดเมนู leave และเชื่อม workflow อนุมัติ + แจ้งเตือนจริง
