-- ไปที่เมนู SQL Editor ใน Supabase แล้วนำโค้ดนี้ไปรันครับ
-- โค้ดนี้จะช่วยสร้างฟังก์ชันบันทึกการเข้าเรียนรายวิชาให้ถูกต้องตามโครงสร้างฐานข้อมูลที่มี

CREATE OR REPLACE FUNCTION public.save_classroom_attendance(p_records jsonb) RETURNS void AS $$
DECLARE
  rec jsonb;
  v_session_id uuid;
  v_schedule_id uuid;
  v_attendance_date date;
  v_subject_id uuid;
  v_teacher_id uuid;
BEGIN
  IF jsonb_array_length(p_records) = 0 THEN
    RETURN;
  END IF;

  -- ดึงข้อมูล Schedule และ Date จาก Record แรก
  v_schedule_id := (p_records->0->>'schedule_id')::uuid;
  v_attendance_date := (p_records->0->>'attendance_date')::date;
  
  -- ค้นหาว่ามี Session ของคาบนี้ในวันนี้แล้วหรือยัง
  SELECT id INTO v_session_id 
  FROM public.attendance_sessions 
  WHERE schedule_id = v_schedule_id AND session_date = v_attendance_date;
  
  -- ถ้ายังไม่มี ให้สร้าง Session ใหม่
  IF v_session_id IS NULL THEN
    -- ดึงข้อมูลวิชาและครูจากตาราง schedules
    SELECT subject_id, teacher_id INTO v_subject_id, v_teacher_id
    FROM public.schedules WHERE id = v_schedule_id;

    INSERT INTO public.attendance_sessions (schedule_id, session_date, subject_id, teacher_id) 
    VALUES (v_schedule_id, v_attendance_date, v_subject_id, v_teacher_id) 
    RETURNING id INTO v_session_id;
  END IF;

  -- วนลูปบันทึกข้อมูลการเข้าเรียนของเด็กแต่ละคน
  FOR rec IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    -- ลบข้อมูลเก่าทิ้งก่อน (ถ้าเคยเช็คไปแล้ว) เพื่อป้องกันข้อมูลซ้ำ
    DELETE FROM public.attendance 
    WHERE session_id = v_session_id AND student_id = (rec->>'student_id')::uuid;
    
    -- บันทึกข้อมูลใหม่
    INSERT INTO public.attendance (session_id, student_id, status, checkin_time)
    VALUES (
      v_session_id, 
      (rec->>'student_id')::uuid, 
      (rec->>'status')::attendance_status, 
      (rec->>'checkin_time')::timestamptz
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
