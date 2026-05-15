-- วิธีรันโค้ดนี้:
-- 1. ไปที่เว็บไซต์ Supabase -> เลือกโปรเจกต์ของคุณ
-- 2. ไปที่เมนู "SQL Editor" (เมนูด้านซ้าย)
-- 3. คลิก "New Query"
-- 4. ก๊อปปี้โค้ดทั้งหมดด้านล่างนี้ไปวาง แล้วกดปุ่ม "RUN" (ปุ่มสีเขียว)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_teacher_account(
  t_email text,
  t_password text,
  t_code text,
  t_fname text,
  t_lname text,
  t_dept text,
  t_phone text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- 1. สร้าง ID แบบสุ่มและเข้ารหัสรหัสผ่าน
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(t_password, gen_salt('bf'));
  
  -- 2. สร้างบัญชีเข้าสู่ระบบ (Auth User)
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', t_email, encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"role":"teacher"}', now(), now());
    
  -- 3. ยืนยัน Identity ป้องกันบั๊กการล็อกอินของ Supabase รุ่นใหม่
  INSERT INTO auth.identities (id, user_id, identity_data, provider, created_at, updated_at)
  VALUES
    (gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, t_email)::jsonb, 'email', now(), now());

  -- 4. บันทึกข้อมูลประวัติลงในตาราง teachers
  INSERT INTO public.teachers (id, teacher_code, first_name, last_name, department, phone, email)
  VALUES (new_user_id, t_code, t_fname, t_lname, t_dept, t_phone, t_email);

  RETURN new_user_id;
END;
$$;
