-- 1. สร้างตารางบันทึกคะแนนพฤติกรรม
CREATE TABLE IF NOT EXISTS public.student_behavior_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('PLUS', 'MINUS')),
    points INT NOT NULL CHECK (points > 0),
    category TEXT NOT NULL,
    description TEXT,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. สร้าง Indexes
CREATE INDEX IF NOT EXISTS idx_behavior_points_student ON public.student_behavior_points(student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_points_year ON public.student_behavior_points(academic_year_id, semester_id);

-- 3. เปิดใช้งาน RLS และตั้งสิทธิ์
ALTER TABLE public.student_behavior_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow insert for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow update for testing" ON public.student_behavior_points;
DROP POLICY IF EXISTS "Allow delete for testing" ON public.student_behavior_points;

CREATE POLICY "Allow select for testing" ON public.student_behavior_points FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_behavior_points FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_behavior_points FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_behavior_points FOR DELETE USING (true);

GRANT ALL ON public.student_behavior_points TO authenticated;
GRANT ALL ON public.student_behavior_points TO anon;
GRANT ALL ON public.student_behavior_points TO service_role;
