# School Attendance Management System
## ระบบเช็คการเข้าเรียน + เข้าแถว นักเรียน ม.1 - ม.6

---

# 1. Project Overview

ระบบสำหรับจัดการ

- เช็คเข้าแถว
- เช็คเข้าเรียนรายคาบ
- จัดการนักเรียน
- จัดการครู
- จัดการวิชาเรียน
- จัดการตารางเรียน
- ระบบลาเรียน
- Dashboard และ Reports
- ระบบแจ้งเตือนผู้ปกครอง
- รองรับ Realtime
- รองรับ Mobile และ Web

---

# 2. Technology Stack

## Frontend
- React
- Vite
- TypeScript
- TailwindCSS
- React Router
- React Query
- Zustand

## Backend
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions

## Deployment
- GitHub
- Vercel

---

# 3. System Architecture

```text
Frontend (React)
    ↓
Supabase Auth
    ↓
Supabase API
    ↓
PostgreSQL Database
    ↓
Realtime + Storage

4. User Roles
Admin

สามารถจัดการทุกอย่างในระบบ

Teacher

จัดการเช็คชื่อและวิชาที่สอน

Advisor

ดูข้อมูลเฉพาะห้องที่ดูแล

Student

ดูข้อมูลของตนเอง

Parent

ดูข้อมูลของบุตร

5. Core Modules
Authentication Module
Login
Logout
JWT Authentication
Session Validation
Role-based Access Control
Student Module
เพิ่มนักเรียน
แก้ไขนักเรียน
ลบนักเรียน
นำเข้าข้อมูล Excel
จัดการห้องเรียน
Teacher Module
เพิ่มครู
จัดการวิชาที่สอน
จัดการตารางสอน
Subject Module
เพิ่มวิชาเรียน
แก้ไขวิชา
ปิดวิชา
กำหนดครูผู้สอน
กำหนดระดับชั้น
กำหนดภาคเรียน
Classroom Module
เพิ่มห้องเรียน
จัดการครูที่ปรึกษา
จัดการนักเรียนในห้อง
Schedule Module
เพิ่มตารางเรียน
ตรวจสอบเวลาซ้ำ
ตรวจสอบครูสอนชนกัน
ตรวจสอบห้องเรียนชนกัน
Attendance Module
เช็คเข้าเรียนรายคาบ
QR Code Check-in
GPS Validation
Device Validation
Realtime Attendance
Homeroom Attendance Module
เช็คเข้าแถว
QR Check-in
สรุปสถิติรายวัน
Leave Request Module
ส่งใบลา
อนุมัติใบลา
แนบเอกสาร
Notification Module
LINE Notification
Email Notification
SMS Notification
Reports Module
รายงาน PDF
Export Excel
Export CSV
Dashboard Statistics
Audit Log Module
เก็บประวัติการแก้ไข
เก็บ IP Address
เก็บ Device
6. Database Tables
users
id
email
password
role
created_at
updated_at
roles
id
name
permissions
students
id
student_code
citizen_id
prefix
first_name
last_name
nickname
gender
birth_date
phone
address
classroom_id
parent_id
photo_url
status
created_at
parents
id
first_name
last_name
phone
email
line_user_id
teachers
id
teacher_code
first_name
last_name
phone
email
department
photo_url
classrooms
id
level
room
academic_year_id
advisor_id
subjects
id
subject_code
subject_name
subject_name_en
description
department
credit
semester_id
academic_year_id
teacher_id
status
schedules
id
subject_id
teacher_id
classroom_id
day_of_week
period
start_time
end_time
room_name
attendance_sessions
id
subject_id
teacher_id
schedule_id
session_date
start_time
end_time
qr_code
status
attendance
id
student_id
session_id
checkin_time
status
gps_latitude
gps_longitude
device_id
ip_address
homeroom_attendance
id
student_id
attendance_date
checkin_time
status
gps_latitude
gps_longitude
device_id
leave_requests
id
student_id
leave_type
start_date
end_date
reason
attachment_url
approved_by
status
notifications
id
user_id
title
message
type
is_read
created_at
academic_years
id
year_name
status
semesters
id
semester_name
academic_year_id
status
audit_logs
id
user_id
action
table_name
record_id
ip_address
device
created_at
7. Attendance Status
Status Types
PRESENT
LATE
ABSENT
LEAVE
8. Attendance Process
Homeroom Attendance
1. Admin/Teacher เปิดเวลาเช็คเข้าแถว
2. ระบบสร้าง QR Code
3. นักเรียนสแกน QR
4. ระบบตรวจสอบ GPS
5. ระบบบันทึกเวลา
6. ระบบคำนวณสถานะ
7. บันทึกลง Database
Classroom Attendance
1. ครูเปิด Session
2. ระบบสร้าง QR Dynamic
3. นักเรียนเช็คชื่อ
4. ระบบตรวจสอบเวลา
5. ระบบตรวจสอบ GPS
6. ระบบตรวจสอบ Device
7. ระบบบันทึกข้อมูล
9. Business Rules
Late Rules
ถ้าเวลาเช็ค > เวลาเริ่มเรียน
= LATE
Absent Rules
ไม่มีข้อมูลเช็คชื่อ
= ABSENT
Leave Rules
มีใบลาอนุมัติ
= LEAVE
10. Security Requirements
Authentication
JWT Authentication
Secure Session
Refresh Token
Authorization
Row Level Security (RLS)
Role-based Access
Anti Cheat
GPS Validation
QR Expiration
Device Validation
Session Timeout
Audit
Track User Actions
Track Device
Track IP Address
11. Realtime Features
Realtime Attendance
Live Dashboard
Live Student Status
Realtime Notifications
12. Dashboard Requirements
Admin Dashboard
จำนวนมาเรียน
จำนวนขาดเรียน
นักเรียนเสี่ยง
ห้องที่ขาดมากสุด
กราฟรายวัน
กราฟรายเดือน
Teacher Dashboard
รายชื่อนักเรียน
เช็คชื่อรายคาบ
สรุปสถิติวิชา
Student Dashboard
ตารางเรียนวันนี้
สถานะเข้าเรียน
ประวัติย้อนหลัง
Parent Dashboard
สถานะบุตร
แจ้งเตือน
ประวัติการลา
13. API Requirements
Auth API
login
logout
refresh-token
Student API
create student
update student
delete student
list students
Subject API
create subject
update subject
delete subject
assign teacher
Attendance API
create session
check-in
get attendance
update attendance
14. File Storage Requirements

ใช้ Supabase Storage สำหรับ

รูปนักเรียน
รูปครู
เอกสารลาเรียน
QR Images
15. Frontend Structure
src/
 ├── app/
 ├── pages/
 ├── components/
 ├── layouts/
 ├── hooks/
 ├── services/
 ├── store/
 ├── routes/
 ├── utils/
 ├── types/
 └── lib/
16. Recommended UI Pages
Public
Login Page
Admin
Dashboard
Students
Teachers
Subjects
Schedules
Reports
Settings
Teacher
Dashboard
Attendance
My Subjects
Students
Student
Dashboard
My Attendance
My Schedule
Leave Requests
Parent
Child Dashboard
Notifications
17. Deployment Requirements
GitHub
Source Control
Branch Management
Vercel
Frontend Deployment
Environment Variables
Supabase
Database
Authentication
Storage
Realtime
18. Environment Variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
19. Future Features
Face Recognition
AI Risk Analysis
Mobile Application
Parent Mobile App
Behavioral Score
Activity System
Online Examination
NFC/RFID Attendance
20. Development Roadmap
Phase 1
Authentication
Student Management
Subject Management
Schedule Management
Attendance System
Dashboard
Phase 2
QR Dynamic
GPS Validation
Notification System
Export Reports
Phase 3
Mobile App
AI Features
Face Recognition
Parent Portal
21. Development Guidelines
Coding Standards
Use TypeScript
Use ESLint
Use Prettier
Component-based Architecture
Performance
Lazy Loading
Pagination
Caching
Optimized Queries
Security
Never expose Service Role Key
Use RLS in every table
Validate all API inputs
22. Expected Outcome

ระบบสามารถ

เช็คเข้าแถวได้
เช็คเข้าเรียนได้
เพิ่มวิชาเรียนได้
จัดการตารางเรียนได้
ดูรายงานได้
แจ้งเตือนได้
รองรับผู้ใช้งานหลายระดับ
รองรับ Realtime
รองรับ Mobile
ขยายระบบในอนาคตได้ง่าย