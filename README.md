# 🏫 School Attendance Management System (SAMS)

ระบบจัดการการเข้าเรียน (School Attendance Management System) เป็นแอปพลิเคชันบนเว็บที่ออกแบบมาเพื่อช่วยเหลือครูผู้สอนและฝ่ายบริหารสถานศึกษาในการบันทึก ติดตาม และวิเคราะห์ข้อมูลการเข้าเรียนของนักเรียนได้อย่างรวดเร็ว แม่นยำ และมีประสิทธิภาพ ช่วยลดภาระงานเอกสารซ้ำซ้อน และเปลี่ยนข้อมูลให้กลายเป็นสถิติเชิงลึกสำหรับผู้บริหารเพื่อใช้ในการตัดสินใจได้ทันที

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

<div align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
</div>
<br/>

*   **Frontend Framework:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS v4, Lucide React (Icons)
*   **State Management & Data Fetching:** Zustand, React Query (@tanstack/react-query)
*   **Data Visualization:** Recharts (Advanced Executive Graphs)
*   **Backend & Database:** Supabase (PostgreSQL, Row Level Security, RPC)
*   **Tools:** HTML5-QRCode (สแกนคิวอาร์โค้ด)

---

## ✨ คุณสมบัติเด่นของระบบ (Key Features)

### 📊 หน้าแสดงผลและสรุป (Executive Dashboard)
*   **Real-time Analytics:** สรุปตัวเลขนักเรียน ห้องเรียน และบุคลากรทั้งหมดแบบเรียลไทม์
*   **Advanced Visualizations:** กราฟวิเคราะห์ขั้นสูงสำหรับผู้บริหาร (เช่น Gauge Chart สำหรับอัตราเข้าเรียนเฉลี่ยรายเดือน และ 100% Stacked Bar สำหรับสัดส่วนสถานะการเข้าเรียน)
*   **Risk Detection:** ระบบแจ้งเตือน 5 อันดับห้องเรียนที่มีความเสี่ยง (Top 5 At-Risk Classrooms)
*   **On-Demand Loading:** ฟีเจอร์โหลดกราฟวิเคราะห์เมื่อต้องการ เพื่อประหยัดโควต้าฐานข้อมูล (Supabase Free Tier)

### 📅 ระบบบันทึกเวลาเรียนและเข้าแถว (Attendance & Homeroom)
*   **Homeroom Check:** ระบบเช็คชื่อเข้าแถวประจำวัน แยกสถานะ (มา, สาย, ขาด, ลา)
*   **Subject Attendance:** ระบบเช็คชื่อแยกตามรายวิชาและคาบเรียน 
*   **Color Consistency:** ระบบจดจำและผูกสีรายวิชา/รายห้องเรียนแบบ deterministic (แฮชโค้ด) เพื่อความเป็นระเบียบและจดจำง่าย
*   **Offline Fallback:** มีระบบจำการตั้งค่าธีมเบื้องต้นลงใน Local Storage

### ⚙️ ระบบจัดการและรายงาน (Management & Reports)
*   **Theme & Branding System:** ธีม Gradient หลายรูปแบบที่สอดคล้องกับสีประจำสถานศึกษา พร้อมจำค่าผู้ใช้งาน
*   **Role-Based Access Control (RLS):** ระบบรักษาความปลอดภัยข้อมูลระดับแถวตามสิทธิ์การใช้งานของครูและผู้บริหาร

---

## 📂 โครงสร้างของโปรเจกต์ (Project Structure)

```text
frontend/
├── public/                # ไฟล์สแตติก (เช่น รูปภาพโลโก้, favicon)
├── src/
│   ├── assets/            # รูปภาพและสไตล์ (เช่น index.css, App.css)
│   ├── lib/               # ไฟล์ตั้งค่าไลบรารีภายนอก (เช่น supabase.ts)
│   ├── pages/             # หน้าจอ UI ต่างๆ (Dashboard.tsx, Homeroom.tsx, Settings.tsx)
│   ├── services/          # โค้ดสำหรับติดต่อ Backend/DB (เช่น dashboardService.ts)
│   ├── store/             # ระบบจัดการ State ส่วนกลาง (Zustand)
│   ├── App.tsx            # ไฟล์หลักกำหนดโครงสร้าง Layout และ Router
│   └── main.tsx           # จุดเริ่มต้นของ React Application
├── package.json           # รายชื่อ Dependencies และคำสั่ง Script
├── .env.example           # ไฟล์ตัวอย่างสำหรับการตั้งค่าตัวแปรระบบ
└── vite.config.ts         # การตั้งค่า Vite bundler
```
*(ใน Root folder หลัก จะมีไฟล์นามสกุล `.sql` สำหรับนำไปรันบน Supabase เพื่อสร้าง Database Schema)*

---

## 🚀 ขั้นตอนการเริ่มใช้งาน (Getting Started)

### 1. Prerequisites (สิ่งที่ต้องมี)
*   **Node.js:** เวอร์ชั่น 18.0 ขึ้นไป
*   **Git:** สำหรับ Clone โปรเจกต์
*   บัญชี **Supabase** สำหรับใช้งาน Database และ Auth

### 2. Installation (การติดตั้ง)
โคลน Repository มายังเครื่องของคุณและติดตั้ง Dependencies:

```bash
# Clone the repository
git clone <repository-url>

# Navigate into the frontend directory
cd sams-school-system/frontend

# Install dependencies
npm install
```

### 3. Environment Variables (การตั้งค่าตัวแปรแวดล้อม)
สร้างไฟล์ `.env` ไว้ในโฟลเดอร์ `frontend/` และคัดลอกตัวแปรด้านล่างนี้ไปใส่:

```env
# URL ของโปรเจกต์ Supabase ของคุณ
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co

# กุญแจ API แบบ public (Anon Key)
VITE_SUPABASE_ANON_KEY=sb_publishable_<your-anon-key>
```
> **หมายเหตุ:** นำค่าเหล่านี้มาจากหน้า `Project Settings > API` ใน Dashboard ของ Supabase

### 4. Running the Application (การรันระบบ)
**โหมดการพัฒนา (Development Mode):**
```bash
npm run dev
```
*(ระบบจะรันบน `http://localhost:5173`)*

**การสร้าง Build สำหรับขึ้น Production:**
```bash
npm run build
```

---

## 🔧 การตั้งค่าระบบหลังบ้านเพิ่มเติม (Configuration & Deployment)

ระบบนี้ใช้ **Supabase** เป็นฐานข้อมูลและระบบจัดการผู้ใช้งาน 
คุณจำเป็นต้องสร้างตาราง ฟังก์ชัน และนโยบายความปลอดภัย (RLS) โดยใช้ไฟล์ SQL ที่เตรียมไว้ให้ใน Root Folder ดังนี้:

1. ล็อกอินเข้าสู่ Supabase Dashboard ของคุณ
2. ไปที่เมนู **SQL Editor**
3. คัดลอกและนำไปรัน (Run) ทีละไฟล์ตามลำดับความสำคัญ (หรือไฟล์ล่าสุดที่มี):
   - `supabase_schema.sql` (สร้างโครงสร้างตารางทั้งหมด)
   - `rpc_create_teacher.sql` (ฟังก์ชันเพิ่มครู)
   - `rpc_save_attendance.sql` (ฟังก์ชันบันทึกเวลาเรียน)
   - *ไฟล์ `.sql` อื่นๆ เพื่อสร้าง Groups และอัปเดตสิทธิ์ (RLS)*
4. สำหรับการนำขึ้นระบบจริง (Deployment) สามารถฝากโค้ดชุดนี้ไปดีพลอยผ่าน Vercel, Netlify หรือ Cloudflare Pages ได้ทันที (เพียงแค่ใส่ Env Vars ตามที่ระบุไว้)

---

## 👨‍💻 ผู้พัฒนาและเงื่อนไขสิทธิ์การใช้งาน (Credits & Terms of Use)

### Credits
ออกแบบและพัฒนาโดย: **Pichet.S**

### Terms of Use (เงื่อนไขเฉพาะ)
*   ✅ **Allowed:** อนุญาตให้บุคคลทั่วไป สถานศึกษา หรือองค์กร นำไปติดตั้ง ใช้งาน ดัดแปลง หรือพัฒนาต่อยอดเพื่อประโยชน์ทางการศึกษาและใช้งานภายในองค์กรได้**ฟรี**
*   ❌ **Prohibited:** **ห้าม**นำซอฟต์แวร์นี้ หรือส่วนหนึ่งส่วนใดของโค้ดไปจำหน่าย จ่ายแจกในเชิงพาณิชย์ หรือนำไปใช้เพื่อแสวงหาผลประโยชน์ทางการค้าโดยเด็ดขาด
*   ⚠️ **Attribution Required:** ทุกการนำไปใช้งานหรือดัดแปลง จะต้องคงเครดิตชื่อผู้พัฒนาดั้งเดิม (**Pichet.S**) ไว้ในระบบเสมอ ห้ามลบออก
*   ⚖️ **Disclaimer:** ซอฟต์แวร์นี้แจกจ่ายให้ใช้งานตามสภาพที่เป็นอยู่ (As-Is) ผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายหรือข้อผิดพลาดใดๆ ที่เกิดขึ้นจากการใช้งานระบบนี้

---
*If you find this project helpful for your school, consider giving it a ⭐ on GitHub!*