# 🔐 แผนเปิดใช้งาน Row Level Security (RLS) — ระบบ SAMS

> **เป้าหมาย:** เปลี่ยนจาก Policy แบบเปิดกว้าง (`USING (true)`) เป็น Policy ที่ตรวจสอบสิทธิ์จริง เพื่อปกป้องข้อมูลในระดับแถวของฐานข้อมูล

---

## 📋 สารบัญ

1. [ภาพรวมระบบและ Role](#1-ภาพรวมระบบและ-role)
2. [หลักการออกแบบ RLS Policy](#2-หลักการออกแบบ-rls-policy)
3. [ขั้นตอนเตรียมความพร้อม (Phase 0)](#phase-0--เตรียมความพร้อม)
4. [Phase 1 — Master Data (อ่านอย่างเดียว)](#phase-1--master-data-อ่านอย่างเดียว)
5. [Phase 2 — ข้อมูลบุคลากร (teachers, users)](#phase-2--ข้อมูลบุคลากร)
6. [Phase 3 — ข้อมูลนักเรียนและห้องเรียน](#phase-3--ข้อมูลนักเรียนและห้องเรียน)
7. [Phase 4 — ระบบเช็คชื่อ/ลา/เข้าแถว](#phase-4--ระบบเช็คชื่อลาเข้าแถว)
8. [Phase 5 — ระบบดูแลช่วยเหลือนักเรียน](#phase-5--ระบบดูแลช่วยเหลือนักเรียน)
9. [Phase 6 — Audit Logs & Notifications](#phase-6--audit-logs--notifications)
10. [Checklist ทดสอบหลังเปิด RLS](#checklist-ทดสอบหลังเปิด-rls)

---

## 1. ภาพรวมระบบและ Role

### ตารางทั้งหมดในระบบ (24 ตาราง)

| # | ตาราง | หมวดหมู่ | Phase |
|---|-------|---------|-------|
| 1 | `academic_years` | Master Data | 1 |
| 2 | `semesters` | Master Data | 1 |
| 3 | `subjects` | Master Data | 1 |
| 4 | `users` | บุคลากร | 2 |
| 5 | `teachers` | บุคลากร | 2 |
| 6 | `parents` | บุคลากร/ผู้ปกครอง | 2 |
| 7 | `classrooms` | ข้อมูลห้องเรียน | 3 |
| 8 | `students` | ข้อมูลนักเรียน | 3 |
| 9 | `student_group_memberships` | ข้อมูลนักเรียน | 3 |
| 10 | `activity_groups` | ข้อมูลกิจกรรม | 3 |
| 11 | `activity_group_members` | ข้อมูลกิจกรรม | 3 |
| 12 | `student_portfolios` | ข้อมูลนักเรียน | 3 |
| 13 | `schedules` | ระบบเช็คชื่อ | 4 |
| 14 | `attendance_sessions` | ระบบเช็คชื่อ | 4 |
| 15 | `attendance` | ระบบเช็คชื่อ | 4 |
| 16 | `homeroom_attendance` | ระบบเข้าแถว | 4 |
| 17 | `leave_requests` | ระบบลา | 4 |
| 18 | `home_visits` | ระบบเยี่ยมบ้าน | 4 |
| 19 | `home_visit_assessments` | ระบบเยี่ยมบ้าน | 4 |
| 20 | `home_visit_photos` | ระบบเยี่ยมบ้าน | 4 |
| 21 | `student_support_sdq` | ระบบดูแลช่วยเหลือ | 5 |
| 22 | `student_support_eq` | ระบบดูแลช่วยเหลือ | 5 |
| 23 | `student_support_risk_analysis` | ระบบดูแลช่วยเหลือ | 5 |
| 24 | `student_support_cases` | ระบบดูแลช่วยเหลือ | 5 |
| 25 | `student_support_case_logs` | ระบบดูแลช่วยเหลือ | 5 |
| 26 | `student_behavior_points` | ระบบดูแลช่วยเหลือ | 5 |
| 27 | `audit_logs` | Audit & Log | 6 |
| 28 | `notifications` | Notification | 6 |

### Role ในระบบ

| Role | อ่านข้อมูล | แก้ไขข้อมูล | จัดการระบบ |
|------|-----------|------------|-----------|
| **ADMIN** | ทุกข้อมูล | ทุกข้อมูล | ✅ จัดการปีการศึกษา, สิทธิ์ผู้ใช้ |
| **EXECUTIVE** | ทุกข้อมูล (ดูภาพรวม) | เฉพาะที่เกี่ยวข้อง | ❌ |
| **TEACHER** | ข้อมูลในห้อง/วิชาที่รับผิดชอบ | ข้อมูลที่ตนบันทึก | ❌ |
| **PARENT** | ข้อมูลบุตรหลานตนเองเท่านั้น | ❌ | ❌ |
| **STUDENT** | ข้อมูลตนเองเท่านั้น | เช็คชื่อ QR | ❌ |
| **anon** | ❌ ปิดทั้งหมด | ❌ | ❌ |

---

## 2. หลักการออกแบบ RLS Policy

### 2.1 หลักคิด

```
1. ปิด anon ทุกตาราง → ผู้ที่ไม่ Login จะเข้าถึงข้อมูลไม่ได้
2. authenticated → ต้องตรวจ role เพิ่มเติมจากตาราง users
3. service_role → ข้ามสิทธิ์ RLS ทั้งหมด (สำหรับ Edge Functions / Triggers)
4. ทดสอบทีละ Phase → ถ้าพังสามารถ Rollback ได้ทันที
```

### 2.2 Helper Function สำหรับตรวจ Role

> [!IMPORTANT]
> **ฟังก์ชันนี้ต้องสร้างก่อน Phase 1** เพราะทุก Policy จะเรียกใช้งาน

```sql
-- ==========================================
-- Helper Function: ดึง role ของผู้ใช้งานปัจจุบัน
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- Helper Function: ดึง teacher_id ของผู้ใช้งานปัจจุบัน
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM public.teachers WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- Helper Function: ตรวจสอบว่าเป็น Admin หรือไม่
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- Helper Function: ตรวจสอบว่าเป็น Admin หรือ Executive หรือไม่
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin_or_executive()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('ADMIN', 'EXECUTIVE')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

> [!TIP]
> ใช้ `SECURITY DEFINER` เพื่อให้ฟังก์ชันทำงานด้วยสิทธิ์ของผู้สร้าง (superuser) ไม่ถูก RLS ของตาราง `users` บล็อก

---

## Phase 0 — เตรียมความพร้อม

### ขั้นตอน

- [ ] **0.1** ตรวจสอบว่าตาราง `users` มีข้อมูล role ครบทุก user
- [ ] **0.2** ตรวจสอบว่าตาราง `teachers` มีคอลัมน์ `user_id` ที่เชื่อมกับ `auth.users(id)`
- [ ] **0.3** สร้าง Helper Functions (SQL ด้านบน)
- [ ] **0.4** สำรองข้อมูล (Backup Database) ก่อนเริ่มงาน
- [ ] **0.5** เตรียม account ทดสอบอย่างน้อย 3 ตัว: `ADMIN`, `TEACHER`, `PARENT`

### ตรวจสอบข้อมูลเบื้องต้น

```sql
-- ตรวจว่ามี user ที่ไม่มี role หรือไม่
SELECT id, email, role FROM public.users WHERE role IS NULL;

-- ตรวจว่า teachers มี user_id หรือยัง
SELECT id, first_name, last_name, user_id FROM public.teachers WHERE user_id IS NULL;

-- ตรวจว่า students มี user_id หรือยัง (ถ้ามีระบบ login นักเรียน)
SELECT id, first_name, last_name, user_id FROM public.students WHERE user_id IS NOT NULL LIMIT 5;
```

> [!WARNING]
> ถ้า `teachers.user_id` ไม่มีคอลัมน์นี้ ต้องเพิ่มก่อน:
> ```sql
> ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
> ```
> แล้วอัปเดตข้อมูลให้ครบก่อนเริ่ม Phase 1

---

## Phase 1 — Master Data (อ่านอย่างเดียว)

### ตารางที่เกี่ยวข้อง
- `academic_years` — ปีการศึกษา
- `semesters` — ภาคเรียน
- `subjects` — รายวิชา

### หลักการ
- **SELECT**: ทุก authenticated user อ่านได้
- **INSERT / UPDATE / DELETE**: เฉพาะ ADMIN เท่านั้น
- **anon**: ปิดทั้งหมด

### ขั้นตอนการทำ (ทำทีละตาราง)

---

#### 1.1 ตาราง `academic_years`

```sql
-- === ขั้นตอนที่ 1: ลบ Policy เดิม ===
DROP POLICY IF EXISTS "Allow select for testing" ON public.academic_years;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.academic_years;
DROP POLICY IF EXISTS "Allow update for testing" ON public.academic_years;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.academic_years;

-- === ขั้นตอนที่ 2: สร้าง Policy ใหม่ ===
-- อ่าน: ทุกคนที่ login แล้ว
CREATE POLICY "authenticated_select"
  ON public.academic_years FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม: เฉพาะ Admin
CREATE POLICY "admin_insert"
  ON public.academic_years FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- แก้ไข: เฉพาะ Admin
CREATE POLICY "admin_update"
  ON public.academic_years FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.academic_years FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- === ขั้นตอนที่ 3: ถอนสิทธิ์ anon ===
REVOKE ALL ON public.academic_years FROM anon;

-- === ขั้นตอนที่ 4: ตรวจสอบ ===
-- ลอง login ด้วย TEACHER account แล้ว SELECT → ต้องได้ข้อมูล
-- ลอง INSERT → ต้อง error
```

✅ **ทดสอบแล้วผ่าน** → ไปตารางต่อไป

---

#### 1.2 ตาราง `semesters`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.semesters;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.semesters;
DROP POLICY IF EXISTS "Allow update for testing" ON public.semesters;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.semesters;

CREATE POLICY "authenticated_select"
  ON public.semesters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_insert"
  ON public.semesters FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.semesters FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.semesters FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.semesters FROM anon;
```

---

#### 1.3 ตาราง `subjects`

```sql
-- ตรวจสอบว่าเปิด RLS แล้วหรือยัง
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- ลบ Policy เดิม (ถ้ามี)
DROP POLICY IF EXISTS "Allow select for testing" ON public.subjects;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.subjects;
DROP POLICY IF EXISTS "Allow update for testing" ON public.subjects;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.subjects;

CREATE POLICY "authenticated_select"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_insert"
  ON public.subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.subjects FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.subjects FROM anon;
GRANT SELECT ON public.subjects TO authenticated;
```

> [!NOTE]
> หลังจากทำ Phase 1 เสร็จ ให้ทดสอบหน้า **จัดการปีการศึกษา** และ **จัดการรายวิชา** ว่ายังทำงานได้ปกติ

---

## Phase 2 — ข้อมูลบุคลากร

### ตารางที่เกี่ยวข้อง
- `users` — บัญชีผู้ใช้งาน
- `teachers` — ข้อมูลครู/บุคลากร
- `parents` — ข้อมูลผู้ปกครอง

---

#### 2.1 ตาราง `users`

> [!CAUTION]
> ตาราง `users` เป็นตารางที่สำคัญมาก ถ้า Policy ผิดจะทำให้ทั้งระบบเข้าไม่ได้ ทดสอบอย่างละเอียด!

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.users;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.users;
DROP POLICY IF EXISTS "Allow update for testing" ON public.users;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.users;

-- อ่าน: ดูข้อมูลตัวเอง (ทุก role) + Admin ดูทุกคน
CREATE POLICY "select_own_or_admin"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()  -- ดูของตัวเอง
    OR
    public.is_admin()  -- Admin ดูทุกคน
  );

-- เพิ่ม: เฉพาะ Admin (สร้าง user ใหม่ผ่าน Admin Panel)
CREATE POLICY "admin_insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- แก้ไข: Admin แก้ได้ทุกคน (เช่น เปลี่ยน role)
CREATE POLICY "admin_update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.users FROM anon;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
```

> [!WARNING]
> **ปัญหาที่อาจเกิด:** ฟังก์ชัน `get_user_role()` อ่านจากตาราง `users` — แต่เพราะใช้ `SECURITY DEFINER` จึงข้าม RLS ได้ ไม่มีปัญหา circular dependency

---

#### 2.2 ตาราง `teachers`

```sql
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.teachers;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.teachers;
DROP POLICY IF EXISTS "Allow update for testing" ON public.teachers;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.teachers;

-- อ่าน: ทุก authenticated user (ใช้แสดงชื่อครูในหลายหน้า)
CREATE POLICY "authenticated_select"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม: เฉพาะ Admin
CREATE POLICY "admin_insert"
  ON public.teachers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- แก้ไข: Admin หรือตัวเอง
CREATE POLICY "admin_or_self_update"
  ON public.teachers FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()  -- ครูแก้ข้อมูลตนเอง
  );

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.teachers FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.teachers FROM anon;
GRANT ALL ON public.teachers TO authenticated;
```

---

#### 2.3 ตาราง `parents`

```sql
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.parents;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.parents;
DROP POLICY IF EXISTS "Allow update for testing" ON public.parents;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.parents;

-- อ่าน: ครู/Admin อ่านทุกคน, ผู้ปกครองดูตัวเอง
CREATE POLICY "select_parents"
  ON public.parents FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR email = auth.email()  -- ผู้ปกครองดูตนเอง
  );

-- เพิ่ม/แก้ไข/ลบ: เฉพาะ Admin
CREATE POLICY "admin_insert"
  ON public.parents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.parents FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.parents FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.parents FROM anon;
GRANT ALL ON public.parents TO authenticated;
```

> [!NOTE]
> หลังทำ Phase 2 เสร็จ → ทดสอบ **Login** ทุก Role, หน้า **จัดการบุคลากร**, และ **Dashboard ผู้ปกครอง**

---

## Phase 3 — ข้อมูลนักเรียนและห้องเรียน

### ตารางที่เกี่ยวข้อง
- `classrooms` — ห้องเรียน
- `students` — นักเรียน
- `student_group_memberships` — สมาชิกกลุ่ม
- `activity_groups` — กลุ่มกิจกรรม
- `activity_group_members` — สมาชิกกลุ่มกิจกรรม
- `student_portfolios` — ผลงานนักเรียน

---

#### 3.1 ตาราง `classrooms`

```sql
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.classrooms;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.classrooms;
DROP POLICY IF EXISTS "Allow update for testing" ON public.classrooms;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.classrooms;

-- อ่าน: ทุก authenticated user (ใช้แสดงรายชื่อห้อง)
CREATE POLICY "authenticated_select"
  ON public.classrooms FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม/แก้ไข/ลบ: เฉพาะ Admin
CREATE POLICY "admin_insert"
  ON public.classrooms FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update"
  ON public.classrooms FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete"
  ON public.classrooms FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.classrooms FROM anon;
GRANT ALL ON public.classrooms TO authenticated;
```

---

#### 3.2 ตาราง `students`

```sql
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.students;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.students;
DROP POLICY IF EXISTS "Allow update for testing" ON public.students;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.students;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, นักเรียนดูตนเอง, ผู้ปกครองดูบุตรหลาน
CREATE POLICY "select_students"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR user_id = auth.uid()  -- นักเรียนดูตนเอง
    OR parent_id IN (        -- ผู้ปกครองดูบุตรหลาน
      SELECT id FROM public.parents WHERE email = auth.email()
    )
  );

-- เพิ่ม: เฉพาะ Admin
CREATE POLICY "admin_insert"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- แก้ไข: Admin หรือครู (ครูอัปเดตข้อมูลนักเรียนในห้อง)
CREATE POLICY "admin_or_teacher_update"
  ON public.students FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER')
  );

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.students FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.students FROM anon;
GRANT ALL ON public.students TO authenticated;
```

---

#### 3.3 ตาราง `student_group_memberships`

```sql
ALTER TABLE public.student_group_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.student_group_memberships;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_group_memberships;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_group_memberships;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_group_memberships;

-- อ่าน: ครู/Admin/Executive
CREATE POLICY "staff_select"
  ON public.student_group_memberships FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
  );

-- เพิ่ม/ลบ: Admin หรือ Teacher
CREATE POLICY "staff_insert"
  ON public.student_group_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('ADMIN', 'TEACHER')
  );

CREATE POLICY "staff_delete"
  ON public.student_group_memberships FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER')
  );

REVOKE ALL ON public.student_group_memberships FROM anon;
GRANT ALL ON public.student_group_memberships TO authenticated;
```

---

#### 3.4 ตาราง `activity_groups`

```sql
ALTER TABLE public.activity_groups ENABLE ROW LEVEL SECURITY;

-- อ่าน: ทุก authenticated user
CREATE POLICY "authenticated_select"
  ON public.activity_groups FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม/แก้ไข/ลบ: Admin หรือ Teacher
CREATE POLICY "staff_insert"
  ON public.activity_groups FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.activity_groups FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_delete"
  ON public.activity_groups FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.activity_groups FROM anon;
GRANT ALL ON public.activity_groups TO authenticated;
```

---

#### 3.5 ตาราง `activity_group_members`

```sql
ALTER TABLE public.activity_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select"
  ON public.activity_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "staff_insert"
  ON public.activity_group_members FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_delete"
  ON public.activity_group_members FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

REVOKE ALL ON public.activity_group_members FROM anon;
GRANT ALL ON public.activity_group_members TO authenticated;
```

---

#### 3.6 ตาราง `student_portfolios`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_portfolios;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_portfolios;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_portfolios;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_portfolios;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, นักเรียน/ผู้ปกครองดูของตนเอง
CREATE POLICY "select_portfolios"
  ON public.student_portfolios FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม/แก้ไข: ครู หรือ Admin
CREATE POLICY "staff_insert"
  ON public.student_portfolios FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.student_portfolios FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin หรือครูที่สร้าง
CREATE POLICY "owner_or_admin_delete"
  ON public.student_portfolios FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR created_by = public.get_teacher_id()
  );

REVOKE ALL ON public.student_portfolios FROM anon;
GRANT ALL ON public.student_portfolios TO authenticated;
```

> [!NOTE]
> หลังทำ Phase 3 เสร็จ → ทดสอบหน้า **จัดการห้องเรียน**, **รายชื่อนักเรียน**, **กลุ่มกิจกรรม**, **Portfolio**

---

## Phase 4 — ระบบเช็คชื่อ/ลา/เข้าแถว

### ตารางที่เกี่ยวข้อง
- `schedules` — ตารางเรียน
- `attendance_sessions` — รอบเช็คชื่อ
- `attendance` — บันทึกเช็คชื่อรายวิชา
- `homeroom_attendance` — บันทึกเข้าแถว
- `leave_requests` — ใบลา
- `home_visits` — เยี่ยมบ้าน
- `home_visit_assessments` — แบบประเมินเยี่ยมบ้าน
- `home_visit_photos` — รูปภาพเยี่ยมบ้าน

---

#### 4.1 ตาราง `schedules`

```sql
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- อ่าน: ทุก authenticated user (ใช้ดูตารางเรียน)
CREATE POLICY "authenticated_select"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม/แก้ไข: Admin หรือ Teacher
CREATE POLICY "staff_insert"
  ON public.schedules FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.schedules FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin หรือ Teacher
CREATE POLICY "staff_delete"
  ON public.schedules FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

REVOKE ALL ON public.schedules FROM anon;
GRANT ALL ON public.schedules TO authenticated;
```

---

#### 4.2 ตาราง `attendance_sessions`

```sql
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive + นักเรียน (สำหรับ QR scan)
CREATE POLICY "authenticated_select"
  ON public.attendance_sessions FOR SELECT
  TO authenticated
  USING (true);

-- เพิ่ม: ครู (เปิดรอบเช็คชื่อ)
CREATE POLICY "teacher_insert"
  ON public.attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- แก้ไข: ครู (ปิดรอบเช็คชื่อ, refresh QR)
CREATE POLICY "teacher_update"
  ON public.attendance_sessions FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin หรือ Teacher
CREATE POLICY "staff_delete"
  ON public.attendance_sessions FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

REVOKE ALL ON public.attendance_sessions FROM anon;
GRANT ALL ON public.attendance_sessions TO authenticated;
```

---

#### 4.3 ตาราง `attendance`

```sql
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, นักเรียนดูของตัวเอง, ผู้ปกครองดูลูก
CREATE POLICY "select_attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม: ครู หรือ นักเรียน (QR Scan เช็คชื่อ)
CREATE POLICY "insert_attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('ADMIN', 'TEACHER')
    OR (  -- นักเรียนบันทึกเฉพาะของตนเอง
      public.get_user_role() = 'STUDENT'
      AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

-- แก้ไข/ลบ: ครู หรือ Admin
CREATE POLICY "staff_update"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_delete"
  ON public.attendance FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

REVOKE ALL ON public.attendance FROM anon;
GRANT ALL ON public.attendance TO authenticated;
```

---

#### 4.4 ตาราง `homeroom_attendance`

```sql
ALTER TABLE public.homeroom_attendance ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, ผู้ปกครองดูลูก
CREATE POLICY "select_homeroom"
  ON public.homeroom_attendance FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม/แก้ไข: ครู หรือ Admin
CREATE POLICY "staff_insert"
  ON public.homeroom_attendance FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.homeroom_attendance FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: ครู หรือ Admin (ลบเพื่อบันทึกใหม่)
CREATE POLICY "staff_delete"
  ON public.homeroom_attendance FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

REVOKE ALL ON public.homeroom_attendance FROM anon;
GRANT ALL ON public.homeroom_attendance TO authenticated;
```

---

#### 4.5 ตาราง `leave_requests`

```sql
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, ผู้ปกครองดูของบุตรหลาน
CREATE POLICY "select_leave"
  ON public.leave_requests FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม: ครู/Admin + ผู้ปกครอง (ยื่นใบลาให้บุตรหลาน)
CREATE POLICY "insert_leave"
  ON public.leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('ADMIN', 'TEACHER')
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- แก้ไข: ครู/Admin (อนุมัติ/ปฏิเสธ)
CREATE POLICY "staff_update"
  ON public.leave_requests FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.leave_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.leave_requests FROM anon;
GRANT ALL ON public.leave_requests TO authenticated;
```

---

#### 4.6 ตาราง `home_visits`

```sql
ALTER TABLE public.home_visits ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive ดูทุกคน, ผู้ปกครองดูของบุตรหลาน
CREATE POLICY "select_visits"
  ON public.home_visits FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม: ครู หรือ Admin
CREATE POLICY "staff_insert"
  ON public.home_visits FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- แก้ไข: Admin หรือครูเจ้าของบันทึก
CREATE POLICY "owner_or_admin_update"
  ON public.home_visits FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR teacher_id = public.get_teacher_id()
  );

-- ลบ: เฉพาะ Admin
CREATE POLICY "admin_delete"
  ON public.home_visits FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.home_visits FROM anon;
GRANT ALL ON public.home_visits TO authenticated;
```

---

#### 4.7 ตาราง `home_visit_assessments`

```sql
ALTER TABLE public.home_visit_assessments ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive, ผู้ปกครอง (ผ่าน visit → student)
CREATE POLICY "staff_select"
  ON public.home_visit_assessments FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR visit_id IN (
      SELECT hv.id FROM public.home_visits hv
      JOIN public.students s ON hv.student_id = s.id
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม/แก้ไข: ครู หรือ Admin
CREATE POLICY "staff_insert"
  ON public.home_visit_assessments FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.home_visit_assessments FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin
CREATE POLICY "admin_delete"
  ON public.home_visit_assessments FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.home_visit_assessments FROM anon;
GRANT ALL ON public.home_visit_assessments TO authenticated;
```

---

#### 4.8 ตาราง `home_visit_photos`

```sql
ALTER TABLE public.home_visit_photos ENABLE ROW LEVEL SECURITY;

-- อ่าน: ครู/Admin/Executive, ผู้ปกครอง
CREATE POLICY "staff_select"
  ON public.home_visit_photos FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR visit_id IN (
      SELECT hv.id FROM public.home_visits hv
      JOIN public.students s ON hv.student_id = s.id
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม: ครู หรือ Admin
CREATE POLICY "staff_insert"
  ON public.home_visit_photos FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin หรือครูเจ้าของ
CREATE POLICY "admin_delete"
  ON public.home_visit_photos FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR visit_id IN (
      SELECT id FROM public.home_visits WHERE teacher_id = public.get_teacher_id()
    )
  );

REVOKE ALL ON public.home_visit_photos FROM anon;
GRANT ALL ON public.home_visit_photos TO authenticated;
```

> [!NOTE]
> หลังทำ Phase 4 เสร็จ → ทดสอบ **เช็คชื่อรายวิชา (QR)**, **เช็คชื่อเข้าแถว**, **ใบลา**, **เยี่ยมบ้าน**, **Dashboard ผู้ปกครอง**

---

## Phase 5 — ระบบดูแลช่วยเหลือนักเรียน

### ตารางที่เกี่ยวข้อง
- `student_support_sdq` — แบบประเมิน SDQ
- `student_support_eq` — แบบประเมิน EQ
- `student_support_risk_analysis` — วิเคราะห์ความเสี่ยง
- `student_support_cases` — เคสดูแลช่วยเหลือ
- `student_support_case_logs` — บันทึกติดตามเคส
- `student_behavior_points` — คะแนนพฤติกรรม

---

#### 5.1 ตาราง `student_support_sdq`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_support_sdq;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_support_sdq;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_support_sdq;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_support_sdq;

-- อ่าน: ครู/Admin/Executive
CREATE POLICY "staff_select"
  ON public.student_support_sdq FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
  );

-- เพิ่ม: ครู/Admin
CREATE POLICY "staff_insert"
  ON public.student_support_sdq FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- แก้ไข: ครู/Admin
CREATE POLICY "staff_update"
  ON public.student_support_sdq FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin
CREATE POLICY "admin_delete"
  ON public.student_support_sdq FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.student_support_sdq FROM anon;
GRANT ALL ON public.student_support_sdq TO authenticated;
```

---

#### 5.2 ตาราง `student_support_eq`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_support_eq;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_support_eq;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_support_eq;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_support_eq;

CREATE POLICY "staff_select"
  ON public.student_support_eq FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE'));

CREATE POLICY "staff_insert"
  ON public.student_support_eq FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.student_support_eq FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "admin_delete"
  ON public.student_support_eq FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.student_support_eq FROM anon;
GRANT ALL ON public.student_support_eq TO authenticated;
```

---

#### 5.3 ตาราง `student_support_risk_analysis`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_support_risk_analysis;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_support_risk_analysis;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_support_risk_analysis;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_support_risk_analysis;

CREATE POLICY "staff_select"
  ON public.student_support_risk_analysis FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE'));

CREATE POLICY "staff_insert"
  ON public.student_support_risk_analysis FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.student_support_risk_analysis FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "admin_delete"
  ON public.student_support_risk_analysis FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.student_support_risk_analysis FROM anon;
GRANT ALL ON public.student_support_risk_analysis TO authenticated;
```

---

#### 5.4 ตาราง `student_support_cases`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_support_cases;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_support_cases;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_support_cases;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_support_cases;

CREATE POLICY "staff_select"
  ON public.student_support_cases FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE'));

CREATE POLICY "staff_insert"
  ON public.student_support_cases FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.student_support_cases FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "admin_delete"
  ON public.student_support_cases FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.student_support_cases FROM anon;
GRANT ALL ON public.student_support_cases TO authenticated;
```

---

#### 5.5 ตาราง `student_support_case_logs`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_support_case_logs;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_support_case_logs;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_support_case_logs;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_support_case_logs;

CREATE POLICY "staff_select"
  ON public.student_support_case_logs FOR SELECT
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE'));

CREATE POLICY "staff_insert"
  ON public.student_support_case_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "staff_update"
  ON public.student_support_case_logs FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

CREATE POLICY "admin_delete"
  ON public.student_support_case_logs FOR DELETE
  TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.student_support_case_logs FROM anon;
GRANT ALL ON public.student_support_case_logs TO authenticated;
```

---

#### 5.6 ตาราง `student_behavior_points`

```sql
DROP POLICY IF EXISTS "Allow select for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_behavior_points;

-- อ่าน: ครู/Admin/Executive, ผู้ปกครองดูของบุตรหลาน
CREATE POLICY "select_behavior"
  ON public.student_behavior_points FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('ADMIN', 'TEACHER', 'EXECUTIVE')
    OR student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.parents p ON s.parent_id = p.id
      WHERE p.email = auth.email()
    )
  );

-- เพิ่ม: ครู/Admin
CREATE POLICY "staff_insert"
  ON public.student_behavior_points FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- แก้ไข: ครู/Admin
CREATE POLICY "staff_update"
  ON public.student_behavior_points FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- ลบ: Admin หรือครูที่บันทึก
CREATE POLICY "owner_or_admin_delete"
  ON public.student_behavior_points FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR recorded_by = public.get_teacher_id()
  );

REVOKE ALL ON public.student_behavior_points FROM anon;
GRANT ALL ON public.student_behavior_points TO authenticated;
```

> [!NOTE]
> หลังทำ Phase 5 เสร็จ → ทดสอบ **ระบบดูแลช่วยเหลือ SDQ/EQ**, **คัดกรองความเสี่ยง**, **จัดการเคส**, **คะแนนพฤติกรรม**

---

## Phase 6 — Audit Logs & Notifications

### ตารางที่เกี่ยวข้อง
- `audit_logs` — บันทึกการใช้งาน
- `notifications` — การแจ้งเตือน

---

#### 6.1 ตาราง `audit_logs`

> [!IMPORTANT]
> ตาราง `audit_logs` ถูก insert ผ่าน Trigger Function `process_audit_log()` ที่ใช้ `SECURITY DEFINER` จึงไม่ได้ถูก RLS บล็อกในการ insert จาก trigger

```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- อ่าน: เฉพาะ Admin
CREATE POLICY "admin_select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- เพิ่ม: ทุก authenticated user (สำหรับ Login Log จาก Client)
CREATE POLICY "authenticated_insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- แก้ไข/ลบ: ห้ามทุกคน (เพื่อป้องกัน Tampering)
-- ไม่สร้าง UPDATE/DELETE policy = ไม่มีใครแก้ไขหรือลบ Log ได้

REVOKE ALL ON public.audit_logs FROM anon;
GRANT INSERT, SELECT ON public.audit_logs TO authenticated;
```

---

#### 6.2 ตาราง `notifications`

```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- อ่าน: ดูเฉพาะของตนเอง
CREATE POLICY "own_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- เพิ่ม: ระบบ/ครู/Admin (สร้างแจ้งเตือน)
CREATE POLICY "staff_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'TEACHER'));

-- แก้ไข: เจ้าของ (อ่านแล้ว/ยังไม่อ่าน)
CREATE POLICY "own_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ลบ: เจ้าของ หรือ Admin
CREATE POLICY "own_or_admin_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

REVOKE ALL ON public.notifications FROM anon;
GRANT ALL ON public.notifications TO authenticated;
```

---

## Checklist ทดสอบหลังเปิด RLS

### 🔴 วิธีการ Rollback ฉุกเฉิน (ถ้าพัง)

ถ้าเปิด RLS แล้วระบบใช้งานไม่ได้ ให้กลับไปใช้ Policy แบบเปิดกว้างชั่วคราว:

```sql
-- ตัวอย่าง: Rollback ตาราง students
DROP POLICY IF EXISTS "select_students" ON public.students;
DROP POLICY IF EXISTS "admin_insert" ON public.students;
DROP POLICY IF EXISTS "admin_or_teacher_update" ON public.students;
DROP POLICY IF EXISTS "admin_delete" ON public.students;

CREATE POLICY "Allow all for testing" ON public.students FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.students TO anon;
```

### ✅ Checklist ทดสอบรายเฟส

#### Phase 0
- [ ] สร้าง Helper Functions สำเร็จ
- [ ] ตรวจสอบ `SELECT public.get_user_role()` ได้ค่าถูกต้อง
- [ ] ตรวจสอบ `SELECT public.is_admin()` ได้ค่าถูกต้อง

#### Phase 1 — Master Data
- [ ] ADMIN สามารถ CRUD `academic_years`, `semesters`, `subjects` ได้
- [ ] TEACHER สามารถ SELECT ได้แต่ INSERT/UPDATE/DELETE ไม่ได้
- [ ] anon ไม่สามารถเข้าถึงข้อมูลได้เลย

#### Phase 2 — บุคลากร
- [ ] ADMIN จัดการ `users`, `teachers`, `parents` ได้ทุกอย่าง
- [ ] TEACHER ดูข้อมูล `teachers` ได้ทั้งหมด แต่แก้ได้เฉพาะของตัวเอง
- [ ] PARENT ดูข้อมูล `parents` ได้เฉพาะของตัวเอง
- [ ] Login ยังทำงานได้ปกติทุก Role

#### Phase 3 — นักเรียน
- [ ] TEACHER ดูรายชื่อนักเรียนทุกห้องได้
- [ ] PARENT ดูข้อมูลเฉพาะบุตรหลานตนเอง
- [ ] STUDENT ดูข้อมูลเฉพาะตนเอง
- [ ] หน้า Dashboard แสดงข้อมูลครบถ้วน

#### Phase 4 — เช็คชื่อ/ลา/เยี่ยมบ้าน
- [ ] TEACHER สามารถเช็คชื่อเข้าแถวได้ปกติ
- [ ] TEACHER สามารถเปิด QR Session และบันทึกเช็คชื่อรายวิชาได้
- [ ] STUDENT สามารถ scan QR เช็คชื่อได้
- [ ] ระบบใบลาทำงานปกติ
- [ ] ระบบเยี่ยมบ้านทำงานปกติ (CRUD + Upload Photo)
- [ ] PARENT ดูข้อมูลเช็คชื่อ/ลา/เยี่ยมบ้านของบุตรหลานได้

#### Phase 5 — ดูแลช่วยเหลือ
- [ ] บันทึกแบบประเมิน SDQ/EQ ได้ปกติ
- [ ] ระบบคัดกรองความเสี่ยง (Risk Analysis) ทำงานปกติ
- [ ] เปิด/ปิดเคส + บันทึก Log ได้ปกติ
- [ ] คะแนนพฤติกรรม CRUD ได้ปกติ
- [ ] EXECUTIVE ดูรายงานภาพรวมได้

#### Phase 6 — Audit & Notification
- [ ] การ Login ยังบันทึก Log ได้ปกติ
- [ ] ADMIN ดู Audit Logs ได้
- [ ] TEACHER/STUDENT ดู Audit Logs ไม่ได้
- [ ] การแจ้งเตือนแสดงเฉพาะของ user นั้นๆ

---

## 📅 Timeline แนะนำ

| วัน | งาน | ความเสี่ยง |
|-----|------|-----------|
| วันที่ 1 | Phase 0 (เตรียมความพร้อม) + Phase 1 (Master Data) | 🟢 ต่ำ |
| วันที่ 2 | Phase 2 (บุคลากร) — ⚠️ ทดสอบ Login ละเอียด | 🟡 กลาง |
| วันที่ 3 | Phase 3 (นักเรียน/ห้องเรียน) | 🟡 กลาง |
| วันที่ 4 | Phase 4 (เช็คชื่อ/ลา/เยี่ยมบ้าน) | 🔴 สูง |
| วันที่ 5 | Phase 5 (ดูแลช่วยเหลือ) | 🟡 กลาง |
| วันที่ 6 | Phase 6 (Audit/Notification) + Final Test | 🟢 ต่ำ |

> [!TIP]
> **แนะนำ:** ทำทีละ Phase ในช่วงที่ไม่มีผู้ใช้งาน (เช่น หลังเลิกเรียน หรือวันหยุด) เพื่อลดผลกระทบ
