import { supabase } from '../../lib/supabase';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SdqAssessment {
  id?: string;
  student_id: string;
  evaluator_type: 'STUDENT' | 'TEACHER' | 'PARENT';
  evaluator_id?: string;
  answers: number[]; // 25 answers (0=ไม่จริง, 1=ค่อนข้างจริง, 2=จริง)
  
  emotional_score: number;
  conduct_score: number;
  hyperactivity_score: number;
  peer_score: number;
  prosocial_score: number;
  total_difficulties_score: number;
  
  result_difficulties: 'NORMAL' | 'RISK' | 'PROBLEM';
  result_prosocial: 'STRENGTH' | 'NO_STRENGTH';
  
  impact_answers?: {
    distress: number; // Q3: 0, 1, 2, 3 -> mapped to score: 0, 0, 1, 2
    home: number;     // Q4_home: 0, 1, 2, 3 -> score: 0, 0, 1, 2
    friends: number;  // Q4_friends
    classroom: number;// Q4_classroom
    leisure: number;  // Q4_leisure
  };
  impact_score?: number;
  result_impact?: 'NORMAL' | 'RISK' | 'PROBLEM';
  created_at?: string;
  
  student?: {
    first_name: string;
    last_name: string;
    student_code: string;
  };
}

export interface EqAssessment {
  id?: string;
  student_id: string;
  evaluator_id?: string;
  answers: number[]; // 52 answers (1=ไม่จริง, 2=จริงบางครั้ง, 3=จริงส่วนใหญ่, 4=จริงที่สุด)
  total_score: number;
  eq_level: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  // V14: คะแนนรายมิติ EQ (กรมสุขภาพจิต วัยรุ่นไทย 12-17 ปี)
  goodness_score?: number;    // ด้านดี (20 ข้อ, เต็ม 80 คะแนน): ปกติ 48-59
  competence_score?: number;  // ด้านเก่ง (18 ข้อ, เต็ม 72 คะแนน): ปกติ 43-52
  happiness_score?: number;   // ด้านสุข (14 ข้อ, เต็ม 56 คะแนน): ปกติ 48-57
  goodness_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  competence_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  happiness_level?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
  created_at?: string;
  
  student?: {
    first_name: string;
    last_name: string;
    student_code: string;
  };
}

export interface RiskAnalysis {
  id?: string;
  student_id: string;
  risk_score: number;
  risk_level: 'NORMAL' | 'MONITOR' | 'RISK' | 'URGENT';
  factors_summary: {
    sdq?: 'NORMAL' | 'RISK' | 'PROBLEM';
    eq?: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL';
    attendance?: 'NORMAL' | 'RISK' | 'PROBLEM';
    home_visit?: 'NORMAL' | 'MONITOR' | 'RISK' | 'URGENT';
    health?: 'NORMAL' | 'RISK';
    behavior?: 'NORMAL' | 'RISK';
  };
  updated_at?: string;
}

export interface SupportCase {
  id?: string;
  student_id: string;
  opened_by?: string;
  title: string;
  description?: string;
  risk_level: 'MONITOR' | 'RISK' | 'URGENT';
  status: 'OPEN' | 'FOLLOWING' | 'HELPING' | 'CLOSED';
  created_at?: string;
  closed_at?: string;
  
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    student_code: string;
    classroom?: {
      level: string;
      room: string;
    };
  };
  teacher?: {
    first_name: string;
    last_name: string;
  };
  case_logs?: SupportCaseLog[];
}

export interface SupportCaseLog {
  id?: string;
  case_id: string;
  logged_by?: string;
  comment: string;
  created_at?: string;
  teacher?: {
    first_name: string;
    last_name: string;
  };
}

// ============================================================================
// Scoring & Calculations Helper functions
// ============================================================================

/**
 * คำนวณคะแนนและบันทึกประเมิน SDQ อัตโนมัติ
 * @param answers อาร์เรย์คำตอบ 25 ข้อ (0, 1, 2)
 * @param evaluatorType ประเภทผู้ประเมิน ('STUDENT', 'TEACHER', 'PARENT')
 */
export const calculateSdqScores = (answers: number[], evaluatorType: 'STUDENT' | 'TEACHER' | 'PARENT') => {
  if (answers.length !== 25) {
    throw new Error('แบบประเมิน SDQ ต้องมีคำตอบครบ 25 ข้อ');
  }

  // ดัชนีข้อคำถามกลับหัว (0-indexed): ข้อ 7 (index 6), ข้อ 11 (index 10), ข้อ 14 (index 13), ข้อ 21 (index 20), ข้อ 25 (index 24)
  const reverseIndices = [6, 10, 13, 20, 24];

  // แปลงคะแนนของข้อคำถามแต่ละข้อ
  const scores = answers.map((val, idx) => {
    if (reverseIndices.includes(idx)) {
      return 2 - val; // สลับเกณฑ์: 0->2, 1->1, 2->0
    }
    return val;
  });

  // คะแนนแต่ละมิติ
  const emotional_score = scores[2] + scores[7] + scores[12] + scores[15] + scores[23]; // ข้อ 3, 8, 13, 16, 24
  const conduct_score = scores[4] + scores[6] + scores[11] + scores[17] + scores[21];    // ข้อ 5, 7, 12, 18, 22
  const hyperactivity_score = scores[1] + scores[9] + scores[14] + scores[20] + scores[24]; // ข้อ 2, 10, 15, 21, 25
  const peer_score = scores[5] + scores[10] + scores[13] + scores[18] + scores[22];       // ข้อ 6, 11, 14, 19, 23
  const prosocial_score = scores[0] + scores[3] + scores[8] + scores[16] + scores[19];    // ข้อ 1, 4, 9, 17, 20

  const total_difficulties_score = emotional_score + conduct_score + hyperactivity_score + peer_score;

  // การแปลผลด้านรวมปัญหาและด้านสังคม
  let result_difficulties: 'NORMAL' | 'RISK' | 'PROBLEM' = 'NORMAL';
  let result_prosocial: 'STRENGTH' | 'NO_STRENGTH' = 'STRENGTH';

  if (evaluatorType === 'STUDENT') {
    // ฉบับนักเรียนประเมินตนเอง
    if (total_difficulties_score >= 19) result_difficulties = 'PROBLEM';
    else if (total_difficulties_score >= 17) result_difficulties = 'RISK';
    
    if (prosocial_score <= 3) result_prosocial = 'NO_STRENGTH';
  } else {
    // ฉบับครูและผู้ปกครองประเมิน
    if (total_difficulties_score >= 18) result_difficulties = 'PROBLEM';
    else if (total_difficulties_score >= 16) result_difficulties = 'RISK';
    
    if (prosocial_score <= 3) result_prosocial = 'NO_STRENGTH';
  }

  return {
    emotional_score,
    conduct_score,
    hyperactivity_score,
    peer_score,
    prosocial_score,
    total_difficulties_score,
    result_difficulties,
    result_prosocial
  };
};

/**
 * คำนวณคะแนนผลกระทบด้านหลัง (Impact Assessment) ของ SDQ
 */
export const calculateSdqImpact = (impactAnswers: {
  distress: number;
  home: number;
  friends: number;
  classroom: number;
  leisure: number;
}) => {
  // ฟังก์ชันย่อยแปลงเกณฑ์ 0,1,2,3 (ไม่เลย, เล็กน้อย, ค่อนข้างมาก, มาก) เป็นคะแนน 0,0,1,2
  const mapImpactScore = (val: number) => {
    if (val === 2) return 1; // ค่อนข้างมาก = 1 คะแนน
    if (val === 3) return 2; // มาก = 2 คะแนน
    return 0; // ไม่เลย หรือ เล็กน้อย = 0 คะแนน
  };

  const distressScore = mapImpactScore(impactAnswers.distress);
  const homeScore = mapImpactScore(impactAnswers.home);
  const friendsScore = mapImpactScore(impactAnswers.friends);
  const classroomScore = mapImpactScore(impactAnswers.classroom);
  const leisureScore = mapImpactScore(impactAnswers.leisure);

  const impact_score = distressScore + homeScore + friendsScore + classroomScore + leisureScore;

  let result_impact: 'NORMAL' | 'RISK' | 'PROBLEM' = 'NORMAL';
  if (impact_score >= 3) result_impact = 'PROBLEM';
  else if (impact_score >= 1) result_impact = 'RISK';

  return {
    impact_score,
    result_impact
  };
};

/**
 * คำนวณระดับ EQ รายบุคคลตามเกณฑ์มาตรฐาน SAMS Version 14
 * (กรมสุขภาพจิต วัยรุ่นไทยอายุ 12-17 ปี)
 * @param answers อาร์เรย์คำตอบ 52 ข้อ (1=ไม่จริงเลย, 2=จริงบางครั้ง, 3=จริงส่วนใหญ่, 4=จริงที่สุด)
 */
export const calculateEqScore = (answers: number[]) => {
  if (answers.length !== 52) {
    throw new Error('แบบประเมิน EQ ต้องมีคำตอบครบ 52 ข้อ');
  }

  // ข้อคำถามเชิงลบ (0-indexed) ที่ต้องกลับคะแนน: (1->4, 2->3, 3->2, 4->1)
  // Q1,Q2,Q4,Q7,Q8,Q10,Q12,Q15,Q17,Q18,Q20,Q23,Q25,Q26,Q28,Q29,Q32,Q34,Q36,Q39,Q44,Q46,Q50,Q51
  const reverseIndices = [0, 1, 3, 6, 7, 9, 11, 14, 16, 17, 19, 22, 24, 25, 27, 28, 31, 33, 35, 38, 43, 45, 49, 50];

  const scores = answers.map((val, idx) => {
    if (reverseIndices.includes(idx)) {
      return 5 - val; // กลับคะแนน: 1->4, 2->3, 3->2, 4->1
    }
    return val;
  });

  const total_score = scores.reduce((sum, current) => sum + current, 0);

  // ============================================================
  // V14: เกณฑ์แปรผลคะแนนรวม EQ (กรมสุขภาพจิต)
  // ต่ำกว่าปกติ: < 139 | ปกติ: 139 - 168 | สูงกว่าปกติ: > 168
  // ============================================================
  let eq_level: 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL' = 'NORMAL';
  if (total_score < 139) {
    eq_level = 'LOWER_THAN_NORMAL';
  } else if (total_score > 168) {
    eq_level = 'HIGHER_THAN_NORMAL';
  }

  // ============================================================
  // V14: คำนวณคะแนนรายมิติ EQ 3 ด้าน
  // ด้านดี    (Goodness)   20 ข้อ เต็ม 80: ปกติ 48-59
  // ด้านเก่ง  (Competence) 18 ข้อ เต็ม 72: ปกติ 43-52
  // ด้านสุข   (Happiness)  14 ข้อ เต็ม 56: ปกติ 48-57
  // รวมตรวจสอบ: 20+18+14 = 52 ข้อ ✓ | 80+72+56 = 208 คะแนน ✓
  // ============================================================

  // ด้านดี: เกี่ยวกับจริยธรรม ความเมตตา การควบคุมอารมณ์ ความรับผิดชอบ (Q1,Q3-Q10,Q14,Q15,Q21,Q23,Q32,Q33,Q41,Q44,Q46,Q47,Q48)
  const goodnessIndices   = [0, 2, 3, 4, 5, 6, 7, 8, 9, 13, 14, 20, 22, 31, 32, 40, 43, 45, 46, 47];

  // ด้านเก่ง: เกี่ยวกับแรงจูงใจ เป้าหมาย การแก้ปัญหา ความอดทน ความมั่นใจ (Q2,Q11,Q12,Q16,Q19,Q20,Q24,Q25,Q29,Q30,Q34,Q35,Q36,Q37,Q38,Q39,Q40,Q43)
  const competenceIndices = [1, 10, 11, 15, 18, 19, 23, 24, 28, 29, 33, 34, 35, 36, 37, 38, 39, 42];

  // ด้านสุข: เกี่ยวกับความสุข ความมั่นใจตนเอง สัมพันธภาพ การมองโลกแง่ดี (Q13,Q17,Q18,Q22,Q26,Q27,Q28,Q31,Q42,Q45,Q49,Q50,Q51,Q52)
  const happinessIndices  = [12, 16, 17, 21, 25, 26, 27, 30, 41, 44, 48, 49, 50, 51];

  const goodness_score   = goodnessIndices.reduce((sum, i) => sum + scores[i], 0);
  const competence_score = competenceIndices.reduce((sum, i) => sum + scores[i], 0);
  const happiness_score  = happinessIndices.reduce((sum, i) => sum + scores[i], 0);

  // ฟังก์ชันแปรผลระดับรายมิติ
  const classifyEqDimension = (score: number, normalMin: number, normalMax: number)
    : 'NORMAL' | 'LOWER_THAN_NORMAL' | 'HIGHER_THAN_NORMAL' => {
    if (score < normalMin) return 'LOWER_THAN_NORMAL';
    if (score > normalMax) return 'HIGHER_THAN_NORMAL';
    return 'NORMAL';
  };

  const goodness_level   = classifyEqDimension(goodness_score,   48, 59);
  const competence_level = classifyEqDimension(competence_score, 43, 52);
  const happiness_level  = classifyEqDimension(happiness_score,  48, 57);

  return {
    total_score,
    eq_level,
    goodness_score,
    competence_score,
    happiness_score,
    goodness_level,
    competence_level,
    happiness_level,
  };
};

// ============================================================================
// Service Methods (Database Queries)
// ============================================================================

export const studentSupportService = {
  
  /**
   * ดึงรายชื่อนักเรียนเฉพาะในห้องเรียนที่ครูที่ปรึกษาท่านนี้ดูแล
   */
  getAdvisorStudents: async (teacherUserId: string) => {
    try {
      // 1. ค้นหา teacher id ของครูที่ปรึกษาก่อน
      let { data: teacher, error: teacherErr } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherUserId)
        .maybeSingle();

      if (!teacher) {
        const { data: fallbackTeacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', teacherUserId)
          .maybeSingle();
        if (fallbackTeacher) teacher = fallbackTeacher;
      }

      if (teacherErr) throw teacherErr;
      if (!teacher) return [];

      // 2. ดึงห้องเรียนที่ครูคนนี้ดูแล
      const { data: classrooms, error: classErr } = await supabase
        .from('classrooms')
        .select('id')
        .eq('advisor_id', teacher.id);

      if (classErr) throw classErr;
      if (!classrooms || classrooms.length === 0) return [];

      const classroomIds = classrooms.map(c => c.id);

      // 3. ดึงรายชื่อเด็กนักเรียนและรายละเอียดการเยี่ยมบ้าน สถิติ และ SDQ/EQ
      const { data: students, error: studentErr } = await supabase
        .from('students')
        .select(`
          id, student_code, prefix, first_name, last_name, nickname, photo_url, gender,
          classroom:classroom_id (id, level, room),
          home_visits (
            id, status,
            home_visit_assessments ( risk_level )
          ),
          student_support_sdq ( id, result_difficulties, created_at ),
          student_support_eq ( id, eq_level, created_at ),
          student_support_risk_analysis ( id, risk_level, factors_summary )
        `)
        .in('classroom_id', classroomIds)
        .is('deleted_at', null)
        .order('student_code');

      if (studentErr) throw studentErr;
      return students;
    } catch (err) {
      console.error('Error in getAdvisorStudents:', err);
      throw err;
    }
  },

  /**
   * ดึงข้อมูลนักเรียนทั้งหมดในระบบ (สำหรับแอดมินหรือผู้บริหาร)
   */
  getAllStudentsForExecutive: async () => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id, student_code, prefix, first_name, last_name, nickname, photo_url, gender,
          classroom:classroom_id (id, level, room),
          student_support_sdq ( id, result_difficulties, evaluator_type ),
          student_support_eq ( id, eq_level ),
          student_support_risk_analysis ( id, risk_level, factors_summary ),
          student_support_cases ( id, status, risk_level )
        `)
        .is('deleted_at', null);

      if (error) throw error;
      return students;
    } catch (err) {
      console.error('Error in getAllStudentsForExecutive:', err);
      throw err;
    }
  },

  /**
   * บันทึกข้อมูลคัดกรอง SDQ (ฉลาดอัปเดต: หากมีข้อมูลเก่าของผู้ประเมินประเภทนี้อยู่แล้วจะอัปเดตของเดิมให้ทันที)
   */
  saveSdqAssessment: async (input: Omit<SdqAssessment, 'emotional_score' | 'conduct_score' | 'hyperactivity_score' | 'peer_score' | 'prosocial_score' | 'total_difficulties_score' | 'result_difficulties' | 'result_prosocial' | 'result_impact' | 'impact_score'>) => {
    try {
      // 1. คำนวณคะแนน
      const computedScores = calculateSdqScores(input.answers, input.evaluator_type);
      
      // 2. คำนวณคะแนนผลกระทบถ้ามี
      let impactData = {};
      if (input.impact_answers) {
        impactData = calculateSdqImpact(input.impact_answers);
      }

      const finalRecord = {
        ...input,
        ...computedScores,
        ...impactData
      };

      // 3. ตรวจสอบประวัติประเมินเดิมของประเภทผู้ประเมินนี้ เพื่อทำการอัปเดต (Update) แทนการเขียนซ้ำซ้อน
      const { data: existing } = await supabase
        .from('student_support_sdq')
        .select('id')
        .eq('student_id', input.student_id)
        .eq('evaluator_type', input.evaluator_type)
        .maybeSingle();

      let result;
      if (existing?.id) {
        // อัปเดตข้อมูลเก่าบน Supabase
        const { data, error } = await supabase
          .from('student_support_sdq')
          .update(finalRecord)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // เพิ่มข้อมูลใหม่ลงฐานข้อมูล
        const { data, error } = await supabase
          .from('student_support_sdq')
          .insert([finalRecord])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // 4. ทำการทริกเกอร์อัปเดตระดับความเสี่ยงภาพรวมของเด็กโดยอัตโนมัติ
      await studentSupportService.updateOverallRiskAnalysis(input.student_id);

      return result;
    } catch (err) {
      console.error('Error in saveSdqAssessment:', err);
      throw err;
    }
  },

  /**
   * บันทึกข้อมูลคัดกรอง EQ (ฉลาดอัปเดต: หากมีข้อมูลเก่าอยู่แล้วจะทำการอัปเดตให้ทันที)
   */
  saveEqAssessment: async (input: { student_id: string; evaluator_id: string; answers: number[] }) => {
    try {
      const computed = calculateEqScore(input.answers);
      
      const finalRecord = {
        ...input,
        ...computed
      };

      // ตรวจสอบประวัติประเมินเดิมเพื่อทำการอัปเดต (Update)
      const { data: existing } = await supabase
        .from('student_support_eq')
        .select('id')
        .eq('student_id', input.student_id)
        .maybeSingle();

      let result;
      if (existing?.id) {
        // อัปเดตของเดิม
        const { data, error } = await supabase
          .from('student_support_eq')
          .update(finalRecord)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // บันทึกของใหม่
        const { data, error } = await supabase
          .from('student_support_eq')
          .insert([finalRecord])
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      await studentSupportService.updateOverallRiskAnalysis(input.student_id);
      return result;
    } catch (err) {
      console.error('Error in saveEqAssessment:', err);
      throw err;
    }
  },

  /**
   * ดึงแบบประเมิน SDQ/EQ ของเด็กรายบุคคล
   */
  getStudentAssessments: async (studentId: string) => {
    try {
      const { data: sdq, error: sdqErr } = await supabase
        .from('student_support_sdq')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (sdqErr) throw sdqErr;

      const { data: eq, error: eqErr } = await supabase
        .from('student_support_eq')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (eqErr) throw eqErr;

      return { sdq, eq };
    } catch (err) {
      console.error('Error in getStudentAssessments:', err);
      throw err;
    }
  },

  /**
   * ดึงข้อมูลภาพรวม 360 องศาของเด็กนักเรียน (เชื่อมโยงข้อมูลเก่า + ข้อมูลใหม่เข้าด้วยกัน)
   */
  getStudent360Profile: async (studentId: string) => {
    try {
      // 1. ดึงประวัตินักเรียนและผู้ปกครอง
      const { data: student, error: stErr } = await supabase
        .from('students')
        .select(`
          *,
          classroom:classroom_id (id, level, room, advisor_id),
          parent:parent_id (*)
        `)
        .eq('id', studentId)
        .single();

      if (stErr) throw stErr;

      // 2. ดึงข้อมูลประวัติการเยี่ยมบ้าน
      const { data: homeVisit, error: hvErr } = await supabase
        .from('home_visits')
        .select(`
          *,
          home_visit_assessments (*),
          home_visit_photos (*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (hvErr) throw hvErr;

      // 3. ดึงข้อมูลการประเมินช่วยเหลือ SDQ / EQ
      const { sdq, eq } = await studentSupportService.getStudentAssessments(studentId);

      // 4. ดึงสถิติการเช็คชื่อเข้าแถว (Homeroom) และการลา
      const { data: homeroom, error: hrErr } = await supabase
        .from('homeroom_attendance')
        .select('status')
        .eq('student_id', studentId);

      if (hrErr) throw hrErr;

      const { data: leaves, error: lvErr } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('student_id', studentId);

      if (lvErr) throw lvErr;

      // 5. ดึงประวัติเคสช่วยเหลือ
      const { data: cases, error: csErr } = await supabase
        .from('student_support_cases')
        .select(`
          *,
          case_logs:student_support_case_logs (*)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (csErr) throw csErr;

      // สรุปสถิติขาดเรียนมาสาย
      const attendanceSummary = {
        present: homeroom ? homeroom.filter(a => a.status === 'PRESENT').length : 0,
        late: homeroom ? homeroom.filter(a => a.status === 'LATE').length : 0,
        absent: homeroom ? homeroom.filter(a => a.status === 'ABSENT').length : 0,
        leave: homeroom ? homeroom.filter(a => a.status === 'LEAVE').length : 0,
      };

      return {
        student,
        homeVisit,
        sdq,
        eq,
        attendanceSummary,
        leaves,
        cases
      };
    } catch (err) {
      console.error('Error in getStudent360Profile:', err);
      throw err;
    }
  },

  /**
   * คำนวณและปรับเปลี่ยนระดับความเสี่ยงภาพรวมของเด็กนักเรียนโดยอัตโนมัติ (Risk Intelligence engine)
   */
  updateOverallRiskAnalysis: async (studentId: string) => {
    try {
      // 1. ดึงคะแนนประเมินล่าสุดที่มี
      const { data: sdq } = await supabase
        .from('student_support_sdq')
        .select('result_difficulties')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: eq } = await supabase
        .from('student_support_eq')
        .select('eq_level')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

      // ดึงสถิติเช็คชื่อโฮมรูม
      const { data: homeroom } = await supabase
        .from('homeroom_attendance')
        .select('status')
        .eq('student_id', studentId);

      // ดึงการเยี่ยมบ้าน
      const { data: homeVisit } = await supabase
        .from('home_visits')
        .select('status, home_visit_assessments(risk_level)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const factors_summary: RiskAnalysis['factors_summary'] = {
        sdq: sdq && sdq.length > 0 ? (sdq[0].result_difficulties as any) : 'NORMAL',
        eq: eq && eq.length > 0 ? (eq[0].eq_level as any) : 'NORMAL',
        attendance: 'NORMAL',
        home_visit: 'NORMAL',
      };

      // วิเคราะห์ปัจจัยการเช็คชื่อ
      const totalAbsent = homeroom ? homeroom.filter(a => a.status === 'ABSENT').length : 0;
      if (totalAbsent > 5) {
        factors_summary.attendance = 'PROBLEM';
      } else if (totalAbsent > 3) {
        factors_summary.attendance = 'RISK';
      }

      // วิเคราะห์การเยี่ยมบ้าน
      if (homeVisit && homeVisit.home_visit_assessments && (homeVisit.home_visit_assessments as any).length > 0) {
        const hvRisk = (homeVisit.home_visit_assessments as any)[0].risk_level;
        factors_summary.home_visit = hvRisk === 'เสี่ยง' ? 'RISK' : hvRisk === 'ช่วยเหลือเร่งด่วน' ? 'URGENT' : 'NORMAL';
      }

      // คำนวณเป็น Risk Score: คิดคะแนนถ่วงน้ำหนักปัจจัยเสี่ยง 0.0 - 10.0
      let riskScore = 0.0;
      if (factors_summary.sdq === 'PROBLEM') riskScore += 3.5;
      else if (factors_summary.sdq === 'RISK') riskScore += 1.5;

      if (factors_summary.eq === 'LOWER_THAN_NORMAL') riskScore += 2.0;

      if (factors_summary.attendance === 'PROBLEM') riskScore += 2.5;
      else if (factors_summary.attendance === 'RISK') riskScore += 1.0;

      if (factors_summary.home_visit === 'URGENT') riskScore += 2.0;
      else if (factors_summary.home_visit === 'RISK') riskScore += 1.0;

      let risk_level: RiskAnalysis['risk_level'] = 'NORMAL';
      if (riskScore >= 6.0) risk_level = 'URGENT';    // แดง
      else if (riskScore >= 3.5) risk_level = 'RISK';  // ส้ม
      else if (riskScore >= 1.5) risk_level = 'MONITOR'; // เหลือง

      // อัปเดตลงตาราง
      const { error } = await supabase
        .from('student_support_risk_analysis')
        .upsert(
          {
            student_id: studentId,
            risk_score: riskScore,
            risk_level,
            factors_summary,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'student_id' }
        );

      if (error) throw error;
      return { riskScore, risk_level };
    } catch (err) {
      console.error('Error in updateOverallRiskAnalysis:', err);
    }
  },

  // ============================================================================
  // Case Management API Methods
  // ============================================================================

  /**
   * เปิดเคสช่วยเหลือ
   */
  openSupportCase: async (input: { student_id: string; title: string; description: string; risk_level: 'MONITOR' | 'RISK' | 'URGENT'; teacher_user_id: string }) => {
    try {
      // ดึง teacher id (สืบค้นด้วย user_id ก่อน แล้วจึง fallback ไปยัง id)
      let { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', input.teacher_user_id)
        .maybeSingle();

      if (!teacher) {
        const { data: fallbackTeacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', input.teacher_user_id)
          .maybeSingle();
        if (fallbackTeacher) teacher = fallbackTeacher;
      }

      if (!teacher) throw new Error('ไม่พบประวัติครูผู้เปิดเคสในระบบ');

      const { data, error } = await supabase
        .from('student_support_cases')
        .insert([{
          student_id: input.student_id,
          opened_by: teacher.id,
          title: input.title,
          description: input.description,
          risk_level: input.risk_level,
          status: 'OPEN'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error in openSupportCase:', err);
      throw err;
    }
  },

  /**
   * ลงบันทึกประวัติความคืบหน้าเคสช่วยเหลือ (Add Log Entry)
   */
  addCaseLog: async (input: { case_id: string; comment: string; teacher_user_id: string; update_status?: SupportCase['status'] }) => {
    try {
      // ดึง teacher id (สืบค้นด้วย user_id ก่อน แล้วจึง fallback ไปยัง id)
      let { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', input.teacher_user_id)
        .maybeSingle();

      if (!teacher) {
        const { data: fallbackTeacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', input.teacher_user_id)
          .maybeSingle();
        if (fallbackTeacher) teacher = fallbackTeacher;
      }

      if (!teacher) throw new Error('ไม่พบประวัติครูผู้บันทึกความคืบหน้า');

      const { data, error } = await supabase
        .from('student_support_case_logs')
        .insert([{
          case_id: input.case_id,
          logged_by: teacher.id,
          comment: input.comment
        }])
        .select()
        .single();

      if (error) throw error;

      // ถ้ามีการขออัปเดตสถานะของเคสหลัก
      if (input.update_status) {
        const updateFields: any = { status: input.update_status };
        if (input.update_status === 'CLOSED') {
          updateFields.closed_at = new Date().toISOString();
        }
        
        const { error: caseErr } = await supabase
          .from('student_support_cases')
          .update(updateFields)
          .eq('id', input.case_id);

        if (caseErr) throw caseErr;
      }

      return data;
    } catch (err) {
      console.error('Error in addCaseLog:', err);
      throw err;
    }
  },

  /**
   * ดึงข้อมูลเคสช่วยเหลือทั้งหมดที่เชื่อมโยงกับครูผู้ดูแลประจำชั้น
   */
  getAdvisorCases: async (teacherUserId: string) => {
    try {
      // ดึง teacher id (สืบค้นด้วย user_id ก่อน แล้วจึง fallback ไปยัง id)
      let { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', teacherUserId)
        .maybeSingle();

      if (!teacher) {
        const { data: fallbackTeacher } = await supabase
          .from('teachers')
          .select('id')
          .eq('id', teacherUserId)
          .maybeSingle();
        if (fallbackTeacher) teacher = fallbackTeacher;
      }

      if (!teacher) return [];

      const { data, error } = await supabase
        .from('student_support_cases')
        .select(`
          *,
          student:student_id (
            id, first_name, last_name, student_code,
            classroom:classroom_id (id, level, room)
          ),
          teacher:opened_by (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // กรองเฉพาะเด็กนักเรียนที่อยู่ในห้องที่ครูท่านนี้ดูแล
      const filteredCases = (data || []).filter((c: any) => {
        return c.student && c.student.classroom && c.student.classroom.advisor_id === teacher.id;
      });

      return filteredCases;
    } catch (err) {
      console.error('Error in getAdvisorCases:', err);
      throw err;
    }
  },

  // ============================================================================
  // V14: Recalculate + Dashboard Query Methods
  // ============================================================================

  /**
   * คำนวณคะแนน EQ ใหม่ทั้งหมดที่ยังไม่มี goodness_score
   * ใช้หลัง Migration เพื่ออัปเดต records เก่าให้ครบถ้วน
   */
  recalculateAllEqScores: async () => {
    try {
      const { data: records, error } = await supabase
        .from('student_support_eq')
        .select('id, student_id, answers')
        .is('goodness_score', null);

      if (error) throw error;
      if (!records || records.length === 0) {
        console.log('[EQ Recalculate] ไม่มี records ที่ต้องคำนวณใหม่');
        return { updated: 0 };
      }

      let updated = 0;
      for (const record of records) {
        try {
          const computed = calculateEqScore(record.answers);

          const { error: updateError } = await supabase
            .from('student_support_eq')
            .update(computed)
            .eq('id', record.id);

          if (!updateError) {
            updated++;
            await studentSupportService.updateOverallRiskAnalysis(record.student_id);
          } else {
            console.error(`[EQ Recalculate] ผิดพลาดที่ record ${record.id}:`, updateError);
          }
        } catch (calcErr) {
          console.error(`[EQ Recalculate] คำนวณล้มเหลว record ${record.id}:`, calcErr);
        }
      }

      console.log(`[EQ Recalculate] อัปเดตสำเร็จ ${updated}/${records.length} records`);
      return { updated, total: records.length };
    } catch (err) {
      console.error('Error in recalculateAllEqScores:', err);
      throw err;
    }
  },

  /**
   * V14: ดึงข้อมูลสรุปคะแนน SDQ ทั้งห้องเรียนแยกรายมิติ
   * สำหรับ Stacked 100% Bar Chart บน AdvisorDashboard
   */
  getClassroomSdqDashboard: async (classroomIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, gender,
          student_support_sdq (
            evaluator_type,
            emotional_score, conduct_score, hyperactivity_score,
            peer_score, prosocial_score, total_difficulties_score,
            result_difficulties, result_prosocial,
            result_emotional, result_conduct, result_hyperactivity, result_peer
          )
        `)
        .in('classroom_id', classroomIds)
        .is('deleted_at', null);

      if (error) throw error;

      // สรุปผลนับ NORMAL/RISK/PROBLEM รายมิติจาก evaluator_type = TEACHER (หลัก)
      const dimensions = ['emotional', 'conduct', 'hyperactivity', 'peer', 'prosocial'] as const;
      const summary: Record<string, { normal: number; risk: number; problem: number; names: { normal: string[]; risk: string[]; problem: string[] } }> = {};

      dimensions.forEach(dim => {
        summary[dim] = { normal: 0, risk: 0, problem: 0, names: { normal: [], risk: [], problem: [] } };
      });

      return { students: data || [], summary };
    } catch (err) {
      console.error('Error in getClassroomSdqDashboard:', err);
      throw err;
    }
  },

  /**
   * V14: นับความคืบหน้าการคัดกรองห้องเรียน
   * สำหรับ Donut Chart ตรงกลาง AdvisorDashboard (X/Y นักเรียนที่คัดกรองแล้ว)
   */
  getClassroomScreeningProgress: async (classroomIds: string[]) => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id, first_name, last_name,
          student_support_sdq ( evaluator_type ),
          student_support_risk_analysis ( risk_level )
        `)
        .in('classroom_id', classroomIds)
        .is('deleted_at', null);

      if (error) throw error;

      const total = students?.length || 0;

      // นับนักเรียนที่มีการประเมินอย่างน้อย 1 ชุด (TEACHER)
      const screened = (students || []).filter(s =>
        s.student_support_sdq && (s.student_support_sdq as any[]).some((sdq: any) => sdq.evaluator_type === 'TEACHER')
      ).length;

      // นับกลุ่มความเสี่ยง
      const riskGroups = { normal: 0, monitor: 0, risk: 0, urgent: 0 };
      (students || []).forEach(s => {
        const riskAnalysis = s.student_support_risk_analysis as any[];
        const level = riskAnalysis?.[0]?.risk_level || 'NORMAL';
        if (level === 'URGENT') riskGroups.urgent++;
        else if (level === 'RISK') riskGroups.risk++;
        else if (level === 'MONITOR') riskGroups.monitor++;
        else riskGroups.normal++;
      });

      return { total, screened, riskGroups, students: students || [] };
    } catch (err) {
      console.error('Error in getClassroomScreeningProgress:', err);
      throw err;
    }
  },
};
