-- Development Script: SAMS Version 13 - ระบบดูแลช่วยเหลือนักเรียน (Student Support System)
-- แนะนำให้นำไฟล์นี้ไปรันในเมนู SQL Editor ของระบบหลังบ้าน Supabase 

-- ==========================================
-- 0. ปรับปรุงตารางโครงสร้างระบบเดิม
-- ==========================================
-- เพิ่มคอลัมน์ role ในตาราง public.teachers เพื่อแบ่งสิทธิ์การใช้งาน (TEACHER, EXECUTIVE, ADMIN)
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'TEACHER';

-- เพิ่มคอลัมน์ gender ในตาราง public.students เพื่อเก็บข้อมูลเพศ
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender TEXT;

-- ==========================================
-- 1. สร้างตารางบันทึกแบบประเมิน SDQ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_support_sdq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_type TEXT NOT NULL, -- 'STUDENT' (นักเรียน), 'TEACHER' (ครูที่ปรึกษา), 'PARENT' (ผู้ปกครอง)
    evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    answers JSONB NOT NULL, -- เก็บคำตอบข้อ 1-25 เช่น [2, 1, 0, ...] (ใช้ค่า 0=ไม่จริง, 1=ค่อนข้างจริง, 2=จริง)
    
    -- คะแนนดิบแต่ละด้าน
    emotional_score INT NOT NULL,
    conduct_score INT NOT NULL,
    hyperactivity_score INT NOT NULL,
    peer_score INT NOT NULL,
    prosocial_score INT NOT NULL,
    total_difficulties_score INT NOT NULL, -- ผลรวม 4 ด้านแรก (Emotional + Conduct + Hyperactivity + Peer)
    
    -- ผลการประเมิน
    result_difficulties TEXT NOT NULL, -- 'NORMAL' (ปกติ), 'RISK' (เสี่ยง), 'PROBLEM' (มีปัญหา)
    result_prosocial TEXT NOT NULL, -- 'STRENGTH' (มีจุดแข็ง), 'NO_STRENGTH' (ไม่มีจุดแข็ง)
    
    -- ส่วนประเมินด้านหลัง (Impact Assessment)
    impact_answers JSONB, -- เก็บคำตอบผลกระทบด้านหลัง
    impact_score INT,
    result_impact TEXT, -- 'NORMAL' (ปกติ), 'RISK' (เสี่ยง), 'PROBLEM' (มีปัญหา)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. สร้างตารางบันทึกแบบประเมิน EQ
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_support_eq (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    answers JSONB NOT NULL, -- เก็บคำตอบข้อ 1-52 เช่น [4, 3, 2, 1, ...] (ใช้ค่า 1-4)
    total_score INT NOT NULL,
    eq_level TEXT NOT NULL, -- 'NORMAL' (ปกติ), 'LOWER_THAN_NORMAL' (ต่ำกว่าปกติ), 'HIGHER_THAN_NORMAL' (สูงกว่าปกติ)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. สร้างตารางวิเคราะห์ระดับความเสี่ยงภาพรวม (Risk Analysis)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_support_risk_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    risk_level TEXT DEFAULT 'NORMAL', -- 'NORMAL' (ปกติ - เขียว), 'MONITOR' (เฝ้าระวัง - เหลือง), 'RISK' (เสี่ยง - ส้ม), 'URGENT' (ต้องช่วยเหลือเร่งด่วน - แดง)
    factors_summary JSONB, -- สรุปย่อยความเสี่ยงด้านต่างๆ เช่น { "sdq": "PROBLEM", "attendance": "RISK", "health": "NORMAL", "home_visit": "MONITOR" }
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. สร้างตารางระบบจัดการเคสดูแลช่วยเหลือ (Case Management)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_support_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    opened_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    risk_level TEXT DEFAULT 'MONITOR', -- 'MONITOR', 'RISK', 'URGENT'
    status TEXT DEFAULT 'OPEN', -- 'OPEN' (เปิดเคส), 'FOLLOWING' (กำลังติดตาม), 'HELPING' (ช่วยเหลือ), 'CLOSED' (ปิดเคส)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- ==========================================
-- 5. สร้างตารางบันทึกความคืบหน้าการติดตามช่วยเหลือ (Case Logs)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.student_support_case_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID REFERENCES public.student_support_cases(id) ON DELETE CASCADE,
    logged_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. การเปิดใช้งานและตั้งค่านโยบายความปลอดภัย RLS
-- ==========================================
ALTER TABLE public.student_support_sdq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_support_eq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_support_risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_support_case_logs ENABLE ROW LEVEL SECURITY;

-- สร้างนโยบายเข้าถึงแบบง่ายเพื่อให้ระบบสามารถเรียกอ่านและบันทึกได้สะดวกในการเชื่อมต่อ
CREATE POLICY "Allow select for testing" ON public.student_support_sdq FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_support_sdq FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_support_sdq FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_support_sdq FOR DELETE USING (true);

CREATE POLICY "Allow select for testing" ON public.student_support_eq FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_support_eq FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_support_eq FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_support_eq FOR DELETE USING (true);

CREATE POLICY "Allow select for testing" ON public.student_support_risk_analysis FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_support_risk_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_support_risk_analysis FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_support_risk_analysis FOR DELETE USING (true);

CREATE POLICY "Allow select for testing" ON public.student_support_cases FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_support_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_support_cases FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_support_cases FOR DELETE USING (true);

CREATE POLICY "Allow select for testing" ON public.student_support_case_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert for testing" ON public.student_support_case_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for testing" ON public.student_support_case_logs FOR UPDATE USING (true);
CREATE POLICY "Allow delete for testing" ON public.student_support_case_logs FOR DELETE USING (true);

-- สิทธิ์การใช้งานตารางสำหรับผู้ใช้ทุกคนในการคัดกรองเฟสแรก
GRANT ALL ON public.student_support_sdq TO authenticated;
GRANT ALL ON public.student_support_sdq TO anon;

GRANT ALL ON public.student_support_eq TO authenticated;
GRANT ALL ON public.student_support_eq TO anon;

GRANT ALL ON public.student_support_risk_analysis TO authenticated;
GRANT ALL ON public.student_support_risk_analysis TO anon;

GRANT ALL ON public.student_support_cases TO authenticated;
GRANT ALL ON public.student_support_cases TO anon;

GRANT ALL ON public.student_support_case_logs TO authenticated;
GRANT ALL ON public.student_support_case_logs TO anon;
