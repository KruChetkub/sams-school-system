-- สคริปต์อนุญาตสิทธิ์การเข้าถึงข้อมูล (ปลดล็อก Error 403 Forbidden)
-- ให้คัดลอกโค้ดนี้ไปรันใน SQL Editor ของ Supabase ครับ

-- ปิด Row Level Security (RLS) ชั่วคราวเพื่อให้ระบบสามารถอ่าน/เขียนข้อมูลได้ทั้งหมดโดยไม่ติด 403
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.homeroom_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
