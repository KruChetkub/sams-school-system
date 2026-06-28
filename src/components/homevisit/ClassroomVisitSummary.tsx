import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { createPortal } from 'react-dom';
import { FileText, Printer, Loader2, AlertCircle, Save } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

export default function ClassroomVisitSummary() {
  const { user, role } = useAuthStore();
  const { selectedYear } = useAcademicYearStore();
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable descriptive fields saved in localStorage
  const [descFields, setDescFields] = useState({
    notVisitedReason: '',
    jointAgencies: '',
    dataUtilization: '',
    parentConcerns: '',
    obstacles: '',
    suggestions: ''
  });

  // Load descFields from Supabase when classroom changes
  useEffect(() => {
    async function loadSummary() {
      if (!selectedClassroomId) return;
      
      try {
        const { data, error } = await supabase
          .from('classroom_visit_summaries')
          .select('*')
          .eq('classroom_id', selectedClassroomId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setDescFields({
            notVisitedReason: data.not_visited_reason || '',
            jointAgencies: data.joint_agencies || '',
            dataUtilization: data.data_utilization || '',
            parentConcerns: data.parent_concerns || '',
            obstacles: data.obstacles || '',
            suggestions: data.suggestions || ''
          });
        } else {
          // Try local storage draft fallback
          const saved = localStorage.getItem(`homevisit_summary_${selectedClassroomId}`);
          if (saved) {
            try {
              setDescFields(JSON.parse(saved));
              return;
            } catch (_) { }
          }
          setDescFields({
            notVisitedReason: '',
            jointAgencies: '',
            dataUtilization: '',
            parentConcerns: '',
            obstacles: '',
            suggestions: ''
          });
        }
      } catch (err) {
        console.error('Failed to load classroom summary:', err);
        // Fallback to localStorage draft
        const saved = localStorage.getItem(`homevisit_summary_${selectedClassroomId}`);
        if (saved) {
          try {
            setDescFields(JSON.parse(saved));
          } catch (_) { }
        }
      }
    }

    loadSummary();
  }, [selectedClassroomId]);

  // Save descFields draft to localStorage on change
  const handleDescChange = (key: keyof typeof descFields, val: string) => {
    const updated = { ...descFields, [key]: val };
    setDescFields(updated);
    if (selectedClassroomId) {
      localStorage.setItem(`homevisit_summary_${selectedClassroomId}`, JSON.stringify(updated));
    }
  };

  // Save descFields to Supabase
  const handleSaveSummary = async () => {
    if (!selectedClassroomId) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('classroom_visit_summaries')
        .upsert({
          classroom_id: selectedClassroomId,
          not_visited_reason: descFields.notVisitedReason,
          joint_agencies: descFields.jointAgencies,
          data_utilization: descFields.dataUtilization,
          parent_concerns: descFields.parentConcerns,
          obstacles: descFields.obstacles,
          suggestions: descFields.suggestions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'classroom_id'
        });

      if (error) throw error;
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to save classroom summary:', error);
      setErrorMsg(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSaving(false);
    }
  };

  // 1. Fetch classrooms
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ['classrooms_report_summary', selectedYear?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, level, room, advisor_id, advisor2_id')
        .eq('academic_year_id', selectedYear?.id || '');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedYear?.id
  });

  // 2. Fetch logged-in teacher profile to auto-select classroom
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher_profile_summary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('teachers')
        .select('id, user_id, first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && (role === 'TEACHER' || role === 'ADVISOR')
  });

  // Filter classrooms based on advisor permissions
  const filteredClassroomsList = useMemo(() => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return classrooms;
    }
    if (!teacherProfile?.id) return [];
    return classrooms.filter(c => c.advisor_id === teacherProfile.id || c.advisor2_id === teacherProfile.id);
  }, [classrooms, role, teacherProfile]);

  // Auto-select classroom
  useEffect(() => {
    if (filteredClassroomsList.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(filteredClassroomsList[0].id);
    }
  }, [filteredClassroomsList, selectedClassroomId]);

  // 3. Fetch advisor details
  const { data: activeClassroomDetail } = useQuery({
    queryKey: ['active_classroom_detail_summary', selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return null;

      // Safety check: Ensure teacher only queries their assigned classrooms
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && teacherProfile?.id) {
        const isMyClass = classrooms.some(c => c.id === selectedClassroomId && (c.advisor_id === teacherProfile.id || c.advisor2_id === teacherProfile.id));
        if (!isMyClass) return null;
      }

      const { data: classroom, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          advisor:teachers!classrooms_advisor_id_fkey(first_name, last_name),
          advisor2:teachers!classrooms_advisor2_id_fkey(first_name, last_name)
        `)
        .eq('id', selectedClassroomId)
        .maybeSingle();

      if (error) {
        const { data: simpleClass, error: err2 } = await supabase
          .from('classrooms')
          .select('*')
          .eq('id', selectedClassroomId)
          .maybeSingle();
        if (err2) throw err2;

        let adv1 = null;
        let adv2 = null;
        if (simpleClass?.advisor_id) {
          const { data: t1 } = await supabase.from('teachers').select('first_name, last_name').eq('id', simpleClass.advisor_id).maybeSingle();
          adv1 = t1;
        }
        if (simpleClass?.advisor2_id) {
          const { data: t2 } = await supabase.from('teachers').select('first_name, last_name').eq('id', simpleClass.advisor2_id).maybeSingle();
          adv2 = t2;
        }
        return {
          ...simpleClass,
          advisor: adv1,
          advisor2: adv2
        };
      }
      return classroom;
    },
    enabled: !!selectedClassroomId
  });

  // 4. Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['classroom_students_summary', selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return [];
      const { data, error } = await supabase
        .from('students')
        .select('id, gender, prefix, first_name, last_name, nickname, student_code, status')
        .eq('classroom_id', selectedClassroomId)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClassroomId
  });

  // 5. Fetch visits
  const studentIds = useMemo(() => students.map(s => s.id), [students]);
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['classroom_visits_summary', studentIds, selectedYear?.id],
    queryFn: async () => {
      if (studentIds.length === 0) return [];
      const { data, error } = await supabase
        .from('home_visits')
        .select(`
          *,
          home_visit_assessments(*)
        `)
        .eq('academic_year_id', selectedYear?.id || '')
        .eq('status', 'COMPLETED')
        .in('student_id', studentIds);
      if (error) throw error;
      return data || [];
    },
    enabled: studentIds.length > 0 && !!selectedYear?.id
  });

  const totalStudentsCount = students.length;
  const completedVisitsCount = visits.length;

  const stats = useMemo(() => {
    // Visited student gender counts
    let femaleVisited = 0;
    let maleVisited = 0;

    visits.forEach(v => {
      const s = students.find(x => x.id === v.student_id);
      if (s) {
        const isMale = s.gender === 'MALE' || s.gender === 'ชาย' || s.prefix === 'เด็กชาย' || s.prefix === 'นาย';
        const isFemale = s.gender === 'FEMALE' || s.gender === 'หญิง' || s.prefix === 'เด็กหญิง' || s.prefix === 'นางสาว';
        if (isFemale) femaleVisited++;
        else if (isMale) maleVisited++;
      }
    });

    const notVisited = totalStudentsCount - completedVisitsCount;

    // Family Structure
    let warmFamily = 0;
    let brokenFamily = 0;
    let bothDeceased = 0;
    let oneDeceased = 0;
    let divorcedParents = 0;
    let notWithParents = 0;

    // Risk factors
    let riskStudy = 0;
    let riskHealthProblem = 0;
    let riskHealthBehavior = 0;
    let riskDrug = 0;
    let riskViolence = 0;
    let riskCommute = 0;
    let riskSex = 0;
    let riskGame = 0;
    let riskEconomic = 0;
    let riskOther = 0;
    let urgentHelp = 0;

    visits.forEach(v => {
      const assessment = v.home_visit_assessments?.[0];
      const fd = assessment?.form_data || {};

      // Urgent Help
      if (assessment?.risk_level === 'URGENT') {
        urgentHelp++;
      }

      // Warm/Broken Family check
      const hasBrokenIndicators = Array.isArray(fd.welfare_safety) && (
        fd.welfare_safety.includes('พ่อแม่แยกทางกัน หรือแต่งงานใหม่') ||
        fd.welfare_safety.includes('มีความขัดแย้ง/ทะเลาะกันในครอบครัว') ||
        fd.welfare_safety.includes('มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว')
      );
      if (hasBrokenIndicators) {
        brokenFamily++;
      } else {
        warmFamily++;
      }

      // Parents status
      const relation = fd.relation_with_members || {};
      const fatherNone = relation.บิดา === 'ไม่มี';
      const motherNone = relation.มารดา === 'ไม่มี';

      if (fatherNone && motherNone) bothDeceased++;
      else if (fatherNone || motherNone) oneDeceased++;

      if (Array.isArray(fd.welfare_safety) && fd.welfare_safety.includes('พ่อแม่แยกทางกัน หรือแต่งงานใหม่')) {
        divorcedParents++;
      }

      // Living status
      if (fd.left_with === 'ญาติ' || fd.left_with === 'เพื่อนบ้าน' || fd.left_with === 'นักเรียนอยู่บ้านด้วยตนเอง' || fd.left_with === 'อื่นๆ') {
        notWithParents++;
      }

      // Risk filters
      if (Array.isArray(fd.school_help_needs) && fd.school_help_needs.includes('ด้านการเรียน')) {
        riskStudy++;
      }

      if (Array.isArray(fd.health_issues) && (
        fd.health_issues.includes('ร่างกายไม่แข็งแรง') ||
        fd.health_issues.includes('ป่วยเป็นโรคร้ายแรง/เรื้อรัง') ||
        fd.health_issues.includes('มีโรคประจำตัวหรือเจ็บป่วยบ่อย')
      )) {
        riskHealthProblem++;
      }

      if (Array.isArray(fd.health_issues) && fd.health_issues.length > 0) {
        riskHealthBehavior++;
      }

      if (Array.isArray(fd.substance_abuse) && fd.substance_abuse.length > 0) {
        riskDrug++;
      }

      if (Array.isArray(fd.violence) && fd.violence.length > 0) {
        riskViolence++;
      }

      if (fd.commute_method === 'เดิน' || (fd.commute_distance_km && parseFloat(fd.commute_distance_km) >= 5)) {
        riskCommute++;
      }

      if (Array.isArray(fd.sexual_behavior) && fd.sexual_behavior.length > 0) {
        riskSex++;
      }

      if (Array.isArray(fd.gaming_addiction) && fd.gaming_addiction.length > 0) {
        riskGame++;
      }

      if (Array.isArray(fd.school_help_needs) && fd.school_help_needs.includes('ด้านเศรษฐกิจ (ทุนการศึกษา)')) {
        riskEconomic++;
      }
    });

    return {
      femaleVisited,
      maleVisited,
      notVisited,
      warmFamily,
      brokenFamily,
      bothDeceased,
      oneDeceased,
      divorcedParents,
      notWithParents,
      riskStudy,
      riskHealthProblem,
      riskHealthBehavior,
      riskDrug,
      riskViolence,
      riskCommute,
      riskSex,
      riskGame,
      riskEconomic,
      riskOther,
      urgentHelp
    };
  }, [students, visits, totalStudentsCount, completedVisitsCount]);

  const classroomName = activeClassroomDetail ? `${activeClassroomDetail.level}/${activeClassroomDetail.room}` : '';
  const advisor1Name = activeClassroomDetail?.advisor ? `${activeClassroomDetail.advisor.first_name} ${activeClassroomDetail.advisor.last_name}` : '';
  const advisor2Name = activeClassroomDetail?.advisor2 ? `${activeClassroomDetail.advisor2.first_name} ${activeClassroomDetail.advisor2.last_name}` : '';
  const advisorsText = [advisor1Name, advisor2Name].filter(Boolean).join(' และ ');

  const isLoading = isLoadingClassrooms || isLoadingStudents || isLoadingVisits;

  const handleExportWord = async () => {
    if (!selectedClassroomId || completedVisitsCount === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/templates/แบบสรุปการเยี่ยมบ้านนักเรียน.docx');
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดเทมเพลต Word ได้');
      }
      const arrayBuffer = await response.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const academicYear = selectedYear?.year_name || '';

      doc.render({
        classroom_name: classroomName || '',
        academic_year: academicYear,
        advisor1: advisor1Name || '',
        advisor2: advisor2Name || '',
        total_students: String(totalStudentsCount),
        female_visited: String(stats.femaleVisited),
        male_visited: String(stats.maleVisited),
        not_visited: String(stats.notVisited),
        not_visited_reason: descFields.notVisitedReason || 'ไม่มี',
        warm_family: String(stats.warmFamily),
        broken_family: String(stats.brokenFamily),
        both_deceased: String(stats.bothDeceased),
        one_deceased: String(stats.oneDeceased),
        divorced_parents: String(stats.divorcedParents),
        not_with_parents: String(stats.notWithParents),
        risk_study: String(stats.riskStudy),
        risk_health_problem: String(stats.riskHealthProblem),
        risk_health_behavior: String(stats.riskHealthBehavior),
        risk_drug: String(stats.riskDrug),
        risk_violence: String(stats.riskViolence),
        risk_commute: String(stats.riskCommute),
        risk_sex: String(stats.riskSex),
        risk_game: String(stats.riskGame),
        risk_economic: String(stats.riskEconomic),
        risk_other: String(stats.riskOther || 0),
        urgent_help: String(stats.urgentHelp),
        joint_agencies: descFields.jointAgencies || 'ไม่มี',
        data_utilization: descFields.dataUtilization || 'ไม่มี',
        parent_concerns: descFields.parentConcerns || 'ไม่มี',
        obstacles: descFields.obstacles || 'ไม่มี',
        suggestions: descFields.suggestions || 'ไม่มี',
      });

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const fileLevel = activeClassroomDetail ? activeClassroomDetail.level : '';
      const fileRoom = activeClassroomDetail ? activeClassroomDetail.room : '';
      saveAs(out, `แบบสรุปการเยี่ยมบ้านนักเรียน_ม_${fileLevel}_${fileRoom}.docx`);
    } catch (error) {
      console.error('Export Word failed:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ Word: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  // Print layout wrapper
  const renderPrintContent = (forPreview = false) => {
    if (!selectedClassroomId) return null;



    const BlankLines = ({ count = 2 }: { count?: number }) => (
      <div style={{ marginTop: 2 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ borderBottom: '1px dotted #555', height: 18, marginBottom: 3, width: '100%' }} />
        ))}
      </div>
    );

    const ItemRow = ({ num, children }: { num: string | number; children: React.ReactNode }) => (
      <div style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'baseline', fontSize: 15, lineHeight: 1.4 }}>
        <span style={{ minWidth: 32, flexShrink: 0 }}>{num}.</span>
        <span style={{ flex: 1 }}>{children}</span>
      </div>
    );

    const CountBox = ({ val }: { val: number | string }) => (
      <span style={{ display: 'inline-block', minWidth: 55, textAlign: 'center', borderBottom: '1px dotted #555', marginLeft: 4, marginRight: 4 }}>{val}</span>
    );

    return (
      <div className={forPreview ? '' : 'print-only'} style={{ fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif", color: 'black', background: 'white', fontSize: 15 }}>
        <style type="text/css">
          {`
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
            .print-only { display: none; }
            @media print {
              body { background: white !important; color: black !important; margin: 0; }
              .print-only { display: block !important; }
              .no-print { display: none !important; }
            }
          `}
        </style>

        {/* === PAGE 1 === */}
        <div style={{ padding: '1.5cm 2.5cm' }}>
          {/* Title */}
          <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            แบบสรุปการเยี่ยมบ้านนักเรียน ชั้นมัธยมศึกษาปีที่ {classroomName || '........./..........'}
          </p>
          <p style={{ textAlign: 'center', fontSize: 15, marginBottom: 12 }}>
            ปีการศึกษา {selectedYear?.year_name || '..........'}
          </p>

          {/* Advisors - numbers 1 and 2 perfectly aligned */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 4 }}>
              <span style={{ minWidth: 80, flexShrink: 0 }}>ครูที่ปรึกษา</span>
              <span style={{ minWidth: 24, textAlign: 'center', flexShrink: 0 }}>1</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #555', minHeight: 20, paddingLeft: 6 }}>{advisor1Name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 4 }}>
              <span style={{ minWidth: 80, flexShrink: 0 }}></span>
              <span style={{ minWidth: 24, textAlign: 'center', flexShrink: 0 }}>2</span>
              <span style={{ flex: 1, borderBottom: '1px dotted #555', minHeight: 20, paddingLeft: 6 }}>{advisor2Name}</span>
            </div>
          </div>

          {/* Items 1–5 */}
          <ItemRow num={1}>
            จำนวนนักเรียนทั้งหมด <CountBox val={totalStudentsCount} /> คน
          </ItemRow>
          <ItemRow num={2}>
            จำนวนนักเรียน <u>เพศหญิง</u> ที่โรงเรียนออกเยี่ยมบ้าน <CountBox val={stats.femaleVisited} /> คน
          </ItemRow>
          <ItemRow num={3}>
            จำนวนนักเรียน <u>เพศชาย</u> ที่โรงเรียนออกเยี่ยมบ้าน <CountBox val={stats.maleVisited} /> คน
          </ItemRow>
          <ItemRow num={4}>
            จำนวนนักเรียนที่ไม่ได้ออกเยี่ยมบ้าน <CountBox val={stats.notVisited} /> คน
          </ItemRow>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'flex-start', fontSize: 15 }}>
            <span style={{ minWidth: 32, flexShrink: 0 }}>5.</span>
            <div style={{ flex: 1 }}>
              สาเหตุที่ไม่ได้ออกเยี่ยมบ้าน
              {descFields.notVisitedReason ? (
                <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22, marginTop: 2 }}>{descFields.notVisitedReason}</div>
              ) : (
                <BlankLines count={2} />
              )}
            </div>
          </div>

          {/* Items 6–11 */}
          <ItemRow num={6}>
            จำนวนครอบครัวนักเรียนที่มีสภาพอบอุ่น <CountBox val={stats.warmFamily} /> คน
          </ItemRow>
          <ItemRow num={7}>
            จำนวนครอบครัวนักเรียนที่มีสภาพครอบครัวแตกแยก <CountBox val={stats.brokenFamily} /> คน
          </ItemRow>
          <ItemRow num={8}>
            จำนวนนักเรียนที่บิดาและมารดาเสียชีวิต <CountBox val={stats.bothDeceased} /> คน
          </ItemRow>
          <ItemRow num={9}>
            จำนวนนักเรียนที่บิดา หรือ มารดาเสียชีวิต <CountBox val={stats.oneDeceased} /> คน
          </ItemRow>
          <ItemRow num={10}>
            จำนวนนักเรียนที่บิดาและมารดาเลิกร้างกัน <CountBox val={stats.divorcedParents} /> คน
          </ItemRow>
          <ItemRow num={11}>
            จำนวนนักเรียนที่ไม่ได้อาศัยอยู่กับบิดาหรือมารดาของตนเอง <CountBox val={stats.notWithParents} /> คน
          </ItemRow>

          {/* Items 12–22 */}
          <ItemRow num={12}>
            จำนวนนักเรียนเสี่ยงหรือมีปัญหาด้านการเรียน <CountBox val={stats.riskStudy} /> คน
          </ItemRow>
          <ItemRow num={13}>
            จำนวนนักเรียนมีปัญหาด้านสุขภาพ <CountBox val={stats.riskHealthProblem} /> คน
          </ItemRow>
          <ItemRow num={14}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "ด้านสุขภาพ" <CountBox val={stats.riskHealthBehavior} /> คน
          </ItemRow>
          <ItemRow num={15}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "การใช้สารเสพติด" <CountBox val={stats.riskDrug} /> คน
          </ItemRow>
          <ItemRow num={16}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "ความรุนแรง" <CountBox val={stats.riskViolence} /> คน
          </ItemRow>
          <ItemRow num={17}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "การเดินทางมาเรียน" <CountBox val={stats.riskCommute} /> คน
          </ItemRow>
          <ItemRow num={18}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "ด้านเพศ" <CountBox val={stats.riskSex} /> คน
          </ItemRow>
          <ItemRow num={19}>
            จำนวนนักเรียนมีพฤติกรรมเสี่ยง "ติดเกม" <CountBox val={stats.riskGame} /> คน
          </ItemRow>
          <ItemRow num={20}>
            จำนวนนักเรียนมีปัญหาด้านเศรษฐกิจ <CountBox val={stats.riskEconomic} /> คน
          </ItemRow>
          <ItemRow num={21}>
            จำนวนนักเรียนมีปัญหาด้านอื่นๆ โปรดระบุปัญหาและจำนวน <CountBox val={stats.riskOther || ''} /> คน
          </ItemRow>
          <ItemRow num={22}>
            จำนวนนักเรียนที่ต้องได้รับการช่วยเหลือเร่งด่วน <CountBox val={stats.urgentHelp} /> คน
          </ItemRow>
        </div>

        {/* === PAGE 2 === */}
        <div style={{ padding: '2cm 2.5cm', pageBreakBefore: 'always' }}>
          {/* Items 23–27 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>23. หน่วยงาน/สหวิชาชีพ/องค์กร ที่ร่วมเยี่ยมบ้าน</div>
            {descFields.jointAgencies ? (
              <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22 }}>{descFields.jointAgencies}</div>
            ) : (
              <BlankLines count={2} />
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>24. นำข้อมูลเยี่ยมบ้านนักเรียนไปใช้ประโยชน์อย่างไร</div>
            {descFields.dataUtilization ? (
              <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22 }}>{descFields.dataUtilization}</div>
            ) : (
              <BlankLines count={3} />
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>25. ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน</div>
            {descFields.parentConcerns ? (
              <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22 }}>{descFields.parentConcerns}</div>
            ) : (
              <BlankLines count={3} />
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>26. ปัญหา/อุปสรรค</div>
            {descFields.obstacles ? (
              <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22 }}>{descFields.obstacles}</div>
            ) : (
              <BlankLines count={3} />
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>27. ความคิดเห็นและข้อเสนอแนะ</div>
            {descFields.suggestions ? (
              <div style={{ fontSize: 15, padding: '2px 0', whiteSpace: 'pre-wrap', borderBottom: '1px dotted #555', minHeight: 22 }}>{descFields.suggestions}</div>
            ) : (
              <BlankLines count={3} />
            )}
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
            <div style={{ width: '44%' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <span style={{ flexShrink: 0, marginRight: 4 }}>ลงชื่อ</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #555' }} />
              </div>
              <p style={{ textAlign: 'center', marginTop: 6 }}>({advisor1Name || '...................................................'})</p>
              <p style={{ textAlign: 'center' }}>ครูที่ปรึกษา</p>
              <p style={{ marginTop: 4 }}>วันที่............./...................../.........</p>
            </div>
            <div style={{ width: '44%' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
                <span style={{ flexShrink: 0, marginRight: 4 }}>ลงชื่อ</span>
                <span style={{ flex: 1, borderBottom: '1px dotted #555' }} />
              </div>
              <p style={{ textAlign: 'center', marginTop: 6 }}>({advisor2Name || '...................................................'})</p>
              <p style={{ textAlign: 'center' }}>ครูที่ปรึกษา</p>
              <p style={{ marginTop: 4 }}>วันที่............./...................../.........</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 home-visit-layout no-print pb-12">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">รายงานสรุปการเยี่ยมบ้าน (Word Style)</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">แบบสรุปสถิติมิติต่าง ๆ และกรอกข้อมูลข้อแนะนำเพื่อประกอบการปริ้นส่งฝ่ายบริหาร</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Classroom Selector */}
          {isLoadingClassrooms ? (
            <div className="h-10 w-36 bg-gray-100 dark:bg-slate-850 animate-pulse rounded-xl" />
          ) : (
            (role === 'ADMIN' || role === 'SUPER_ADMIN' || filteredClassroomsList.length > 1) && (
              <select
                value={selectedClassroomId || ''}
                onChange={(e) => setSelectedClassroomId(e.target.value)}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[160px]"
              >
                {filteredClassroomsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    มัธยมศึกษาปีที่ {c.level}/{c.room}
                  </option>
                ))}
              </select>
            )
          )}

          <button
            onClick={handleExportWord}
            disabled={completedVisitsCount === 0 || isExporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            <span>โหลดเป็นไฟล์ Word</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={completedVisitsCount === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={18} />
            <span>พิมพ์รายงาน (Print)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 min-h-[300px]">
          <Loader2 size={36} className="text-emerald-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">กำลังโหลดสถิติภาพรวม...</p>
        </div>
      ) : completedVisitsCount === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 min-h-[300px] text-center">
          <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center rounded-2xl mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">ไม่พบข้อมูล</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">ยังไม่มีประวัติการเยี่ยมบ้านในห้องเรียนนี้ คุณจำเป็นต้องดำเนินการเยี่ยมบ้านนักเรียนก่อนจึงจะดึงข้อมูลมาแสดงผลได้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form details section */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">
              <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-400">กรอกข้อมูลเพิ่มเติมเพื่อจัดเตรียมก่อนพิมพ์</h2>
              <button
                onClick={handleSaveSummary}
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition duration-300 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>บันทึกข้อมูล (Save)</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">กรณีมีนักเรียนที่ไม่ได้ออกเยี่ยมบ้าน โปรดระบุเหตุผล:</label>
              <textarea
                value={descFields.notVisitedReason}
                onChange={(e) => handleDescChange('notVisitedReason', e.target.value)}
                placeholder="ระบุชื่อนักเรียนและเหตุผล เช่น เด็กชาย ก. เดินทางไปต่างจังหวัดช่วงปิดภาคเรียน..."
                rows={2}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">หน่วยงาน/สหวิชาชีพ/องค์กร ที่ร่วมออกเยี่ยมบ้าน:</label>
              <textarea
                value={descFields.jointAgencies}
                onChange={(e) => handleDescChange('jointAgencies', e.target.value)}
                placeholder="ระบุหน่วยงาน เช่น ปลัดอำเภอ, เจ้าหน้าที่รพ.สต., กำนัน/ผู้ใหญ่บ้าน..."
                rows={2}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">การนำข้อมูลเยี่ยมบ้านนักเรียนไปใช้ประโยชน์ในการดูแลช่วยเหลือ:</label>
              <textarea
                value={descFields.dataUtilization}
                onChange={(e) => handleDescChange('dataUtilization', e.target.value)}
                placeholder="เช่น นำข้อมูลไปส่งต่อระบบคัดกรองทุนการศึกษา, จัดกลุ่มเด็กเสี่ยงเพื่อเฝ้าระวังพฤติกรรมติดเกม..."
                rows={3}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">ข้อห่วงใยของผู้ปกครองที่มีต่อนักเรียน:</label>
              <textarea
                value={descFields.parentConcerns}
                onChange={(e) => handleDescChange('parentConcerns', e.target.value)}
                placeholder="เช่น ผู้ปกครองกังวลเรื่องการคบเพื่อนนอกเวลาเรียนและการใช้โทรศัพท์ช่วงกลางคืน..."
                rows={3}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">ปัญหา / อุปสรรค ในการออกเยี่ยมบ้าน:</label>
              <textarea
                value={descFields.obstacles}
                onChange={(e) => handleDescChange('obstacles', e.target.value)}
                placeholder="เช่น สภาพเส้นทางคมนาคมทุรกันดารในช่วงฤดูฝน, การประสานเวลากับผู้ปกครองทำได้ยากเนื่องจากผู้ปกครองทำงานประจำ..."
                rows={2}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400">ความคิดเห็นและข้อเสนอแนะเพิ่มเติมของครูที่ปรึกษา:</label>
              <textarea
                value={descFields.suggestions}
                onChange={(e) => handleDescChange('suggestions', e.target.value)}
                placeholder="เช่น ควรมีการบูรณาการสัปดาห์เยี่ยมบ้านกับเทศบาลท้องถิ่นเพื่อการช่วยเหลือเด็กด้านปัจจัยสี่..."
                rows={2}
                className="border border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-850 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Quick Stats sidebar preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-md font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">โครงสร้างครอบครัวหลัก</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">สภาพอบอุ่น:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{stats.warmFamily} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">สภาพแตกแยก/แยกทาง:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{stats.brokenFamily} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">พ่อแม่แยกทาง/แต่งงานใหม่:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{stats.divorcedParents} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ไม่ได้อาศัยอยู่กับพ่อแม่:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.notWithParents} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">บิดามารดาเสียชีวิตทั้งคู่:</span>
                  <span className="font-semibold text-red-500">{stats.bothDeceased} คน</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-md font-bold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">ระดับความเสี่ยงและปัญหา</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">เสี่ยง/ปัญหาการเรียน:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{stats.riskStudy} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ปัญหาทางเศรษฐกิจ:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{stats.riskEconomic} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ความเสี่ยง "ติดเกม":</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.riskGame} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ความเสี่ยง "สารเสพติด":</span>
                  <span className="font-semibold text-red-500">{stats.riskDrug} คน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ช่วยเหลือเร่งด่วน:</span>
                  <span className="font-bold text-red-600 dark:text-red-450">{stats.urgentHelp} คน</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A4 Print Preview Panel (screen only) */}
      {completedVisitsCount > 0 && (
        <div className="no-print">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">ตัวอย่างเอกสารก่อนพิมพ์ (Print Preview)</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">แสดงหน้าเอกสารขนาด A4 จริง — ตรงกับที่จะพิมพ์ออกมา</p>
              </div>
            </div>
            {/* A4 scaled container: A4 = 794px wide, scale to fit ~900px container */}
            <div style={{ overflowX: 'auto', background: '#f0f0f0', borderRadius: 12, padding: '24px 0' }}>
              <div style={{
                width: 794,
                margin: '0 auto',
                background: 'white',
                boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
                fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                color: 'black',
                fontSize: 15,
                borderRadius: 2,
              }}>
                {renderPrintContent(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border border-gray-100 dark:border-slate-800">
            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-full mx-auto mb-4 animate-bounce">
              <Save size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">บันทึกสำเร็จ</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">บันทึกข้อมูลสรุปการเยี่ยมบ้านลงระบบเรียบร้อยแล้วครับ</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition duration-300 shadow-md cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center relative border border-gray-100 dark:border-slate-800">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-950/40 text-red-650 dark:text-red-400 flex items-center justify-center rounded-full mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="w-full bg-red-650 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition duration-300 shadow-md cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Render Portal printable document */}
      {completedVisitsCount > 0 && createPortal(renderPrintContent(false), document.body)}
    </div>
  );
}
