-- Academic Years and Semesters (v2 - Master Data)
-- สำหรับคัดลอกไปรันใน SQL Editor ของ Supabase

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL UNIQUE,          -- เช่น '2569' (ทำเป็น UNIQUE เพื่อไม่ให้ปีซ้ำ)
  label TEXT,                        -- เช่น 'ปีการศึกษา 2569'
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ป้องกันความซ้ำซ้อนในกรณีตารางเคยถูกสร้างแล้วแต่ขาดคอลัมน์ (เช่น จากการทดสอบรอบก่อนๆ)
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  semester_number TEXT NOT NULL,     -- '1' หรือ '2'
  label TEXT,                        -- เช่น 'ภาคเรียนที่ 1'
  is_active BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year_id, semester_number) -- ไม่ให้มีภาคเรียนซ้ำในปีเดียวกัน
);

-- ป้องกันกรณีตาราง semesters เคยถูกสร้างแล้วแต่ขาดคอลัมน์
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS academic_year_id UUID;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS semester_number TEXT;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ให้มี active ได้แค่ 1 ปีในเวลาเดียวกัน
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_years_active 
  ON public.academic_years (is_active) WHERE is_active = true;

-- ให้มี active ได้แค่ 1 ภาคเรียนในเวลาเดียวกัน
CREATE UNIQUE INDEX IF NOT EXISTS idx_semesters_active 
  ON public.semesters (is_active) WHERE is_active = true;

-- เปิดใช้งาน RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS Policies แบบเปิดเพื่อการทดสอบ/ใช้งาน
CREATE POLICY "Allow select for testing" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.academic_years FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.academic_years FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.academic_years FOR DELETE USING (true);

CREATE POLICY "Allow select for testing" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.semesters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.semesters FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.semesters FOR DELETE USING (true);

-- ให้สิทธิ์กับ authenticated และ anon
GRANT ALL ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO anon;

GRANT ALL ON public.semesters TO authenticated;
GRANT ALL ON public.semesters TO anon;
