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
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(t_password, gen_salt('bf'));
  
  -- สร้างบัญชี Auth
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    ('00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', t_email, encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"role":"teacher"}', now(), now());
    
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
  VALUES
    (gen_random_uuid(), new_user_id::text, new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, t_email)::jsonb, 'email', now(), now());

  -- บันทึกข้อมูลลงตาราง users
  INSERT INTO public.users (id, email, role)
  VALUES (new_user_id, t_email, 'TEACHER');

  -- บันทึกข้อมูลลงตาราง teachers
  INSERT INTO public.teachers (id, teacher_code, first_name, last_name, department, phone, email, user_id)
  VALUES (new_user_id, t_code, t_fname, t_lname, t_dept, t_phone, t_email, new_user_id);

  RETURN new_user_id;
END;
$$;
