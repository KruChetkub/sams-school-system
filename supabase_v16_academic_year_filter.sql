-- SAMS Database Migration: Phase 2 - Academic Year System-wide Filter
-- สำหรับคัดลอกไปรันใน SQL Editor ของ Supabase เพื่อรองรับการกรองข้อมูลแบบประวัติย้อนหลัง

-- 1. เพิ่มคอลัมน์ประวัติปีการศึกษาในตารางเช็คชื่อเข้าแถว (homeroom_attendance)
ALTER TABLE public.homeroom_attendance 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 2. เพิ่มคอลัมน์ประวัติในใบขอลา (leave_requests)
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 3. เพิ่มคอลัมน์ประวัติในการเยี่ยมบ้าน (home_visits)
ALTER TABLE public.home_visits 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 4. เพิ่มคอลัมน์ประวัติในแบบประเมิน SDQ (student_support_sdq)
ALTER TABLE public.student_support_sdq 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 5. เพิ่มคอลัมน์ประวัติในแบบประเมิน EQ (student_support_eq)
ALTER TABLE public.student_support_eq 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 6. เพิ่มคอลัมน์ประวัติในตารางคัดกรองความเสี่ยง (student_support_risk_analysis)
ALTER TABLE public.student_support_risk_analysis 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL;

-- 7. เพิ่มคอลัมน์ประวัติในระบบจัดการเคสช่วยเหลือ (student_support_cases)
ALTER TABLE public.student_support_cases 
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL;

-- 8. เพิ่ม Indexes เพื่อปรับปรุงประสิทธิภาพการค้นหาและกรองข้อมูล
CREATE INDEX IF NOT EXISTS idx_homeroom_attendance_year ON public.homeroom_attendance(academic_year_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_year ON public.leave_requests(academic_year_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_home_visits_year ON public.home_visits(academic_year_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_sdq_year ON public.student_support_sdq(academic_year_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_eq_year ON public.student_support_eq(academic_year_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_risk_analysis_year ON public.student_support_risk_analysis(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_cases_year ON public.student_support_cases(academic_year_id, semester_id);

-- 9. รันฟังก์ชัน Backfill ข้อมูลเก่าทั้งหมดในฐานข้อมูลให้จับคู่กับปีการศึกษา/ภาคเรียนที่ถูกตั้งเป็น Active ล่าสุดโดยอัตโนมัติ
DO $$
DECLARE
    active_year_id UUID;
    active_sem_id UUID;
BEGIN
    -- ดึง ID ปีการศึกษาปัจจุบันที่ Active
    SELECT id INTO active_year_id FROM public.academic_years WHERE is_active = true LIMIT 1;
    -- ดึง ID ภาคเรียนปัจจุบันที่ Active
    SELECT id INTO active_sem_id FROM public.semesters WHERE is_active = true LIMIT 1;

    -- ทำการอัปเดตข้อมูลเก่าให้มีค่าประวัติตามค่าปัจจุบัน เพื่อป้องกันปัญหาข้อมูลว่างเปล่า (Null)
    IF active_year_id IS NOT NULL THEN
        UPDATE public.homeroom_attendance SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.leave_requests SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.home_visits SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.student_support_sdq SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.student_support_eq SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.student_support_risk_analysis SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
        UPDATE public.student_support_cases SET academic_year_id = active_year_id WHERE academic_year_id IS NULL;
    END IF;

    IF active_sem_id IS NOT NULL THEN
        UPDATE public.homeroom_attendance SET semester_id = active_sem_id WHERE semester_id IS NULL;
        UPDATE public.leave_requests SET semester_id = active_sem_id WHERE semester_id IS NULL;
        UPDATE public.home_visits SET semester_id = active_sem_id WHERE semester_id IS NULL;
        UPDATE public.student_support_sdq SET semester_id = active_sem_id WHERE semester_id IS NULL;
        UPDATE public.student_support_eq SET semester_id = active_sem_id WHERE semester_id IS NULL;
        UPDATE public.student_support_cases SET semester_id = active_sem_id WHERE semester_id IS NULL;
    END IF;
END $$;
