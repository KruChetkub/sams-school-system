# Phane — คู่มือสรุปสำหรับนักพัฒนาและ AI ในการต่อยอดระบบ SAMS

> 📋 **ไฟล์นี้คือ "แผนที่" ของโปรเจกต์ทั้งหมด**  
> อ่านไฟล์นี้ไฟล์เดียว → เข้าใจระบบ → พัฒนาต่อได้ทันที  
> สำหรับรายละเอียดเชิงลึก ให้อ่านเพิ่มเติมที่ `SYSTEM.md`, `IPO.md`, `DESIGN.md`

---

## 🎯 ระบบนี้คืออะไร?

**SAMS (School Attendance Management System)** คือ Web Application ระบบบริหารจัดการโรงเรียนแบบครบวงจร ประกอบด้วย 3 แอปย่อยใน Portal เดียว:

1. **🎓 SAMS** — เช็คชื่อ + จัดการข้อมูลโรงเรียน + รายงานสถิติ
2. **🏠 ระบบเยี่ยมบ้าน** — บันทึกเยี่ยมบ้าน + GPS + ประเมินความเสี่ยง + รูปภาพ
3. **💜 ระบบดูแลช่วยเหลือนักเรียน** — คัดกรอง SDQ/EQ + วิเคราะห์ความเสี่ยง 360° + จัดการเคส

---

## 🛠️ Tech Stack สรุปสั้น

| ชั้น | เทคโนโลยี |
|------|-----------|
| **Framework** | React 19 + TypeScript 6 + Vite 8 |
| **Styling** | TailwindCSS 4 |
| **State** | Zustand (Auth) + TanStack React Query (Server State) |
| **Routing** | React Router DOM 7 (SPA) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + RPC) |
| **Deploy** | Vercel (SPA) + PWA (vite-plugin-pwa) |
| **Charts** | Recharts |
| **Maps** | Leaflet + React Leaflet |
| **QR** | qrcode.react + html5-qrcode |
| **Excel** | xlsx |

---

## 📁 โครงสร้างไฟล์ที่ต้องรู้

```
src/
├── App.tsx              # ★ Router + Layout + Auth — จุดเริ่มต้นของทุกอย่าง
├── lib/supabase.ts      # ★ Supabase client instance (ใช้ทุก service)
├── store/authStore.ts   # ★ Global auth state (user, role, session)
│
├── services/            # ★★★ Business Logic ทั้งหมดอยู่ที่นี่
│   ├── [name]Service.ts       # CRUD + queries สำหรับแต่ละ entity
│   ├── academicYearService.ts # ★ จัดการปีการศึกษาและภาคเรียน (ใหม่)
│   ├── teacherDashboardService.ts # ★ แดชบอร์ดข้อมูลครูที่ปรึกษา (ใหม่)
│   ├── parentDashboardService.ts # ★ แดชบอร์ดและการเข้าถึงของผู้ปกครอง (ใหม่)
│   ├── portfolioService.ts    # ★ จัดการแฟ้มผลงานนักเรียน (ใหม่)
│   ├── dashboardService.ts    # สถิติ + รายงาน (ไฟล์ใหญ่ ~1000 lines)
│   ├── homevisit/visitService.ts
│   └── studentsupport/studentSupportService.ts  # SDQ/EQ/Risk (~1000 lines)
│
├── pages/               # แต่ละ page = 1 หน้าจอ
│   ├── [Name].tsx             # หน้าจอหลัก
│   ├── AcademicYears.tsx      # ★ หน้า CRUD จัดการปีการศึกษา (ใหม่)
│   ├── TeacherDashboard.tsx   # ★ หน้าแดชบอร์ดสำหรับคุณครู (ใหม่)
│   ├── ParentDashboard.tsx    # ★ หน้าแดชบอร์ดสำหรับผู้ปกครอง (ใหม่ - ยกเครื่อง)
│   ├── StudentPortfolio.tsx   # ★ แฟ้มสะสมผลงานและกิจกรรมนักเรียน (ใหม่)
│   ├── homevisit/             # หน้าจอเยี่ยมบ้าน
│   ├── studentsupport/        # หน้าจอดูแลช่วยเหลือ
│   └── portal/Portal.tsx      # หน้าเลือกแอป
│
└── components/          # UI Components แชร์ข้ามหน้า
    ├── homevisit/             # Layout, Map, Print, Signature
    └── studentsupport/        # Layout
```

---

## 🗄️ ตาราง Database ที่ต้องรู้

### ตารางหลัก
| ตาราง | หน้าที่ | ฟิลด์สำคัญ |
|-------|---------|-----------|
| `users` | ผู้ใช้ระบบ | `id`, `email`, `role` (ADMIN/TEACHER/PARENT/STUDENT), `theme_bg` |
| `teachers` | ครู | `id`, `teacher_code`, `first_name`, `last_name`, `user_id`, `role` (TEACHER/ADMIN) |
| `students` | นักเรียน | `id`, `student_code`, `prefix`, `first_name`, `last_name`, `classroom_id`, `parent_id`, `deleted_at` |
| `classrooms` | ห้องเรียน | `id`, `level`, `room`, `advisor_id` (FK→teachers), `academic_year_id` |
| `subjects` | วิชา | `id`, `subject_code`, `subject_name`, `teacher_id` |
| `parents` | ผู้ปกครอง | `id`, `first_name`, `last_name`, `phone`, `email`, `line_user_id` |
| `academic_years` | ปีการศึกษา | `id`, `year` (UNIQUE เช่น 2569), `label`, `is_active`, `start_date`, `end_date` (ใหม่) |
| `semesters` | ภาคเรียนย่อย | `id`, `academic_year_id` (FK), `semester_number`, `label`, `is_active`, `start_date`, `end_date` (ใหม่) |
| `student_portfolios` | แฟ้มผลงาน | `id`, `student_id` (FK), `category`, `title`, `description`, `score`, `grade`, `certificate_url` (ใหม่) |

### ตารางเช็คชื่อ
| ตาราง | หน้าที่ |
|-------|---------|
| `schedules` | ตารางเรียน (วิชา+ครู+ห้อง+วัน+คาบ) |
| `attendance_sessions` | Session QR (ผูก schedule, มี `qr_code` + `status`) |
| `attendance` | บันทึกเช็คชื่อรายวิชา (student+session+status+GPS) |
| `homeroom_attendance` | บันทึกเช็คชื่อเข้าแถว (student+date+status) |
| `leave_requests` | ใบลา (student+type+date+reason+status) |

### ตารางเยี่ยมบ้าน
| ตาราง | หน้าที่ |
|-------|---------|
| `home_visits` | ข้อมูลเยี่ยมบ้าน (student+teacher+date+GPS) |
| `home_visit_assessments` | ผลประเมิน (สภาพบ้าน, ครอบครัว, เศรษฐกิจ, risk_level) |
| `home_visit_photos` | รูปภาพ (photo_url → Supabase Storage) |

### ตารางดูแลช่วยเหลือ
| ตาราง | หน้าที่ |
|-------|---------|
| `student_support_sdq` | แบบประเมิน SDQ 25 ข้อ (answers, คะแนน 5 ด้าน, ผลกระทบ) |
| `student_support_eq` | แบบประเมิน EQ 52 ข้อ (answers, คะแนนรวม, 3 มิติ: ดี/เก่ง/สุข) |
| `student_support_risk_analysis` | ความเสี่ยงภาพรวม (risk_score, risk_level, factors) — UNIQUE per student |
| `student_support_cases` | เคสช่วยเหลือ (status: OPEN→FOLLOWING→HELPING→CLOSED) |
| `student_support_case_logs` | บันทึกความคืบหน้าเคส |

### ตารางสนับสนุน
| ตาราง | หน้าที่ |
|-------|---------|
| `audit_logs` | Log ทุกการกระทำ (Login, CRUD) + IP + User Agent |
| `notifications` | แจ้งเตือนในระบบ |
| `activity_groups` / `activity_group_members` | กลุ่มกิจกรรม |
| `student_group_memberships` | สมาชิกกลุ่ม (CLASSROOM/SUBJECT) |

---

## 🔑 Patterns สำคัญที่ต้องทำตาม

### 1. สร้าง Service ก่อน Page เสมอ
```
1. สร้าง src/services/xxxService.ts   ← Business Logic + Supabase queries
2. สร้าง src/pages/Xxx.tsx            ← UI ที่เรียกใช้ service
3. เพิ่ม Route ใน App.tsx             ← ลงทะเบียนเส้นทาง
```

### 2. Service Pattern มาตรฐาน
```typescript
// src/services/xxxService.ts
import { supabase } from '../lib/supabase'

export interface XxxItem {
  id: string
  name: string
  // ... fields ตรงกับตาราง
}

export const getXxxItems = async () => {
  const { data, error } = await supabase.from('xxx').select('*').order('name')
  if (error) throw error
  return data as XxxItem[]
}

export const createXxxItem = async (item: Omit<XxxItem, 'id'>) => {
  const { data, error } = await supabase.from('xxx').insert(item).select().single()
  if (error) throw error
  return data as XxxItem
}

export const updateXxxItem = async (id: string, updates: Partial<XxxItem>) => {
  const { data, error } = await supabase.from('xxx').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as XxxItem
}

export const deleteXxxItem = async (id: string) => {
  const { error } = await supabase.from('xxx').delete().eq('id', id)
  if (error) throw error
}
```

### 3. Page Pattern มาตรฐาน
```typescript
// src/pages/Xxx.tsx
import { useState, useEffect } from 'react'
import { getXxxItems, createXxxItem } from '../services/xxxService'

const Xxx = () => {
  const [items, setItems] = useState<XxxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getXxxItems()
      setItems(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // ... JSX with TailwindCSS
}
```

### 4. เพิ่ม Route ใน App.tsx
```tsx
// ใน Routes ของ App.tsx:
<Route path="/xxx" element={user ? <DashboardLayout><Xxx /></DashboardLayout> : <Navigate to="/login" />} />
```

### 5. ถ้าเพิ่มเมนูใหม่ใน Sidebar
```tsx
// ใน DashboardLayout → <nav>:
<NavItem to="/xxx" icon={IconName} onClick={closeSidebar}>ชื่อเมนู</NavItem>
```

### 6. ถ้าต้องการ Layout แยก (เช่น ระบบย่อยใหม่)
- สร้าง `src/components/xxx/XxxLayout.tsx` ตาม pattern ของ `HomeVisitLayout.tsx`
- ใน Route ใช้: `<XxxLayout><XxxPage /></XxxLayout>`

---

## ⚠️ กฎสำคัญที่ต้องปฏิบัติตาม

### ห้ามทำ ❌
1. ❌ **อย่าเรียก Supabase ตรงจาก Page Component** — ต้องผ่าน Service เสมอ
2. ❌ **อย่าลบนักเรียนจริง** — ใช้ Soft Delete (`deleted_at`)
3. ❌ **อย่าลืม `.is('deleted_at', null)`** เมื่อ query students
4. ❌ **อย่าเก็บ sensitive data ใน localStorage** (ยกเว้น theme)
5. ❌ **อย่าสร้างตารางใหม่โดยไม่เปิด RLS** — ต้องเปิดทุกตาราง

### ต้องทำ ✅
1. ✅ **เพิ่ม `throw error`** หลังทุก Supabase query ที่มี error
2. ✅ **Export ทั้ง Interface และ Function** จาก service files
3. ✅ **ใช้ TailwindCSS** สำหรับ styling (ห้ามใช้ inline style ยกเว้น CSS variables)
4. ✅ **ใช้ Lucide React** สำหรับ icons (อย่าใช้ library อื่น)
5. ✅ **ใช้ภาษาไทย** สำหรับ UI text ทั้งหมด (ป้ายชื่อ, ข้อความ, placeholder)
6. ✅ **Log audit events** สำหรับ actions สำคัญ (Login, CRUD ข้อมูลหลัก)

---

## 🧮 สูตรคำนวณสำคัญ

### SDQ Scoring (25 ข้อ)
- **ข้อกลับคะแนน (0→2, 2→0):** ข้อ 7, 11, 14, 21, 25
- **5 ด้าน:**
  - Emotional: ข้อ 3, 8, 13, 16, 24
  - Conduct: ข้อ 5, 7, 12, 18, 22
  - Hyperactivity: ข้อ 2, 10, 15, 21, 25
  - Peer: ข้อ 6, 11, 14, 19, 23
  - Prosocial: ข้อ 1, 4, 9, 17, 20
- **ผลรวมปัญหา** = Emotional + Conduct + Hyperactivity + Peer
- **ฉบับนักเรียน:** ≥19 = PROBLEM, ≥17 = RISK
- **ฉบับครู/ผู้ปกครอง:** ≥18 = PROBLEM, ≥16 = RISK

### EQ Scoring (52 ข้อ)
- **ข้อกลับคะแนน (24 ข้อ):** Q1,2,4,7,8,10,12,15,17,18,20,23,25,26,28,29,32,34,36,39,44,46,50,51
- **3 มิติ:**
  - ด้านดี (20 ข้อ, เต็ม 80): ปกติ 48-59
  - ด้านเก่ง (18 ข้อ, เต็ม 72): ปกติ 43-52
  - ด้านสุข (14 ข้อ, เต็ม 56): ปกติ 48-57
- **คะแนนรวม:** ต่ำกว่าปกติ <139 / ปกติ 139-168 / สูงกว่าปกติ >168

### Risk Score (0-10)
| ปัจจัย | คะแนน |
|--------|-------|
| SDQ = PROBLEM | +3.5 |
| SDQ = RISK | +1.5 |
| EQ = LOWER_THAN_NORMAL | +2.0 |
| Attendance ขาด > 5 วัน | +2.5 |
| Attendance ขาด > 3 วัน | +1.0 |
| Home Visit = URGENT | +2.0 |
| Home Visit = RISK | +1.0 |

| Risk Score | ระดับ | สี |
|-----------|-------|-----|
| ≥ 6.0 | URGENT | 🔴 |
| ≥ 3.5 | RISK | 🟠 |
| ≥ 1.5 | MONITOR | 🟡 |
| < 1.5 | NORMAL | 🟢 |

---

## 🔌 Environment & Config

### `.env` (ค่าที่ต้องมี)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

### Commands
```bash
npm run dev       # เปิด dev server
npm run build     # Build production
npm run preview   # Preview production build
npm run lint      # ตรวจ code style
```

### Deploy
- **Vercel:** ใช้ `vercel.json` rewrite ทุก path → `/index.html`
- **PWA:** Auto-register Service Worker, standalone mode

---

## 📚 ไฟล์เอกสารที่เกี่ยวข้อง

| ไฟล์ | เนื้อหา |
|------|---------|
| [SYSTEM.md](file:///d:/sams-school-system-main/frontend/SYSTEM.md) | ภาพรวมระบบ, Technology Stack, User Roles, Database Schema, Security |
| [IPO.md](file:///d:/sams-school-system-main/frontend/IPO.md) | Input/Process/Output ของทุกฟีเจอร์ (แผนผัง IPO Chart) |
| [DESIGN.md](file:///d:/sams-school-system-main/frontend/DESIGN.md) | สถาปัตยกรรม, โครงสร้างไฟล์, Design Patterns, UI/UX, Data Flow |
| [README.md](file:///d:/sams-school-system-main/frontend/README.md) | คำแนะนำการใช้งานเดิม |

---

## 📊 ประวัติการพัฒนา (Development Log)

การอัปเดตระบบและประวัติฟีเจอร์สำคัญในเวอร์ชันล่าสุด:

| วันที่ | สถานะ | ฟีเจอร์ที่บันทึก / รายละเอียด |
|--------|-------|------------------------------|
| 2 มิ.ย. 2569 | ✅ | **Academic Year CRUD** — เพิ่ม Master Data สำหรับจัดการปีการศึกษาและภาคเรียนปัจจุบันย้อนหลัง |
| 2 มิ.ย. 2569 | ✅ | **Teacher Dashboard** — หน้าแสดงข้อมูลสรุปตารางสอน เข้าแถว ความเสี่ยง และเยี่ยมบ้านสำหรับคุณครู |
| 2 มิ.ย. 2569 | ✅ | **Parent Dashboard Overhaul** — ยกเครื่องระบบบริการข้อมูลผู้ปกครองเพื่อดูประวัติ พฤติกรรม และใบลาของบุตรหลาน |
| 2 มิ.ย. 2569 | ✅ | **Student Portfolio** — ระบบบันทึกผลงานสะสมความดี การแข่งขัน กิจกรรม พร้อมลิงก์หลักฐานภาพ/เกียรติบัตร |
| 2 มิ.ย. 2569 | ✅ | **Academic Year System-wide Filter (Phase 2)** — ระบบคัดกรองและสลับดูข้อมูลประวัติย้อนหลังตามปีการศึกษาและภาคเรียนทั่วทั้งระบบ (ห้องเรียน, รายวิชา, เช็คชื่อเข้าเรียน, เช็คชื่อเข้าแถว, คะแนน, กิจกรรม, เยี่ยมบ้าน, ระบบดูแลช่วยเหลือนักเรียน, และรายงาน/แดชบอร์ด) |
| 3 มิ.ย. 2569 | ✅ | **Soft Delete Bugfix in Dashboard** — แก้ไขบอร์ดสรุปการเยี่ยมบ้านและประวัติการเยี่ยมบ้านเพื่อกรองเอานักเรียนที่ถูก Soft Delete ออกจากการคำนวณและแสดงผล |
| 3 มิ.ย. 2569 | ✅ | **Deleted Student History & Restore** — ระบบประวัติการลบและกู้คืนข้อมูลนักเรียน ค้นหาผู้ลบ (ครู/แอดมิน) บันทึกและกู้คืนสิทธิ์ให้เฉพาะ Admin/Teacher |
| 3 มิ.ย. 2569 | ✅ | **SUPER_ADMIN Role Integration** — เพิ่มระดับสิทธิ์ SUPER_ADMIN ควบคุมการปรับแต่งสิทธิ์ผู้ใช้งานและปีการศึกษา ปิดกั้น ADMIN ทั่วไปให้เป็น Read Only ในหน้าตั้งค่าระบบ |
| 3 มิ.ย. 2569 | ✅ | **Students Page Access Restrictions for TEACHER** — ซ่อนเมนูจัดการข้อมูลนักเรียนใน Sidebar และจำกัดสิทธิ์หน้าจอ /students ให้เข้าได้เฉพาะ ADMIN และ SUPER_ADMIN เท่านั้น (TEACHER จะถูกซ่อนและล็อกสิทธิ์) |
| 3 มิ.ย. 2569 | ✅ | **Settings Custom Modal Overhaul** — ยกเลิกการใช้ alert/confirm ของบราวเซอร์ในหน้าตั้งค่าระบบ แล้วเปลี่ยนมาใช้ Premium React Modal ที่เป็นดีไซน์เดียวกันในระบบเพื่อยกระดับ UI/UX |
| 3 มิ.ย. 2569 | ✅ | **Teacher Simulation Card Grid for Admins** — จัดทำหน้าเลือกการ์ดรายชื่อครูและจำลองสิทธิ์เป็นครูประจำวิชา/ที่ปรึกษาทั่วทั้งระบบ ได้แก่ ตารางสอน (`Schedules`), เช็คแถว (`Homeroom`), เช็ควิชา (`Attendance`), รายการเยี่ยมบ้าน (`StudentsList`) และระบบช่วยเหลือคัดกรองนักเรียน (`studentsupport/index.tsx`) เพื่อให้แอดมินและซูเปอร์แอดมินจำลองทำหน้าที่หรือดูรายงานแทนได้ |
| 3 มิ.ย. 2569 | ✅ | **Admin/Super Admin Home Visit Form Access Fix** — ปรับปรุงใน `visitService.ts` เพื่อ bypass ตัวกรอง `teacher_id` สำหรับบทบาท ADMIN และ SUPER_ADMIN ช่วยให้แอดมินสามารถเปิดดูข้อมูลและบันทึกข้อมูลเยี่ยมบ้านแทนครูได้ทุกคนโดยไม่โหลดค้าง |
| 3 มิ.ย. 2569 | ✅ | **React Reference & undefined supabase Bugs Fixed** — แก้ไขปัญหา `React is not defined` ในหน้า Attendance.tsx และบั๊ก `supabase is not defined` ใน StudentsList.tsx ซึ่งเคยส่งผลให้หน้าคัดเลือกครูของระบบค้างสถานะกำลังโหลดอยู่ตลอดเวลา |

---

## 👤 Role Roadmap (การพัฒนาสิทธิ์ผู้ใช้งาน)

การสลับแดชบอร์ดตามสิทธิ์และทิศทางการวางโครงสร้างระบบสิทธิ์ในอนาคต:

```
[ปัจจุบัน]                         [สิทธิ์ที่จะขยายตัวเพิ่มในอนาคต]
- SUPER_ADMIN (สิทธิ์สูงสุด)        ──> SCHOOL_ADMIN (แอดมินของโรงเรียนแต่ละแห่ง)
- ADMIN (แอดมินทั่วไป - Read Only)
- TEACHER / ADVISOR (ครูที่ปรึกษา)  ──> HOMEROOM_TEACHER (ครูประจำชั้นจัดกลุ่มคัดกรอง)
                                     COUNSELOR (ครูแนะแนวจัดการสถิติ Risk/Cases)
- PARENT (ผู้ปกครองเด็ก)            ──> PARENT (ยืนยันสิทธิ์ร่วมเพื่อดูข้อมูลประวัติ)
- STUDENT (นักเรียน)               ──> STUDENT (ดูประวัติเข้าแถว รายงาน และ Portfolio)
```

---

## 🚀 แนวทางการพัฒนาต่อยอด

### ฟีเจอร์ที่พร้อมใช้งานแล้วในปัจจุบัน
1. **Academic Year CRUD** — สามารถ CRUD ปีการศึกษาและภาคเรียน พร้อมสลับปีที่ใช้งานหลักในระบบได้แล้ว
2. **Teacher Dashboard** — มีหน้าแดชบอร์ดสรุปรายวันของครูพร้อมทางลัดเช็คชื่อและข้อมูลเด็กเสี่ยง
3. **Parent Dashboard** — ระบบเชื่อมข้อมูลลูกหลายคน สรุปเวลาเรียน ใบลา ผล SDQ/EQ
4. **Student Portfolio** — ระบบเพิ่ม แก้ไข ลบ ผลงานนักเรียนพร้อมลิงก์ใบประกาศ/เกียรติบัตร
5. **Academic Year System-wide Filter (Phase 2)** — ระบบคัดกรองข้อมูลปีการศึกษา/ภาคเรียนแบบ Global คัดกรองนักเรียน ห้องเรียน ตารางสอน เช็คแถว เยี่ยมบ้าน แบบประเมิน SDQ/EQ เคส และแดชบอร์ดทั้งระบบ

### แผนงานขั้นถัดไป (Phase 3)
1. **LINE / Telegram Notification** — ดึง `line_user_id` และ `telegram_user_id` ในระบบเพื่อส่งผลสแกนและใบลาผู้ปกครองอัตโนมัติ
2. **Advanced Reports** — การออกรายงาน PDF ประจำปี/ภาคเรียนของผลคัดกรองและประวัตินักเรียน ยอดขาด ลา มาสาย รายบุคคล/รายห้องแบบเป็นทางการ
3. **Behavior Points System** — ระบบคะแนนพฤติกรรม (ตัดคะแนน/เพิ่มความดี) เชื่อมโยงความเสี่ยง 360° ปรับระดับเกณฑ์ช่วยเหลือแบบ Real-time

---

## 🔍 การตั้งค่าข้อมูลเริ่มต้นระบบ (Initial Data Setup)

### ปัญหา: แถบเลือก "ปีการศึกษา / ภาคเรียน" ขึ้นสถานะ "กำลังโหลด..." และคลิกเลือกไม่ได้
* **สาเหตุ:** เกิดจากในฐานข้อมูล Supabase (ตาราง `academic_years` และ `semesters`) ยังไม่มีการบันทึกข้อมูลปีการศึกษาใดๆ อยู่เลย (ตารางเป็นค่าว่างเปล่า `[]`) ทำให้ Zustand Store ดึงข้อมูลได้เป็นอาร์เรย์ว่าง ระบบจึงไม่มีรายการปีการศึกษามาแสดง และปิดใช้งาน (Disabled) ช่องเลือกภาคเรียนเนื่องจากไม่มีความสัมพันธ์ข้อมูล
* **วิธีการแก้ไขและตั้งค่าเพื่อใช้งานต่อในครั้งถัดไป:**
  1. เข้าใช้งานแอปพลิเคชันด้วยผู้ใช้งานที่มีสิทธิ์เป็นผู้ดูแลระบบ (`ADMIN`)
  2. เดินทางไปยังหน้าระบบ **"ปีการศึกษา"** (หรือ URL: `/academic-years`)
  3. คลิกปุ่ม **"+ เพิ่มปีการศึกษา"** (ระบุเลขปีการศึกษา เช่น `2569` และข้อมูลอื่นๆ) ซึ่งระบบจะสร้างภาคเรียนที่ 1 และ ภาคเรียนที่ 2 ให้โดยอัตโนมัติ
  4. คลิกปุ่ม **"เปิดใช้งาน (Active)"** ที่ปีการศึกษาและภาคเรียนย่อยที่เพิ่มเข้ามา เพื่อใช้เป็นข้อมูลหลักในปัจจุบัน
  5. เมื่อรีเฟรชหน้าเว็บ ตัวเลือก "ปีการศึกษา / ภาคเรียน" ด้านข้างจะเปลี่ยนจาก "กำลังโหลด..." เป็นข้อมูลปีที่เราเพิ่งเปิดใช้งานและสามารถคลิกเลือกสลับดูข้อมูลได้อย่างสมบูรณ์

---

> 💡 **สำหรับ AI:** เมื่อได้รับคำสั่งให้พัฒนาฟีเจอร์ใหม่ ให้อ่านไฟล์นี้ก่อน → ทำตาม Patterns ใน section "Patterns สำคัญ" → ตรวจสอบกฎใน "กฎสำคัญ" → สร้าง Service → Page → Route ตามลำดับ
