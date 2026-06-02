-- Student Portfolios (v2 - สำหรับเก็บผลงานและกิจกรรมนักเรียน)
-- สำหรับคัดลอกไปรันใน SQL Editor ของ Supabase

CREATE TABLE IF NOT EXISTS public.student_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  category TEXT NOT NULL,             -- 'ACADEMIC' (วิชาการ), 'ACTIVITY' (กิจกรรม), 'AWARD' (รางวัล), 'SKILL' (ทักษะ), 'OTHER' (อื่นๆ)
  title TEXT NOT NULL,
  description TEXT,
  score NUMERIC,
  grade TEXT,
  certificate_url TEXT,               -- ลิงก์รูปภาพผลงานหรือไฟล์ใบประกาศ (optional)
  certificate_label TEXT DEFAULT 'ผลงาน', -- ชื่อป้ายกำกับลิงก์ เช่น 'ดูเกียรติบัตร', 'ลิงก์ผลงาน'
  date DATE,                          -- วันที่ได้รับผลงาน
  academic_year TEXT,                 -- ปีการศึกษา
  semester TEXT,                      -- ภาคเรียน
  created_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง Indexes เพื่อความรวดเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_student_portfolios_student ON public.student_portfolios(student_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_category ON public.student_portfolios(category);

-- เปิดใช้งาน RLS
ALTER TABLE public.student_portfolios ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS Policies แบบเปิดเพื่อความสะดวกในการทดสอบ/ใช้งาน
CREATE POLICY "Allow select for testing" ON public.student_portfolios FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_portfolios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_portfolios FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_portfolios FOR DELETE USING (true);

-- ให้สิทธิ์กับ authenticated และ anon
GRANT ALL ON public.student_portfolios TO authenticated;
GRANT ALL ON public.student_portfolios TO anon;
