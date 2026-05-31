-- Development Script: SAMS Version 12 - ระบบบันทึก Log การเข้าใช้งานและการเปลี่ยนแปลงข้อมูล (Audit Logs)
-- แนะนำให้นำไฟล์นี้ไปรันในเมนู SQL Editor ของระบบหลังบ้าน Supabase 

-- ==========================================
-- 1. สร้างตารางบันทึก Log (audit_logs)
-- ==========================================
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete set null,
    user_email text,                  -- เก็บอีเมลสำรองเผื่อบัญชีผู้ใช้ถูกลบ
    action text not null,             -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'INSERT', 'UPDATE', 'DELETE'
    table_name text,                  -- ชื่อตารางที่เกิดการเปลี่ยนแปลง (เช่น 'attendance', 'home_visits')
    record_id text,                   -- ID ของแถวข้อมูลที่ถูกกระทำ
    old_values jsonb,                 -- ข้อมูลเดิมก่อนแก้ไข (สำหรับ UPDATE/DELETE) เพื่อทำ Data Rollback
    new_values jsonb,                 -- ข้อมูลใหม่หลังแก้ไข (สำหรับ INSERT/UPDATE)
    ip_address text,                  -- ไอพีแอดเดรสของผู้ใช้งาน (บันทึกจากฝั่ง Client)
    user_agent text,                  -- ข้อมูล Browser/Device ของผู้ใช้ (บันทึกจากฝั่ง Client)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- สร้าง Index เพื่อความรวดเร็วในการ Query และทำ Offloading รายวัน
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at);

-- เปิดสิทธิ์เข้าใช้งานตารางสำหรับผู้ใช้ที่มีสิทธิ์ (เพื่อบันทึก Log ในเฟสแรก)
grant insert, select on public.audit_logs to authenticated;
grant insert, select on public.audit_logs to anon;

-- ==========================================
-- 2. สร้าง PostgreSQL Function บันทึก Log อัตโนมัติ
-- ==========================================
create or replace function public.process_audit_log()
returns trigger as $$
declare
    current_user_id uuid;
    current_user_email text;
begin
    -- ดึง ID และ Email ของผู้ใช้ปัจจุบันที่ล็อกอินผ่าน Supabase Auth API
    current_user_id := auth.uid();
    current_user_email := auth.email();

    if (TG_OP = 'INSERT') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, new_values)
        values (current_user_id, current_user_email, 'INSERT', TG_TABLE_NAME, cast(NEW.id as text), to_jsonb(NEW));
        return NEW;
    elsif (TG_OP = 'UPDATE') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_values, new_values)
        values (current_user_id, current_user_email, 'UPDATE', TG_TABLE_NAME, cast(NEW.id as text), to_jsonb(OLD), to_jsonb(NEW));
        return NEW;
    elsif (TG_OP = 'DELETE') then
        insert into public.audit_logs (user_id, user_email, action, table_name, record_id, old_values)
        values (current_user_id, current_user_email, 'DELETE', TG_TABLE_NAME, cast(OLD.id as text), to_jsonb(OLD));
        return OLD;
    end if;
    return null;
end;
$$ language plpgsql security definer;

-- ==========================================
-- 3. ผูกระบบดักจับเหตุการณ์ (Triggers) กับตารางหลัก
-- ==========================================

-- 3.1 ตารางบันทึกการเข้าเรียน / โฮมรูม (attendance) -> ดักจับทุกเหตุการณ์
drop trigger if exists audit_attendance_trigger on public.attendance;
create trigger audit_attendance_trigger
after insert or update or delete on public.attendance
for each row execute function public.process_audit_log();

-- 3.2 ตารางข้อมูลการเยี่ยมบ้าน (home_visits) -> ดักจับทุกเหตุการณ์
drop trigger if exists audit_home_visits_trigger on public.home_visits;
create trigger audit_home_visits_trigger
after insert or update or delete on public.home_visits
for each row execute function public.process_audit_log();

-- 3.3 ตารางข้อมูลนักเรียน (students) -> ดักจับเฉพาะความเสี่ยงสูง (UPDATE/DELETE) เพื่อความปลอดภัยสูงสุด
drop trigger if exists audit_students_trigger on public.students;
create trigger audit_students_trigger
after update or delete on public.students
for each row execute function public.process_audit_log();

-- 3.4 ตารางข้อมูลบุคลากรครู (teachers) -> ดักจับเฉพาะความเสี่ยงสูง (UPDATE/DELETE)
drop trigger if exists audit_teachers_trigger on public.teachers;
create trigger audit_teachers_trigger
after update or delete on public.teachers
for each row execute function public.process_audit_log();
