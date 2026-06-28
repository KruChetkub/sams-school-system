import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { createPortal } from 'react-dom';
import { FileSpreadsheet, Printer, Loader2, AlertCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ClassroomVisitAnalysis() {
  const { user, role } = useAuthStore();
  const { selectedYear } = useAcademicYearStore();
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'student-parent' | 'family' | 'risk'>('student-parent');
  const [isExporting, setIsExporting] = useState(false);

  // 1. Fetch classrooms
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ['classrooms_report', selectedYear?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          id,
          level,
          room,
          advisor_id,
          advisor2_id
        `)
        .eq('academic_year_id', selectedYear?.id || '');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedYear?.id
  });

  // 2. Fetch logged-in teacher profile
  const { data: teacherProfile } = useQuery({
    queryKey: ['teacher_profile_report', user?.id],
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

  // Auto-select classroom for advisor or admin
  useEffect(() => {
    if (filteredClassroomsList.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(filteredClassroomsList[0].id);
    }
  }, [filteredClassroomsList, selectedClassroomId]);

  // 3. Fetch advisor details for current selected classroom
  const { data: activeClassroomDetail } = useQuery({
    queryKey: ['active_classroom_detail', selectedClassroomId],
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
    enabled: !!selectedClassroomId && (role === 'ADMIN' || role === 'SUPER_ADMIN' || !!teacherProfile?.id)
  });

  // 4. Fetch students in the classroom
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['classroom_students', selectedClassroomId],
    queryFn: async () => {
      if (!selectedClassroomId) return [];

      // Safety check: Ensure teacher only queries their assigned classrooms
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && teacherProfile?.id) {
        const isMyClass = classrooms.some(c => c.id === selectedClassroomId && (c.advisor_id === teacherProfile.id || c.advisor2_id === teacherProfile.id));
        if (!isMyClass) return [];
      }

      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, prefix, first_name, last_name, gender, status')
        .eq('classroom_id', selectedClassroomId)
        .eq('status', 'ACTIVE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClassroomId && (role === 'ADMIN' || role === 'SUPER_ADMIN' || !!teacherProfile?.id)
  });

  // 5. Fetch completed visits for these students
  const studentIds = useMemo(() => students.map(s => s.id), [students]);
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['classroom_visits', studentIds, selectedYear?.id],
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

  const normalizeYearlyIncome = (incomeStr: string | number) => {
    if (!incomeStr) return 0;
    const inc = parseFloat(String(incomeStr));
    if (isNaN(inc)) return 0;
    return inc > 10000 ? inc : inc * 12;
  };

  const stats = useMemo(() => {
    const totalVisits = visits.length;
    const getPercent = (count: number) => {
      if (totalVisits === 0) return '0.0';
      return ((count / totalVisits) * 100).toFixed(1);
    };

    let maleCount = 0;
    let femaleCount = 0;
    students.forEach(s => {
      const isMale = s.gender === 'MALE' || s.gender === 'ชาย' || s.prefix === 'เด็กชาย' || s.prefix === 'นาย';
      const isFemale = s.gender === 'FEMALE' || s.gender === 'หญิง' || s.prefix === 'เด็กหญิง' || s.prefix === 'นางสาว';
      if (isMale) maleCount++;
      else if (isFemale) femaleCount++;
    });

    let hasParentCount = 0;
    let noParentCount = 0;
    let stateWelfareCount = 0;

    let timeMoreThan10 = 0;
    let time7To9 = 0;
    let time4To6 = 0;
    let timeLessThan4 = 0;

    const relationMembers = ['บิดา', 'มารดา', 'พี่ชาย/น้องชาย', 'พี่สาว/น้องสาว', 'ปู่/ย่า/ตา/ยาย', 'ญาติ', 'อื่นๆ'];
    const relationGrid: Record<string, Record<string, number>> = {};
    relationMembers.forEach(m => {
      relationGrid[m] = { 'สนิทสนม': 0, 'เฉย': 0, 'ห่างหิน': 0, 'ขัดแย้ง': 0, 'ไม่มี': 0 };
    });

    let leftWithRelative = 0;
    let leftWithNeighbor = 0;
    let leftWithSelf = 0;
    let leftWithOther = 0;

    let incMoreThan100k = 0;
    let inc50kTo100k = 0;
    let inc30kTo50k = 0;
    let inc20kTo30k = 0;
    let inc10kTo20k = 0;
    let incLessThan10k = 0;

    let needStudy = 0;
    let needBehavior = 0;
    let needEcon = 0;
    let needOther = 0;

    let welfareElderly = 0;
    let welfareDisable = 0;
    let welfareOther = 0;

    let healthUnhealthy = 0;
    let healthCongenital = 0;
    let healthMalnutrition = 0;
    let healthSerious = 0;
    let healthLowPhysical = 0;

    let safetyDivorced = 0;
    let safetySlum = 0;
    let safetyChronicSick = 0;
    let safetyDrugsFamily = 0;
    let safetyGambleFamily = 0;
    let safetyConflict = 0;
    let safetyNoGuardian = 0;
    let safetyViolence = 0;
    let safetyAbused = 0;
    let safetySexHarassed = 0;
    let safetyGamble = 0;

    let commuteParent = 0;
    let commuteBus = 0;
    let commuteMoto = 0;
    let commuteSchoolVan = 0;
    let commuteCar = 0;
    let commuteBike = 0;
    let commuteWalk = 0;
    let commuteOther = 0;

    let houseRuined = 0;
    let houseNoToilet = 0;

    let respHousework = 0;
    let respCareSick = 0;
    let respTrade = 0;
    let respWorkNearby = 0;
    let respFarm = 0;
    let respOther = 0;

    let hobbyTvMusic = 0;
    let hobbyRead = 0;
    let hobbyRacing = 0;
    let hobbyPark = 0;
    let hobbyMallMovie = 0;
    let hobbyFriends = 0;
    let hobbyGames = 0;
    let hobbySnooker = 0;
    let hobbyOther = 0;

    let drugFriends = 0;
    let drugFamily = 0;
    let drugEnvironment = 0;
    let drugInvolved = 0;
    let drugAddict = 0;

    let vioQuarrels = 0;
    let vioAggressive = 0;
    let vioFightsRegular = 0;
    let vioAssault = 0;
    let vioSelfHarm = 0;

    let sexProstitutionGroup = 0;
    let sexDeviceTime = 0;
    let sexPregnant = 0;
    let sexSell = 0;
    let sexObsessed = 0;
    let sexAssembly = 0;

    let gameMoreThan1h = 0;
    let gameNoCreative = 0;
    let gameIsolate = 0;
    let gameSpending = 0;
    let gameFriendGroup = 0;
    let gameShopNearby = 0;
    let gameMoreThan2h = 0;
    let gameObsessed = 0;
    let gameStealMoney = 0;
    let gameOther = 0;

    let netYes = 0;
    let netNo = 0;

    let devInClass = 0;
    let devLineFbMoreThan1h = 0;
    let devInClass2_3times = 0;
    let devLineFbMoreThan2h = 0;

    visits.forEach(v => {
      const assessment = v.home_visit_assessments?.[0];
      const fd = assessment?.form_data || {};

      if (fd.no_parent) noParentCount++;
      else hasParentCount++;

      if (fd.state_welfare === 'เคย') stateWelfareCount++;

      if (fd.time_together_hours !== undefined && fd.time_together_hours !== '') {
        const hrs = parseFloat(fd.time_together_hours);
        if (!isNaN(hrs)) {
          if (hrs >= 10) timeMoreThan10++;
          else if (hrs >= 7) time7To9++;
          else if (hrs >= 4) time4To6++;
          else timeLessThan4++;
        }
      }

      if (fd.relation_with_members && typeof fd.relation_with_members === 'object') {
        Object.keys(fd.relation_with_members).forEach(member => {
          const val = fd.relation_with_members[member];
          let mappedMember = member;
          if (member === 'พี่ชายน้องชาย') mappedMember = 'พี่ชาย/น้องชาย';
          if (member === 'พี่สาวน้องสาว') mappedMember = 'พี่สาว/น้องสาว';
          if (member === 'ปู่ย่าตายาย') mappedMember = 'ปู่/ย่า/ตา/ยาย';

          if (relationGrid[mappedMember]) {
            let mappedVal = val;
            if (val === 'เฉยๆ') mappedVal = 'เฉย';
            if (val === 'ห่างเหิน') mappedVal = 'ห่างหิน';
            if (relationGrid[mappedMember][mappedVal] !== undefined) {
              relationGrid[mappedMember][mappedVal]++;
            }
          }
        });
      }

      if (fd.left_with === 'ญาติ') leftWithRelative++;
      else if (fd.left_with === 'เพื่อนบ้าน') leftWithNeighbor++;
      else if (fd.left_with === 'นักเรียนอยู่บ้านด้วยตนเอง') leftWithSelf++;
      else if (fd.left_with) leftWithOther++;

      if (fd.household_income_per_person) {
        const inc = normalizeYearlyIncome(fd.household_income_per_person);
        if (inc > 100000) incMoreThan100k++;
        else if (inc > 50000) inc50kTo100k++;
        else if (inc > 30000) inc30kTo50k++;
        else if (inc > 20000) inc20kTo30k++;
        else if (inc > 10000) inc10kTo20k++;
        else incLessThan10k++;
      }

      if (Array.isArray(fd.school_help_needs)) {
        if (fd.school_help_needs.includes('ด้านการเรียน')) needStudy++;
        if (fd.school_help_needs.includes('ด้านพฤติกรรม')) needBehavior++;
        if (fd.school_help_needs.includes('ด้านเศรษฐกิจ (ทุนการศึกษา)')) needEcon++;
        if (fd.school_help_needs.includes('อื่นๆ') || fd.school_help_needs.some((x: string) => !['ด้านการเรียน', 'ด้านพฤติกรรม', 'ด้านเศรษฐกิจ (ทุนการศึกษา)'].includes(x))) needOther++;
      }

      if (Array.isArray(fd.help_received)) {
        if (fd.help_received.includes('เบี้ยผู้สูงอายุ')) welfareElderly++;
        if (fd.help_received.includes('เบี้ยพิการ')) welfareDisable++;
        if (fd.help_received.includes('อื่นๆ') || fd.help_received.some((x: string) => !['เบี้ยผู้สูงอายุ', 'เบี้ยพิการ'].includes(x))) welfareOther++;
      }

      if (Array.isArray(fd.health_issues)) {
        if (fd.health_issues.includes('ร่างกายไม่แข็งแรง')) healthUnhealthy++;
        if (fd.health_issues.includes('มีโรคประจำตัวหรือเจ็บป่วยบ่อย')) healthCongenital++;
        if (fd.health_issues.includes('มีภาวะทุพโภชนาการ')) healthMalnutrition++;
        if (fd.health_issues.includes('ป่วยเป็นโรคร้ายแรง/เรื้อรัง')) healthSerious++;
        if (fd.health_issues.includes('สมรรถภาพทางร่างกายต่ำ')) healthLowPhysical++;
      }

      if (Array.isArray(fd.welfare_safety)) {
        if (fd.welfare_safety.includes('พ่อแม่แยกทางกัน หรือแต่งงานใหม่')) safetyDivorced++;
        if (fd.welfare_safety.includes('ที่พักอาศัยอยู่ในชุมชนแออัดใกล้แหล่งมั่วสุม/สถานเริงรมย์')) safetySlum++;
        if (fd.welfare_safety.includes('มีบุคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ') || fd.welfare_safety.includes('มีบุคคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ')) safetyChronicSick++;
        if (fd.welfare_safety.includes('บุคคลในครอบครัวติดสารเสพติด')) safetyDrugsFamily++;
        if (fd.welfare_safety.includes('บุคคลในครอบครัวเล่นการพนัน')) safetyGambleFamily++;
        if (fd.welfare_safety.includes('มีความขัดแย้ง/ทะเลาะกันในครอบครัว')) safetyConflict++;
        if (fd.welfare_safety.includes('ไม่มีผู้ดูแล')) safetyNoGuardian++;
        if (fd.welfare_safety.includes('มีความขัดแย้งและมีการใช้ความรุนแรงในครอบครัว')) safetyViolence++;
        if (fd.welfare_safety.includes('ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน')) safetyAbused++;
        if (fd.welfare_safety.includes('ถูกล่วงละเมิดทางเพศ')) safetySexHarassed++;
        if (fd.welfare_safety.includes('เล่นการพนัน')) safetyGamble++;
      }

      if (fd.commute_method === 'ผู้ปกครองมาส่ง') commuteParent++;
      else if (fd.commute_method === 'รถโดยสารประจำทาง') commuteBus++;
      else if (fd.commute_method === 'รถจักรยานยนต์') commuteMoto++;
      else if (fd.commute_method === 'รถโรงเรียน') commuteSchoolVan++;
      else if (fd.commute_method === 'รถยนต์') commuteCar++;
      else if (fd.commute_method === 'รถจักรยาน') commuteBike++;
      else if (fd.commute_method === 'เดิน') commuteWalk++;
      else if (fd.commute_method) commuteOther++;

      if (Array.isArray(fd.housing_condition)) {
        if (fd.housing_condition.includes('สภาพบ้านทรุดโทรมหรือทำจากวัสดุพื้นบ้าน')) houseRuined++;
        if (fd.housing_condition.includes('ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณ')) houseNoToilet++;
      }

      if (Array.isArray(fd.responsibilities)) {
        if (fd.responsibilities.includes('ช่วยงานบ้าน')) respHousework++;
        if (fd.responsibilities.includes('ช่วยดูแลคนป่วย/พิการ')) respCareSick++;
        if (fd.responsibilities.includes('ช่วยค้าขายเล็กๆน้อยๆ')) respTrade++;
        if (fd.responsibilities.includes('ทำงานแถวบ้าน')) respWorkNearby++;
        if (fd.responsibilities.includes('ช่วยงานในนา/ไร่')) respFarm++;
        if (fd.responsibilities.includes('อื่นๆ')) respOther++;
      }

      if (Array.isArray(fd.hobbies)) {
        if (fd.hobbies.includes('ดูทีวี/ฟังเพลง')) hobbyTvMusic++;
        if (fd.hobbies.includes('อ่านหนังสือ')) hobbyRead++;
        if (fd.hobbies.includes('แว้น/สก๊อย')) hobbyRacing++;
        if (fd.hobbies.includes('ไปสวนสาธารณะ')) hobbyPark++;
        if (fd.hobbies.includes('ไปห้าง/ดูหนัง')) hobbyMallMovie++;
        if (fd.hobbies.includes('ไปหาเพื่อน')) hobbyFriends++;
        if (fd.hobbies.includes('เล่นคอม/มือถือ')) hobbyGames++;
        if (fd.hobbies.includes('ไปร้านสนุกเกอร์')) hobbySnooker++;
        if (fd.hobbies.includes('อื่นๆ')) hobbyOther++;
      }

      if (Array.isArray(fd.substance_abuse)) {
        if (fd.substance_abuse.includes('คบเพื่อนกลุ่มใช้สารเสพติด')) drugFriends++;
        if (fd.substance_abuse.includes('สมาชิกในครอบครัวเกี่ยวข้องกับยาเสพติด')) drugFamily++;
        if (fd.substance_abuse.includes('อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด')) drugEnvironment++;
        if (fd.substance_abuse.includes('ปัจจุบันเกี่ยวข้องกับสารเสพติด')) drugInvolved++;
        if (fd.substance_abuse.includes('เป็นผู้ติดบุหรี่/สุรา/สารเสพติดอื่นๆ')) drugAddict++;
      }

      if (Array.isArray(fd.violence)) {
        if (fd.violence.includes('มีการทะเลาะวิวาท')) vioQuarrels++;
        if (fd.violence.includes('ก้าวร้าว เกเร')) vioAggressive++;
        if (fd.violence.includes('ทะเลาะวิวาทเป็นประจำ')) vioFightsRegular++;
        if (fd.violence.includes('ทำร้ายร่างกายผู้อื่น')) vioAssault++;
        if (fd.violence.includes('ทำร้ายร่างกายตนเอง')) vioSelfHarm++;
      }

      if (Array.isArray(fd.sexual_behavior)) {
        if (fd.sexual_behavior.includes('อยู่ในกลุ่มขายบริการ')) sexProstitutionGroup++;
        if (fd.sexual_behavior.includes('ใช้เครื่องมือสื่อสารที่เกี่ยวข้องกับด้านเพศเป็นเวลานานและบ่อยครั้ง')) sexDeviceTime++;
        if (fd.sexual_behavior.includes('ตั้งครรภ์')) sexPregnant++;
        if (fd.sexual_behavior.includes('ขายบริการทางเพศ')) sexSell++;
        if (fd.sexual_behavior.includes('หมกมุ่นในเครื่องมือสื่อสารเรื่องที่เกี่ยวข้องทางเพศ')) sexObsessed++;
        if (fd.sexual_behavior.includes('มีการมั่วสุมทางเพศ')) sexAssembly++;
      }

      if (Array.isArray(fd.gaming_addiction)) {
        if (fd.gaming_addiction.includes('เล่นเกมเกินวันละ 1 ชั่วโมง')) gameMoreThan1h++;
        if (fd.gaming_addiction.includes('ขาดจินตนาการและความคิดสร้างสรรค์')) gameNoCreative++;
        if (fd.gaming_addiction.includes('เก็บตัว แยกจากกลุ่มเพื่อน')) gameIsolate++;
        if (fd.gaming_addiction.includes('ใช้จ่ายเงินผิดปกติ')) gameSpending++;
        if (fd.gaming_addiction.includes('อยู่ในกลุ่มเพื่อนเล่นเกม')) gameFriendGroup++;
        if (fd.gaming_addiction.includes('ร้านเกมใกล้บ้านหรือโรงเรียน')) gameShopNearby++;
        if (fd.gaming_addiction.includes('ใช้เวลาเล่นเกมเกิน 2 ชั่วโมง')) gameMoreThan2h++;
        if (fd.gaming_addiction.includes('หมกมุ่น จริงจังกับการเล่นเกม')) gameObsessed++;
        if (fd.gaming_addiction.includes('ใช้เงินสิ้นเปลือง โกหก ลักขโมยเงินเพื่อเล่นเกม')) gameStealMoney++;
        if (fd.gaming_addiction.includes('อื่นๆ')) gameOther++;
      }

      if (fd.internet_access === 'สามารถเข้าถึง Internet ได้จากที่บ้าน') netYes++;
      else if (fd.internet_access === 'ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน') netNo++;

      if (Array.isArray(fd.device_usage)) {
        if (fd.device_usage.includes('เคยใช้โทรศัพท์ในระหว่างเรียน')) devInClass++;
        if (fd.device_usage.includes('ใช้ Line/Facebook/Chat (เกินวันละ 1 ชั่วโมง)')) devLineFbMoreThan1h++;
        if (fd.device_usage.includes('ใช้โทรศัพท์มือถือในระหว่างเรียน 2 – 3 /วัน')) devInClass2_3times++;
        if (fd.device_usage.includes('ใช้ Line/Facebook/Chat (เกินวันละ 2 ชั่วโมง)')) devLineFbMoreThan2h++;
      }
    });

    return {
      maleCount, malePercent: ((maleCount / (totalStudentsCount || 1)) * 100).toFixed(1),
      femaleCount, femalePercent: ((femaleCount / (totalStudentsCount || 1)) * 100).toFixed(1),
      hasParentCount, hasParentPercent: getPercent(hasParentCount),
      noParentCount, noParentPercent: getPercent(noParentCount),
      stateWelfareCount, stateWelfarePercent: getPercent(stateWelfareCount),

      timeMoreThan10, timeMoreThan10Percent: getPercent(timeMoreThan10),
      time7To9, time7To9Percent: getPercent(time7To9),
      time4To6, time4To6Percent: getPercent(time4To6),
      timeLessThan4, timeLessThan4Percent: getPercent(timeLessThan4),

      relationGrid,

      leftWithRelative, leftWithRelativePercent: getPercent(leftWithRelative),
      leftWithNeighbor, leftWithNeighborPercent: getPercent(leftWithNeighbor),
      leftWithSelf, leftWithSelfPercent: getPercent(leftWithSelf),
      leftWithOther, leftWithOtherPercent: getPercent(leftWithOther),

      incMoreThan100k, incMoreThan100kPercent: getPercent(incMoreThan100k),
      inc50kTo100k, inc50kTo100kPercent: getPercent(inc50kTo100k),
      inc30kTo50k, inc30kTo50kPercent: getPercent(inc30kTo50k),
      inc20kTo30k, inc20kTo30kPercent: getPercent(inc20kTo30k),
      inc10kTo20k, inc10kTo20kPercent: getPercent(inc10kTo20k),
      incLessThan10k, incLessThan10kPercent: getPercent(incLessThan10k),

      needStudy, needStudyPercent: getPercent(needStudy),
      needBehavior, needBehaviorPercent: getPercent(needBehavior),
      needEcon, needEconPercent: getPercent(needEcon),
      needOther, needOtherPercent: getPercent(needOther),

      welfareElderly, welfareElderlyPercent: getPercent(welfareElderly),
      welfareDisable, welfareDisablePercent: getPercent(welfareDisable),
      welfareOther, welfareOtherPercent: getPercent(welfareOther),

      healthUnhealthy, healthUnhealthyPercent: getPercent(healthUnhealthy),
      healthCongenital, healthCongenitalPercent: getPercent(healthCongenital),
      healthMalnutrition, healthMalnutritionPercent: getPercent(healthMalnutrition),
      healthSerious, healthSeriousPercent: getPercent(healthSerious),
      healthLowPhysical, healthLowPhysicalPercent: getPercent(healthLowPhysical),

      safetyDivorced, safetyDivorcedPercent: getPercent(safetyDivorced),
      safetySlum, safetySlumPercent: getPercent(safetySlum),
      safetyChronicSick, safetyChronicSickPercent: getPercent(safetyChronicSick),
      safetyDrugsFamily, safetyDrugsFamilyPercent: getPercent(safetyDrugsFamily),
      safetyGambleFamily, safetyGambleFamilyPercent: getPercent(safetyGambleFamily),
      safetyConflict, safetyConflictPercent: getPercent(safetyConflict),
      safetyNoGuardian, safetyNoGuardianPercent: getPercent(safetyNoGuardian),
      safetyViolence, safetyViolencePercent: getPercent(safetyViolence),
      safetyAbused, safetyAbusedPercent: getPercent(safetyAbused),
      safetySexHarassed, safetySexHarassedPercent: getPercent(safetySexHarassed),
      safetyGamble, safetyGamblePercent: getPercent(safetyGamble),

      commuteParent, commuteParentPercent: getPercent(commuteParent),
      commuteBus, commuteBusPercent: getPercent(commuteBus),
      commuteMoto, commuteMotoPercent: getPercent(commuteMoto),
      commuteSchoolVan, commuteSchoolVanPercent: getPercent(commuteSchoolVan),
      commuteCar, commuteCarPercent: getPercent(commuteCar),
      commuteBike, commuteBikePercent: getPercent(commuteBike),
      commuteWalk, commuteWalkPercent: getPercent(commuteWalk),
      commuteOther, commuteOtherPercent: getPercent(commuteOther),

      houseRuined, houseRuinedPercent: getPercent(houseRuined),
      houseNoToilet, houseNoToiletPercent: getPercent(houseNoToilet),

      respHousework, respHouseworkPercent: getPercent(respHousework),
      respCareSick, respCareSickPercent: getPercent(respCareSick),
      respTrade, respTradePercent: getPercent(respTrade),
      respWorkNearby, respWorkNearbyPercent: getPercent(respWorkNearby),
      respFarm, respFarmPercent: getPercent(respFarm),
      respOther, respOtherPercent: getPercent(respOther),

      hobbyTvMusic, hobbyTvMusicPercent: getPercent(hobbyTvMusic),
      hobbyRead, hobbyReadPercent: getPercent(hobbyRead),
      hobbyRacing, hobbyRacingPercent: getPercent(hobbyRacing),
      hobbyPark, hobbyParkPercent: getPercent(hobbyPark),
      hobbyMallMovie, hobbyMallMoviePercent: getPercent(hobbyMallMovie),
      hobbyFriends, hobbyFriendsPercent: getPercent(hobbyFriends),
      hobbyGames, hobbyGamesPercent: getPercent(hobbyGames),
      hobbySnooker, hobbySnookerPercent: getPercent(hobbySnooker),
      hobbyOther, hobbyOtherPercent: getPercent(hobbyOther),

      drugFriends, drugFriendsPercent: getPercent(drugFriends),
      drugFamily, drugFamilyPercent: getPercent(drugFamily),
      drugEnvironment, drugEnvironmentPercent: getPercent(drugEnvironment),
      drugInvolved, drugInvolvedPercent: getPercent(drugInvolved),
      drugAddict, drugAddictPercent: getPercent(drugAddict),

      vioQuarrels, vioQuarrelsPercent: getPercent(vioQuarrels),
      vioAggressive, vioAggressivePercent: getPercent(vioAggressive),
      vioFightsRegular, vioFightsRegularPercent: getPercent(vioFightsRegular),
      vioAssault, vioAssaultPercent: getPercent(vioAssault),
      vioSelfHarm, vioSelfHarmPercent: getPercent(vioSelfHarm),

      sexProstitutionGroup, sexProstitutionGroupPercent: getPercent(sexProstitutionGroup),
      sexDeviceTime, sexDeviceTimePercent: getPercent(sexDeviceTime),
      sexPregnant, sexPregnantPercent: getPercent(sexPregnant),
      sexSell, sexSellPercent: getPercent(sexSell),
      sexObsessed, sexObsessedPercent: getPercent(sexObsessed),
      sexAssembly, sexAssemblyPercent: getPercent(sexAssembly),

      gameMoreThan1h, gameMoreThan1hPercent: getPercent(gameMoreThan1h),
      gameNoCreative, gameNoCreativePercent: getPercent(gameNoCreative),
      gameIsolate, gameIsolatePercent: getPercent(gameIsolate),
      gameSpending, gameSpendingPercent: getPercent(gameSpending),
      gameFriendGroup, gameFriendGroupPercent: getPercent(gameFriendGroup),
      gameShopNearby, gameShopNearbyPercent: getPercent(gameShopNearby),
      gameMoreThan2h, gameMoreThan2hPercent: getPercent(gameMoreThan2h),
      gameObsessed, gameObsessedPercent: getPercent(gameObsessed),
      gameStealMoney, gameStealMoneyPercent: getPercent(gameStealMoney),
      gameOther, gameOtherPercent: getPercent(gameOther),

      netYes, netYesPercent: getPercent(netYes),
      netNo, netNoPercent: getPercent(netNo),

      devInClass, devInClassPercent: getPercent(devInClass),
      devLineFbMoreThan1h, devLineFbMoreThan1hPercent: getPercent(devLineFbMoreThan1h),
      devInClass2_3times, devInClass2_3timesPercent: getPercent(devInClass2_3times),
      devLineFbMoreThan2h, devLineFbMoreThan2hPercent: getPercent(devLineFbMoreThan2h),
    };
  }, [students, visits, totalStudentsCount]);

  const classroomName = activeClassroomDetail ? `${activeClassroomDetail.level}/${activeClassroomDetail.room}` : '';
  const advisor1Name = activeClassroomDetail?.advisor ? `${activeClassroomDetail.advisor.first_name} ${activeClassroomDetail.advisor.last_name}` : '';
  const advisor2Name = activeClassroomDetail?.advisor2 ? `${activeClassroomDetail.advisor2.first_name} ${activeClassroomDetail.advisor2.last_name}` : '';
  const advisorsText = [advisor1Name, advisor2Name].filter(Boolean).join(' และ ');

  const isLoading = isLoadingClassrooms || isLoadingStudents || isLoadingVisits;

  const handleExportExcel = async () => {
    if (!selectedClassroomId || completedVisitsCount === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/templates/วิเคราะห์สรุปการเยี่ยมบ้าน.xlsx');
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดเทมเพลต Excel ได้');
      }
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        throw new Error('ไม่พบแผ่นงานในเทมเพลต');
      }

      // 1. หัวรายงาน
      worksheet.getCell('A1').value = `สรุปการเยี่ยมบ้าน ปีการศึกษา ${selectedYear?.year_name || ''}`;
      worksheet.getCell('A2').value = `ระดับชั้นมัธยมศึกษาปีที่  ${classroomName || ''} โรงเรียนเชียงของวิทยาคม`;
      worksheet.getCell('A3').value = `ครูที่ปรึกษา ${advisorsText || ''}`;

      // ฟังก์ชันช่วยใส่จำนวนและร้อยละ
      const setCellVal = (qtyCell: string, pctCell: string, qtyVal: number, pctVal: string) => {
        worksheet.getCell(qtyCell).value = qtyVal;
        worksheet.getCell(pctCell).value = parseFloat(pctVal) || 0;
      };

      // 1. ข้อมูลนักเรียน
      setCellVal('K6', 'L6', stats.maleCount, stats.maleCountPercent);
      setCellVal('K7', 'L7', stats.femaleCount, stats.femaleCountPercent);

      // 2. ข้อมูลผู้ปกครอง
      setCellVal('K9', 'L9', stats.hasParentCount, stats.hasParentCountPercent);
      setCellVal('K10', 'L10', stats.noParentCount, stats.noParentCountPercent);
      setCellVal('K11', 'L11', stats.stateWelfareCount, stats.stateWelfareCountPercent);

      // 3. ความสัมพันธ์ในครอบครัว
      // 3.1 เวลาสมาชิกในครอบครัวมีเวลาอยู่ร่วมกัน
      setCellVal('K14', 'L14', stats.timeMoreThan10, stats.timeMoreThan10Percent);
      setCellVal('K15', 'L15', stats.time7To9, stats.time7To9Percent);
      setCellVal('K16', 'L16', stats.time4To6, stats.time4To6Percent);
      setCellVal('K17', 'L17', stats.timeLessThan4, stats.timeLessThan4Percent);

      // 3.2 ความสัมพันธ์ระหว่างนักเรียนกับสมาชิกในครอบครัว
      const relationMembers = ['บิดา', 'มารดา', 'พี่ชาย/น้องชาย', 'พี่สาว/น้องสาว', 'ปู่/ย่า/ตา/ยาย', 'ญาติ', 'อื่นๆ'];
      const relationRows: Record<string, number> = {
        'บิดา': 21,
        'มารดา': 22,
        'พี่ชาย/น้องชาย': 23,
        'พี่สาว/น้องสาว': 24,
        'ปู่/ย่า/ตา/ยาย': 25,
        'ญาติ': 26,
        'อื่นๆ': 27
      };

      relationMembers.forEach(member => {
        const row = relationRows[member];
        if (row && stats.relationGrid[member]) {
          const grid = stats.relationGrid[member];
          const totalMemberVisits = Object.values(grid).reduce((a, b) => a + b, 0);
          const getRelPercent = (val: number) => {
            if (totalMemberVisits === 0) return 0;
            return parseFloat(((val / totalMemberVisits) * 100).toFixed(1)) || 0;
          };

          worksheet.getCell(`D${row}`).value = grid['สนิทสนม'];
          worksheet.getCell(`E${row}`).value = getRelPercent(grid['สนิทสนม']);
          worksheet.getCell(`F${row}`).value = grid['เฉย'];
          worksheet.getCell(`G${row}`).value = getRelPercent(grid['เฉย']);
          worksheet.getCell(`H${row}`).value = grid['ห่างหิน'];
          worksheet.getCell(`I${row}`).value = getRelPercent(grid['ห่างหิน']);
          worksheet.getCell(`J${row}`).value = grid['ขัดแย้ง'];
          worksheet.getCell(`K${row}`).value = getRelPercent(grid['ขัดแย้ง']);
          worksheet.getCell(`L${row}`).value = grid['ไม่มี'];
          worksheet.getCell(`M${row}`).value = getRelPercent(grid['ไม่มี']);
        }
      });

      // 3.3 กรณีที่ผู้ปกครองไม่อยู่บ้านฝากเด็กนักเรียนอยู่บ้านกับใคร
      setCellVal('K29', 'L29', stats.leftWithRelative, stats.leftWithRelativePercent);
      setCellVal('K30', 'L30', stats.leftWithNeighbor, stats.leftWithNeighborPercent);
      setCellVal('K31', 'L31', stats.leftWithSelf, stats.leftWithSelfPercent);
      setCellVal('K32', 'L32', stats.leftWithOther, stats.leftWithOtherPercent);

      // 3.4 รายได้ครัวเรือนเฉลี่ยต่อคน
      setCellVal('K39', 'L39', stats.incMoreThan100k, stats.incMoreThan100kPercent);
      setCellVal('K40', 'L40', stats.inc50kTo100k, stats.inc50kTo100kPercent);
      setCellVal('K41', 'L41', stats.inc30kTo50k, stats.inc30kTo50kPercent);
      setCellVal('K42', 'L42', stats.inc20kTo30k, stats.inc20kTo30kPercent);
      setCellVal('K43', 'L43', stats.inc10kTo20k, stats.inc10kTo20kPercent);
      setCellVal('K44', 'L44', stats.incLessThan10k, stats.incLessThan10kPercent);

      // 3.5 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน
      setCellVal('K46', 'L46', stats.needStudy, stats.needStudyPercent);
      setCellVal('K47', 'L47', stats.needBehavior, stats.needBehaviorPercent);
      setCellVal('K48', 'L48', stats.needEcon, stats.needEconPercent);
      setCellVal('K49', 'L49', stats.needOther, stats.needOtherPercent);

      // 3.6 ความช่วยเหลือที่ครอบครัวเคยได้รับจากหน่วยงานหรือต้องการได้รับการช่วยเหลือ
      setCellVal('K51', 'L51', stats.welfareElderly, stats.welfareElderlyPercent);
      setCellVal('K52', 'L52', stats.welfareDisable, stats.welfareDisablePercent);
      setCellVal('K53', 'L53', stats.welfareOther, stats.welfareOtherPercent);

      // 4. พฤติกรรมและความเสี่ยง
      // 4.1 สุขภาพ
      setCellVal('K56', 'L56', stats.healthUnhealthy, stats.healthUnhealthyPercent);
      setCellVal('K57', 'L57', stats.healthCongenital, stats.healthCongenitalPercent);
      setCellVal('K58', 'L58', stats.healthMalnutrition, stats.healthMalnutritionPercent);
      setCellVal('K59', 'L59', stats.healthSerious, stats.healthSeriousPercent);
      setCellVal('K60', 'L60', stats.healthLowPhysical, stats.healthLowPhysicalPercent);

      // 4.2 สวัสดิการหรือความปลอดภัย
      setCellVal('K62', 'L62', stats.safetyDivorced, stats.safetyDivorcedPercent);
      setCellVal('K63', 'L63', stats.safetySlum, stats.safetySlumPercent);
      setCellVal('K64', 'L64', stats.safetyChronicSick, stats.safetyChronicSickPercent);
      setCellVal('K65', 'L65', stats.safetyDrugsFamily, stats.safetyDrugsFamilyPercent);
      setCellVal('K66', 'L66', stats.safetyGambleFamily, stats.safetyGambleFamilyPercent);
      setCellVal('K67', 'L67', stats.safetyConflict, stats.safetyConflictPercent);
      setCellVal('K68', 'L68', stats.safetyNoGuardian, stats.safetyNoGuardianPercent);
      setCellVal('K69', 'L69', stats.safetyViolence, stats.safetyViolencePercent);
      setCellVal('K70', 'L70', stats.safetyAbused, stats.safetyAbusedPercent);
      setCellVal('K71', 'L71', stats.safetySexHarassed, stats.safetySexHarassedPercent);
      setCellVal('K72', 'L72', stats.safetyGamble, stats.safetyGamblePercent);

      // 4.3 การเดินทางของนักเรียนไปโรงเรียน
      setCellVal('K75', 'L75', stats.commuteParent, stats.commuteParentPercent);
      setCellVal('K76', 'L76', stats.commuteBus, stats.commuteBusPercent);
      setCellVal('K77', 'L77', stats.commuteMoto, stats.commuteMotoPercent);
      setCellVal('K78', 'L78', stats.commuteSchoolVan, stats.commuteSchoolVanPercent);
      setCellVal('K79', 'L79', stats.commuteCar, stats.commuteCarPercent);
      setCellVal('K80', 'L80', stats.commuteBike, stats.commuteBikePercent);
      setCellVal('K81', 'L81', stats.commuteWalk, stats.commuteWalkPercent);
      setCellVal('K82', 'L82', stats.commuteOther, stats.commuteOtherPercent);

      // 4.4 สภาพที่อยู่อาศัย
      setCellVal('K84', 'L84', stats.houseRuined, stats.houseRuinedPercent);
      setCellVal('K85', 'L85', stats.houseNoToilet, stats.houseNoToiletPercent);

      // 4.5 ภาระงานความรับผิดชอบของนักเรียนที่มีต่อครอบครัว
      setCellVal('K87', 'L87', stats.respHousework, stats.respHouseworkPercent);
      setCellVal('K88', 'L88', stats.respCareSick, stats.respCareSickPercent);
      setCellVal('K89', 'L89', stats.respTrade, stats.respTradePercent);
      setCellVal('K90', 'L90', stats.respWorkNearby, stats.respWorkNearbyPercent);
      setCellVal('K91', 'L91', stats.respFarm, stats.respFarmPercent);
      setCellVal('K92', 'L92', stats.respOther, stats.respOtherPercent);

      // 4.6 กิจกรรมยามว่างหรืองานอดิเรก
      setCellVal('K94', 'L94', stats.hobbyTvMusic, stats.hobbyTvMusicPercent);
      setCellVal('K95', 'L95', stats.hobbyRead, stats.hobbyReadPercent);
      setCellVal('K96', 'L96', stats.hobbyRacing, stats.hobbyRacingPercent);
      setCellVal('K97', 'L97', stats.hobbyPark, stats.hobbyParkPercent);
      setCellVal('K98', 'L98', stats.hobbyMallMovie, stats.hobbyMallMoviePercent);
      setCellVal('K99', 'L99', stats.hobbyFriends, stats.hobbyFriendsPercent);
      setCellVal('K100', 'L100', stats.hobbyGames, stats.hobbyGamesPercent);
      setCellVal('K101', 'L101', stats.hobbySnooker, stats.hobbySnookerPercent);
      setCellVal('K102', 'L102', stats.hobbyOther, stats.hobbyOtherPercent);

      // 4.7 พฤติกรรมการใช้สารเสพติด
      setCellVal('K104', 'L104', stats.drugFriends, stats.drugFriendsPercent);
      setCellVal('K105', 'L105', stats.drugFamily, stats.drugFamilyPercent);
      setCellVal('K106', 'L106', stats.drugEnvironment, stats.drugEnvironmentPercent);
      setCellVal('K107', 'L107', stats.drugInvolved, stats.drugInvolvedPercent);
      setCellVal('K108', 'L108', stats.drugAddict, stats.drugAddictPercent);

      // 4.8 พฤติกรรมการใช้ความรุนแรง
      setCellVal('K110', 'L110', stats.vioQuarrels, stats.vioQuarrelsPercent);
      setCellVal('K111', 'L111', stats.vioAggressive, stats.vioAggressivePercent);
      setCellVal('K112', 'L112', stats.vioFightsRegular, stats.vioFightsRegularPercent);
      setCellVal('K113', 'L113', stats.vioAssault, stats.vioAssaultPercent);
      setCellVal('K114', 'L114', stats.vioSelfHarm, stats.vioSelfHarmPercent);

      // 4.9 พฤติกรรมทางเพศ
      setCellVal('K116', 'L116', stats.sexProstitutionGroup, stats.sexProstitutionGroupPercent);
      setCellVal('K117', 'L117', stats.sexDeviceTime, stats.sexDeviceTimePercent);
      setCellVal('K118', 'L118', stats.sexPregnant, stats.sexPregnantPercent);
      setCellVal('K119', 'L119', stats.sexSell, stats.sexSellPercent);
      setCellVal('K120', 'L120', stats.sexObsessed, stats.sexObsessedPercent);
      setCellVal('K121', 'L121', stats.sexAssembly, stats.sexAssemblyPercent);

      // 4.10 การติดเกม
      setCellVal('K123', 'L123', stats.gameMoreThan1h, stats.gameMoreThan1hPercent);
      setCellVal('K124', 'L124', stats.gameNoCreative, stats.gameNoCreativePercent);
      setCellVal('K125', 'L125', stats.gameIsolate, stats.gameIsolatePercent);
      setCellVal('K126', 'L126', stats.gameSpending, stats.gameSpendingPercent);
      setCellVal('K127', 'L127', stats.gameFriendGroup, stats.gameFriendGroupPercent);
      setCellVal('K128', 'L128', stats.gameShopNearby, stats.gameShopNearbyPercent);
      setCellVal('K129', 'L129', stats.gameMoreThan2h, stats.gameMoreThan2hPercent);
      setCellVal('K130', 'L130', stats.gameObsessed, stats.gameObsessedPercent);
      setCellVal('K131', 'L131', stats.gameStealMoney, stats.gameStealMoneyPercent);
      setCellVal('K132', 'L132', stats.gameOther, stats.gameOtherPercent);

      // 4.11 การเข้าถึงสื่อคอมพิวเตอร์และอินเตอร์เน็ตที่บ้าน
      setCellVal('K134', 'L134', stats.netYes, stats.netYesPercent);
      setCellVal('K135', 'L135', stats.netNo, stats.netNoPercent);

      // 4.12 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์
      setCellVal('K137', 'L137', stats.devInClass, stats.devInClassPercent);
      setCellVal('K138', 'L138', stats.devLineFbMoreThan1h, stats.devLineFbMoreThan1hPercent);
      setCellVal('K139', 'L139', stats.devInClass2_3times, stats.devInClass2_3timesPercent);
      setCellVal('K140', 'L140', stats.devLineFbMoreThan2h, stats.devLineFbMoreThan2hPercent);

      // ส่งออกไฟล์
      const buffer = await workbook.xlsx.writeBuffer();
      const fileLevel = activeClassroomDetail ? activeClassroomDetail.level : '';
      const fileRoom = activeClassroomDetail ? activeClassroomDetail.room : '';
      saveAs(new Blob([buffer]), `วิเคราะห์สรุปการเยี่ยมบ้าน_ม_${fileLevel}_${fileRoom}.xlsx`);
    } catch (error) {
      console.error('Export Excel failed:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ Excel: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  const renderPrintContent = (forPreview = false) => {
    if (!selectedClassroomId) return null;
    return (
      <div className={forPreview ? 'sarabun-print' : 'print-only sarabun-print'} style={{ color: 'black', background: 'white', width: '100%', padding: 32, fontFamily: "'Sarabun', sans-serif" }}>
        <style type="text/css">
          {`
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
            .print-only { display: none; }
            .sarabun-print { font-family: 'Sarabun', sans-serif; color: black; }
            .print-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .print-table th, .print-table td { border: 1px solid black !important; padding: 4px 8px; font-size: 13px; color: black !important; }
            .print-table th { background-color: #f2f2f2 !important; font-weight: bold; }
            .print-table td:nth-child(2), .print-table td:nth-child(3) { text-align: center; }
            @media print {
              body { background: white !important; color: black !important; }
              .print-only { display: block !important; }
              .no-print { display: none !important; }
            }
          `}
        </style>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">วิเคราะห์สรุปการเยี่ยมบ้าน ปีการศึกษา {selectedYear?.year_name || '..........'}</h2>
          <h3 className="text-lg">ระดับชั้นมัธยมศึกษาปีที่ {classroomName || '..........'} โรงเรียนเชียงของวิทยาคม</h3>
          <p className="text-sm mt-1">ครูที่ปรึกษา: {advisorsText || '..................................................'}</p>
          <p className="text-xs text-gray-500 mt-1">จำนวนนักเรียนทั้งหมด: {totalStudentsCount} คน | ดำเนินการเยี่ยมบ้านเสร็จสิ้น: {completedVisitsCount} คน</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th className="w-1/2 text-left">ประเด็นการประเมิน</th>
              <th className="w-1/4">จำนวน (คน)</th>
              <th className="w-1/4">ร้อยละ (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3}>1. ข้อมูลนักเรียน (เทียบกับนักเรียนทั้งหมดในชั้นเรียน)</td>
            </tr>
            <tr>
              <td>- เพศชาย</td>
              <td>{stats.maleCount}</td>
              <td>{stats.malePercent}</td>
            </tr>
            <tr>
              <td>- เพศหญิง</td>
              <td>{stats.femaleCount}</td>
              <td>{stats.femalePercent}</td>
            </tr>

            <tr className="bg-gray-100 font-bold">
              <td colSpan={3}>2. ข้อมูลผู้ปกครอง (เทียบกับจำนวนนักเรียนที่ได้รับการเยี่ยมบ้าน)</td>
            </tr>
            <tr>
              <td>- มีผู้ปกครอง</td>
              <td>{stats.hasParentCount}</td>
              <td>{stats.hasParentPercent}</td>
            </tr>
            <tr>
              <td>- ไม่มีผู้ปกครอง (ขาดแคลน/กำพร้า/ไม่มีผู้ดูแลหลัก)</td>
              <td>{stats.noParentCount}</td>
              <td>{stats.noParentPercent}</td>
            </tr>
            <tr>
              <td>- ผู้ปกครองเคยลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (บัตรคนจน)</td>
              <td>{stats.stateWelfareCount}</td>
              <td>{stats.stateWelfarePercent}</td>
            </tr>

            <tr className="bg-gray-100 font-bold">
              <td colSpan={3}>3. ความสัมพันธ์ในครอบครัว</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={3}>3.1 เวลาที่สมาชิกในครอบครัวมีเวลาอยู่ร่วมกัน/วัน</td>
            </tr>
            <tr>
              <td>- มากกว่า 10 ชม./วัน</td>
              <td>{stats.timeMoreThan10}</td>
              <td>{stats.timeMoreThan10Percent}</td>
            </tr>
            <tr>
              <td>- 7-9 ชม./วัน</td>
              <td>{stats.time7To9}</td>
              <td>{stats.time7To9Percent}</td>
            </tr>
            <tr>
              <td>- 4-6 ชม./วัน</td>
              <td>{stats.time4To6}</td>
              <td>{stats.time4To6Percent}</td>
            </tr>
            <tr>
              <td>- น้อยกว่า 4 ชม./วัน</td>
              <td>{stats.timeLessThan4}</td>
              <td>{stats.timeLessThan4Percent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>3.3 กรณีผู้ปกครองไม่อยู่บ้านฝากนักเรียนอาศัยอยู่กับใคร</td>
            </tr>
            <tr>
              <td>- ญาติ</td>
              <td>{stats.leftWithRelative}</td>
              <td>{stats.leftWithRelativePercent}</td>
            </tr>
            <tr>
              <td>- เพื่อนบ้าน</td>
              <td>{stats.leftWithNeighbor}</td>
              <td>{stats.leftWithNeighborPercent}</td>
            </tr>
            <tr>
              <td>- นักเรียนอยู่บ้านด้วยตนเอง</td>
              <td>{stats.leftWithSelf}</td>
              <td>{stats.leftWithSelfPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.leftWithOther}</td>
              <td>{stats.leftWithOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>3.4 รายได้ครัวเรือนเฉลี่ยต่อคนต่อปี</td>
            </tr>
            <tr>
              <td>- มากกว่า 100,001 บาท/ปี</td>
              <td>{stats.incMoreThan100k}</td>
              <td>{stats.incMoreThan100kPercent}</td>
            </tr>
            <tr>
              <td>- 50,001 - 100,000 บาท/ปี</td>
              <td>{stats.inc50kTo100k}</td>
              <td>{stats.inc50kTo100kPercent}</td>
            </tr>
            <tr>
              <td>- 30,001 - 50,000 บาท/ปี</td>
              <td>{stats.inc30kTo50k}</td>
              <td>{stats.inc30kTo50kPercent}</td>
            </tr>
            <tr>
              <td>- 20,001 - 30,000 บาท/ปี</td>
              <td>{stats.inc20kTo30k}</td>
              <td>{stats.inc20kTo30kPercent}</td>
            </tr>
            <tr>
              <td>- 10,001 - 20,000 บาท/ปี</td>
              <td>{stats.inc10kTo20k}</td>
              <td>{stats.inc10kTo20kPercent}</td>
            </tr>
            <tr>
              <td>- ต่ำกว่า 10,000 บาท/ปี</td>
              <td>{stats.incLessThan10k}</td>
              <td>{stats.incLessThan10kPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>3.5 สิ่งที่ผู้ปกครองต้องการให้โรงเรียนช่วยเหลือนักเรียน</td>
            </tr>
            <tr>
              <td>- ด้านการเรียน</td>
              <td>{stats.needStudy}</td>
              <td>{stats.needStudyPercent}</td>
            </tr>
            <tr>
              <td>- ด้านพฤติกรรม</td>
              <td>{stats.needBehavior}</td>
              <td>{stats.needBehaviorPercent}</td>
            </tr>
            <tr>
              <td>- ด้านเศรษฐกิจ (ขอรับทุนการศึกษา)</td>
              <td>{stats.needEcon}</td>
              <td>{stats.needEconPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.needOther}</td>
              <td>{stats.needOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>3.6 ความช่วยเหลือที่ครอบครัวเคยได้รับจากหน่วยงานอื่น</td>
            </tr>
            <tr>
              <td>- เบี้ยผู้สูงอายุ</td>
              <td>{stats.welfareElderly}</td>
              <td>{stats.welfareElderlyPercent}</td>
            </tr>
            <tr>
              <td>- เบี้ยผู้พิการ</td>
              <td>{stats.welfareDisable}</td>
              <td>{stats.welfareDisablePercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.welfareOther}</td>
              <td>{stats.welfareOtherPercent}</td>
            </tr>

            <tr className="bg-gray-100 font-bold">
              <td colSpan={3}>4. พฤติกรรมและความเสี่ยง</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={3}>4.1 สุขภาพ</td>
            </tr>
            <tr>
              <td>- ร่างกายไม่แข็งแรง</td>
              <td>{stats.healthUnhealthy}</td>
              <td>{stats.healthUnhealthyPercent}</td>
            </tr>
            <tr>
              <td>- มีโรคประจำตัวหรือเจ็บป่วยบ่อย</td>
              <td>{stats.healthCongenital}</td>
              <td>{stats.healthCongenitalPercent}</td>
            </tr>
            <tr>
              <td>- มีภาวะทุพโภชนาการ (ขาดสารอาหาร/น้ำหนักไม่ได้เกณฑ์)</td>
              <td>{stats.healthMalnutrition}</td>
              <td>{stats.healthMalnutritionPercent}</td>
            </tr>
            <tr>
              <td>- ป่วยเป็นโรคร้ายแรง/เรื้อรัง</td>
              <td>{stats.healthSerious}</td>
              <td>{stats.healthSeriousPercent}</td>
            </tr>
            <tr>
              <td>- สมรรถภาพทางร่างกายต่ำ</td>
              <td>{stats.healthLowPhysical}</td>
              <td>{stats.healthLowPhysicalPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.2 สวัสดิการหรือความปลอดภัย</td>
            </tr>
            <tr>
              <td>- พ่อแม่แยกทางกัน หรือแต่งงานใหม่</td>
              <td>{stats.safetyDivorced}</td>
              <td>{stats.safetyDivorcedPercent}</td>
            </tr>
            <tr>
              <td>- ที่พักอาศัยอยู่ในชุมชนแออัดหรือใกล้แหล่งมั่วสุม/สถานเริงรมย์</td>
              <td>{stats.safetySlum}</td>
              <td>{stats.safetySlumPercent}</td>
            </tr>
            <tr>
              <td>- มีบุคคลในครอบครัวเจ็บป่วยด้วยโรคร้ายแรง/เรื้อรัง/ติดต่อ</td>
              <td>{stats.safetyChronicSick}</td>
              <td>{stats.safetyChronicSickPercent}</td>
            </tr>
            <tr>
              <td>- บุคคลในครอบครัวติดสารเสพติด</td>
              <td>{stats.safetyDrugsFamily}</td>
              <td>{stats.safetyDrugsFamilyPercent}</td>
            </tr>
            <tr>
              <td>- บุคคลในครอบครัวเล่นการพนัน</td>
              <td>{stats.safetyGambleFamily}</td>
              <td>{stats.safetyGambleFamilyPercent}</td>
            </tr>
            <tr>
              <td>- มีความขัดแย้ง/ทะเลาะกันในครอบครัว</td>
              <td>{stats.safetyConflict}</td>
              <td>{stats.safetyConflictPercent}</td>
            </tr>
            <tr>
              <td>- ไม่มีผู้ดูแลนักเรียน</td>
              <td>{stats.safetyNoGuardian}</td>
              <td>{stats.safetyNoGuardianPercent}</td>
            </tr>
            <tr>
              <td>- มีความขัดแย้งและใช้ความรุนแรงในครอบครัว</td>
              <td>{stats.safetyViolence}</td>
              <td>{stats.safetyViolencePercent}</td>
            </tr>
            <tr>
              <td>- ถูกทารุณ/ทำร้ายจากบุคคลในครอบครัว/เพื่อนบ้าน</td>
              <td>{stats.safetyAbused}</td>
              <td>{stats.safetyAbusedPercent}</td>
            </tr>
            <tr>
              <td>- ถูกล่วงละเมิดทางเพศ</td>
              <td>{stats.safetySexHarassed}</td>
              <td>{stats.safetySexHarassedPercent}</td>
            </tr>
            <tr>
              <td>- เล่นการพนัน</td>
              <td>{stats.safetyGamble}</td>
              <td>{stats.safetyGamblePercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.3 การเดินทางของนักเรียนไปโรงเรียน</td>
            </tr>
            <tr>
              <td>- ผู้ปกครองมาส่ง</td>
              <td>{stats.commuteParent}</td>
              <td>{stats.commuteParentPercent}</td>
            </tr>
            <tr>
              <td>- รถโดยสารประจำทาง</td>
              <td>{stats.commuteBus}</td>
              <td>{stats.commuteBusPercent}</td>
            </tr>
            <tr>
              <td>- รถจักรยานยนต์</td>
              <td>{stats.commuteMoto}</td>
              <td>{stats.commuteMotoPercent}</td>
            </tr>
            <tr>
              <td>- รถโรงเรียน</td>
              <td>{stats.commuteSchoolVan}</td>
              <td>{stats.commuteSchoolVanPercent}</td>
            </tr>
            <tr>
              <td>- รถยนต์ส่วนตัว</td>
              <td>{stats.commuteCar}</td>
              <td>{stats.commuteCarPercent}</td>
            </tr>
            <tr>
              <td>- รถจักรยาน</td>
              <td>{stats.commuteBike}</td>
              <td>{stats.commuteBikePercent}</td>
            </tr>
            <tr>
              <td>- เดินมาโรงเรียน</td>
              <td>{stats.commuteWalk}</td>
              <td>{stats.commuteWalkPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.commuteOther}</td>
              <td>{stats.commuteOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.4 สภาพที่อยู่อาศัย</td>
            </tr>
            <tr>
              <td>- บ้านทรุดโทรม/ทำจากวัสดุพื้นบ้าน/วัสดุเหลือใช้</td>
              <td>{stats.houseRuined}</td>
              <td>{stats.houseRuinedPercent}</td>
            </tr>
            <tr>
              <td>- ไม่มีห้องส้วมในที่อยู่อาศัยหรือบริเวณ</td>
              <td>{stats.houseNoToilet}</td>
              <td>{stats.houseNoToiletPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.5 ภาระงานความรับผิดชอบนักเรียนต่อครอบครัว</td>
            </tr>
            <tr>
              <td>- ช่วยงานบ้าน</td>
              <td>{stats.respHousework}</td>
              <td>{stats.respHouseworkPercent}</td>
            </tr>
            <tr>
              <td>- ช่วยคนดูแลคนเจ็บป่วย/พิการ</td>
              <td>{stats.respCareSick}</td>
              <td>{stats.respCareSickPercent}</td>
            </tr>
            <tr>
              <td>- ช่วยค้าขายเล็กๆน้อยๆ</td>
              <td>{stats.respTrade}</td>
              <td>{stats.respTradePercent}</td>
            </tr>
            <tr>
              <td>- ทำงานรับจ้างแถวบ้าน</td>
              <td>{stats.respWorkNearby}</td>
              <td>{stats.respWorkNearbyPercent}</td>
            </tr>
            <tr>
              <td>- ช่วยงานในนา/ไร่</td>
              <td>{stats.respFarm}</td>
              <td>{stats.respFarmPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.respOther}</td>
              <td>{stats.respOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.6 กิจกรรมยามว่างหรืองานอดิเรก</td>
            </tr>
            <tr>
              <td>- ดูทีวี / ฟังเพลง</td>
              <td>{stats.hobbyTvMusic}</td>
              <td>{stats.hobbyTvMusicPercent}</td>
            </tr>
            <tr>
              <td>- อ่านหนังสือ</td>
              <td>{stats.hobbyRead}</td>
              <td>{stats.hobbyReadPercent}</td>
            </tr>
            <tr>
              <td>- แว้น / สก๊อย (ขี่รถจักรยานยนต์ซิ่ง)</td>
              <td>{stats.hobbyRacing}</td>
              <td>{stats.hobbyRacingPercent}</td>
            </tr>
            <tr>
              <td>- ไปสวนสาธารณะ</td>
              <td>{stats.hobbyPark}</td>
              <td>{stats.hobbyParkPercent}</td>
            </tr>
            <tr>
              <td>- ไปเที่ยวห้าง / ดูหนัง</td>
              <td>{stats.hobbyMallMovie}</td>
              <td>{stats.hobbyMallMoviePercent}</td>
            </tr>
            <tr>
              <td>- ไปเที่ยวกับเพื่อน / ไปหาเพื่อน</td>
              <td>{stats.hobbyFriends}</td>
              <td>{stats.hobbyFriendsPercent}</td>
            </tr>
            <tr>
              <td>- เล่นเกม คอมพิวเตอร์ / มือถือ</td>
              <td>{stats.hobbyGames}</td>
              <td>{stats.hobbyGamesPercent}</td>
            </tr>
            <tr>
              <td>- ไปร้านสนุกเกอร์</td>
              <td>{stats.hobbySnooker}</td>
              <td>{stats.hobbySnookerPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.hobbyOther}</td>
              <td>{stats.hobbyOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.7 พฤติกรรมการใช้สารเสพติด</td>
            </tr>
            <tr>
              <td>- คบเพื่อนกลุ่มใช้สารเสพติด</td>
              <td>{stats.drugFriends}</td>
              <td>{stats.drugFriendsPercent}</td>
            </tr>
            <tr>
              <td>- สมาชิกในครอบครัวเกี่ยวข้องกับยาเสพติด</td>
              <td>{stats.drugFamily}</td>
              <td>{stats.drugFamilyPercent}</td>
            </tr>
            <tr>
              <td>- อยู่ในสภาพแวดล้อมที่ใช้สารเสพติด</td>
              <td>{stats.drugEnvironment}</td>
              <td>{stats.drugEnvironmentPercent}</td>
            </tr>
            <tr>
              <td>- ปัจจุบันเกี่ยวข้องกับสารเสพติด</td>
              <td>{stats.drugInvolved}</td>
              <td>{stats.drugInvolvedPercent}</td>
            </tr>
            <tr>
              <td>- เป็นผู้ติดบุหรี่ สุรา หรือสารเสพติดอื่นๆ</td>
              <td>{stats.drugAddict}</td>
              <td>{stats.drugAddictPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.8 พฤติกรรมการใช้ความรุนแรง</td>
            </tr>
            <tr>
              <td>- มีการทะเลาะวิวาท</td>
              <td>{stats.vioQuarrels}</td>
              <td>{stats.vioQuarrelsPercent}</td>
            </tr>
            <tr>
              <td>- ก้าวร้าว เกเร</td>
              <td>{stats.vioAggressive}</td>
              <td>{stats.vioAggressivePercent}</td>
            </tr>
            <tr>
              <td>- ทะเลาะวิวาทเป็นประจำ</td>
              <td>{stats.vioFightsRegular}</td>
              <td>{stats.vioFightsRegularPercent}</td>
            </tr>
            <tr>
              <td>- ทำร้ายร่างกายผู้อื่น</td>
              <td>{stats.vioAssault}</td>
              <td>{stats.vioAssaultPercent}</td>
            </tr>
            <tr>
              <td>- ทำร้ายร่างกายตนเอง</td>
              <td>{stats.vioSelfHarm}</td>
              <td>{stats.vioSelfHarmPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.9 พฤติกรรมทางเพศ</td>
            </tr>
            <tr>
              <td>- อยู่ในกลุ่มขายบริการ</td>
              <td>{stats.sexProstitutionGroup}</td>
              <td>{stats.sexProstitutionGroupPercent}</td>
            </tr>
            <tr>
              <td>- ใช้เครื่องมือสื่อสารเรื่องเพศบ่อยครั้ง/เป็นเวลานาน</td>
              <td>{stats.sexDeviceTime}</td>
              <td>{stats.sexDeviceTimePercent}</td>
            </tr>
            <tr>
              <td>- ตั้งครรภ์</td>
              <td>{stats.sexPregnant}</td>
              <td>{stats.sexPregnantPercent}</td>
            </tr>
            <tr>
              <td>- ขายบริการทางเพศ</td>
              <td>{stats.sexSell}</td>
              <td>{stats.sexSellPercent}</td>
            </tr>
            <tr>
              <td>- หมกมุ่นในเครื่องมือสื่อสารเรื่องทางเพศ</td>
              <td>{stats.sexObsessed}</td>
              <td>{stats.sexObsessedPercent}</td>
            </tr>
            <tr>
              <td>- มีการมั่วสุมทางเพศ</td>
              <td>{stats.sexAssembly}</td>
              <td>{stats.sexAssemblyPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.10 การติดเกม</td>
            </tr>
            <tr>
              <td>- เล่นเกมเกินวันละ 1 ชั่วโมง</td>
              <td>{stats.gameMoreThan1h}</td>
              <td>{stats.gameMoreThan1hPercent}</td>
            </tr>
            <tr>
              <td>- ขาดจินตนาการและความคิดสร้างสรรค์</td>
              <td>{stats.gameNoCreative}</td>
              <td>{stats.gameNoCreativePercent}</td>
            </tr>
            <tr>
              <td>- เก็บตัว แยกจากกลุ่มเพื่อน</td>
              <td>{stats.gameIsolate}</td>
              <td>{stats.gameIsolatePercent}</td>
            </tr>
            <tr>
              <td>- ใช้จ่ายเงินผิดปกติ (เติมเกม/เช่าไอดี)</td>
              <td>{stats.gameSpending}</td>
              <td>{stats.gameSpendingPercent}</td>
            </tr>
            <tr>
              <td>- อยู่ในกลุ่มเพื่อนเล่นเกม</td>
              <td>{stats.gameFriendGroup}</td>
              <td>{stats.gameFriendGroupPercent}</td>
            </tr>
            <tr>
              <td>- ร้านเกมใกล้บ้านหรือโรงเรียน</td>
              <td>{stats.gameShopNearby}</td>
              <td>{stats.gameShopNearbyPercent}</td>
            </tr>
            <tr>
              <td>- ใช้เวลาเล่นเกมเกิน 2 ชั่วโมง/วัน</td>
              <td>{stats.gameMoreThan2h}</td>
              <td>{stats.gameMoreThan2hPercent}</td>
            </tr>
            <tr>
              <td>- หมกมุ่น จริงจังกับการเล่นเกม</td>
              <td>{stats.gameObsessed}</td>
              <td>{stats.gameObsessedPercent}</td>
            </tr>
            <tr>
              <td>- ใช้เงินสิ้นเปลือง โกหก ลักขโมยเงินเพื่อเล่นเกม</td>
              <td>{stats.gameStealMoney}</td>
              <td>{stats.gameStealMoneyPercent}</td>
            </tr>
            <tr>
              <td>- อื่น ๆ</td>
              <td>{stats.gameOther}</td>
              <td>{stats.gameOtherPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.11 การเข้าถึงสื่อคอมพิวเตอร์และอินเตอร์เน็ตที่บ้าน</td>
            </tr>
            <tr>
              <td>- สามารถเข้าถึง Internet ได้จากที่บ้าน</td>
              <td>{stats.netYes}</td>
              <td>{stats.netYesPercent}</td>
            </tr>
            <tr>
              <td>- ไม่สามารถเข้าถึง Internet ได้จากที่บ้าน</td>
              <td>{stats.netNo}</td>
              <td>{stats.netNoPercent}</td>
            </tr>

            <tr className="font-semibold">
              <td colSpan={3}>4.12 การใช้เครื่องมือสื่อสารอิเล็กทรอนิกส์</td>
            </tr>
            <tr>
              <td>- เคยใช้โทรศัพท์มือถือในระหว่างการเรียน</td>
              <td>{stats.devInClass}</td>
              <td>{stats.devInClassPercent}</td>
            </tr>
            <tr>
              <td>- เข้าใช้ Line, Facebook, Twitter, Chat (เกินวันละ 1 ชั่วโมง)</td>
              <td>{stats.devLineFbMoreThan1h}</td>
              <td>{stats.devLineFbMoreThan1hPercent}</td>
            </tr>
            <tr>
              <td>- ใช้โทรศัพท์มือถือในระหว่างเรียน 2 – 3 ครั้ง/วัน</td>
              <td>{stats.devInClass2_3times}</td>
              <td>{stats.devInClass2_3timesPercent}</td>
            </tr>
            <tr>
              <td>- เข้าใช้ Line, Facebook, Twitter, Chat (เกินวันละ 2 ชั่วโมง)</td>
              <td>{stats.devLineFbMoreThan2h}</td>
              <td>{stats.devLineFbMoreThan2hPercent}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 flex justify-between items-center" style={{ pageBreakBefore: 'avoid' }}>
          <div className="text-center w-5/12">
            <p>ลงชื่อ..........................................................</p>
            <p className="mt-2">({advisor1Name || '..............................................'})</p>
            <p className="mt-1">วันที่........../........../..........</p>
          </div>
          <div className="text-center w-5/12">
            <p>ลงชื่อ..........................................................</p>
            <p className="mt-2">({advisor2Name || '..............................................'})</p>
            <p className="mt-1">วันที่........../........../..........</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 home-visit-layout no-print pb-12">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">รายงานวิเคราะห์สรุปการเยี่ยมบ้าน (Excel Style)</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">สรุปแจกแจงจำนวนและร้อยละของนักเรียนในแต่ละประเด็นระดับห้องเรียน</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLoadingClassrooms ? (
            <div className="h-10 w-36 bg-gray-100 dark:bg-slate-850 animate-pulse rounded-xl" />
          ) : (
            filteredClassroomsList.length > 0 && (
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
            onClick={handleExportExcel}
            disabled={completedVisitsCount === 0 || isExporting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <span>โหลดเป็นไฟล์ Excel</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">นักเรียนทั้งหมดในห้อง</p>
          <p className="text-3xl font-black text-gray-800 dark:text-white mt-1">{totalStudentsCount} คน</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ดำเนินการเยี่ยมบ้านแล้ว</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedVisitsCount} คน</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ร้อยละความสำเร็จ</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalStudentsCount > 0 ? ((completedVisitsCount / totalStudentsCount) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 min-h-[300px]">
          <Loader2 size={36} className="text-emerald-500 animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3">กำลังโหลดรายงานการเยี่ยมบ้าน...</p>
        </div>
      ) : completedVisitsCount === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 min-h-[300px] text-center">
          <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 flex items-center justify-center rounded-2xl mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">ไม่พบข้อมูลรายงาน</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">ยังไม่มีประวัติการเยี่ยมบ้านที่ดำเนินการเสร็จสิ้นในห้องเรียนนี้ คุณจำเป็นต้องดำเนินการเยี่ยมบ้านนักเรียนก่อนจึงจะวิเคราะห์รายงานได้</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/25 p-2 gap-1">
            <button
              onClick={() => setActiveTab('student-parent')}
              className={`flex-1 sm:flex-initial text-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'student-parent'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-150 dark:border-slate-700/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                }`}
            >
              1-2. นักเรียน & ผู้ปกครอง
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`flex-1 sm:flex-initial text-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'family'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-150 dark:border-slate-700/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                }`}
            >
              3. ความสัมพันธ์ & เศรษฐกิจครอบครัว
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`flex-1 sm:flex-initial text-center px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'risk'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-150 dark:border-slate-700/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                }`}
            >
              4. พฤติกรรม & มิติความเสี่ยง
            </button>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'student-parent' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">1. ข้อมูลนักเรียน</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl">
                      <span className="font-medium">เพศชาย</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.maleCount} คน ({stats.malePercent}%)</span>
                    </div>
                    <div className="flex justify-between p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl">
                      <span className="font-medium">เพศหญิง</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{stats.femaleCount} คน ({stats.femalePercent}%)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">2. ข้อมูลผู้ปกครอง</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl">
                      <span className="font-medium text-xs text-gray-500">มีผู้ปกครองหลัก</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg mt-1">{stats.hasParentCount} คน ({stats.hasParentPercent}%)</span>
                    </div>
                    <div className="flex flex-col p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl">
                      <span className="font-medium text-xs text-gray-500">ไม่มีผู้ปกครองหลัก</span>
                      <span className="font-bold text-red-500 text-lg mt-1">{stats.noParentCount} คน ({stats.noParentPercent}%)</span>
                    </div>
                    <div className="flex flex-col p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl">
                      <span className="font-medium text-xs text-gray-500">เคยลงทะเบียนเพื่อสวัสดิการแห่งรัฐ (บัตรคนจน)</span>
                      <span className="font-bold text-indigo-500 text-lg mt-1">{stats.stateWelfareCount} คน ({stats.stateWelfarePercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'family' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">3.1 เวลาที่สมาชิกในครอบครัวมีเวลาอยู่ร่วมกัน/วัน</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">มากกว่า 10 ชม./วัน</p>
                      <p className="text-xl font-bold mt-1 text-emerald-600">{stats.timeMoreThan10} คน</p>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">7-9 ชม./วัน</p>
                      <p className="text-xl font-bold mt-1 text-emerald-600">{stats.time7To9} คน</p>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">4-6 ชม./วัน</p>
                      <p className="text-xl font-bold mt-1 text-amber-500">{stats.time4To6} คน</p>
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-center">
                      <p className="text-xs text-gray-500">น้อยกว่า 4 ชม./วัน</p>
                      <p className="text-xl font-bold mt-1 text-red-500">{stats.timeLessThan4} คน</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">3.2 ตารางสรุปความสัมพันธ์ในครอบครัว</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-800/40">
                        <tr>
                          <th className="px-6 py-3">สมาชิก</th>
                          <th className="px-4 py-3 text-center text-emerald-600">สนิทสนม</th>
                          <th className="px-4 py-3 text-center text-blue-500">เฉยๆ</th>
                          <th className="px-4 py-3 text-center text-amber-500">ห่างเหิน</th>
                          <th className="px-4 py-3 text-center text-red-500">ขัดแย้ง</th>
                          <th className="px-4 py-3 text-center">ไม่มี</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(stats.relationGrid).map((member) => (
                          <tr key={member} className="border-b border-gray-100 dark:border-slate-800/60 hover:bg-gray-50/30 dark:hover:bg-slate-850/10">
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{member}</td>
                            <td className="px-4 py-4 text-center font-semibold text-emerald-600">{stats.relationGrid[member]['สนิทสนม']} คน</td>
                            <td className="px-4 py-4 text-center font-semibold text-blue-500">{stats.relationGrid[member]['เฉย']} คน</td>
                            <td className="px-4 py-4 text-center font-semibold text-amber-500">{stats.relationGrid[member]['ห่างหิน']} คน</td>
                            <td className="px-4 py-4 text-center font-semibold text-red-500">{stats.relationGrid[member]['ขัดแย้ง']} คน</td>
                            <td className="px-4 py-4 text-center">{stats.relationGrid[member]['ไม่มี']} คน</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">3.3 กรณีผู้ปกครองไม่อยู่บ้านฝากนักเรียนอยู่กับใคร</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                        <span>ญาติ</span>
                        <span className="font-bold text-gray-800 dark:text-white">{stats.leftWithRelative} คน ({stats.leftWithRelativePercent}%)</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                        <span>เพื่อนบ้าน</span>
                        <span className="font-bold text-gray-800 dark:text-white">{stats.leftWithNeighbor} คน ({stats.leftWithNeighborPercent}%)</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                        <span className="text-red-600 dark:text-red-400 font-medium">นักเรียนอยู่บ้านด้วยตนเอง (เสี่ยง)</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{stats.leftWithSelf} คน ({stats.leftWithSelfPercent}%)</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                        <span>อื่น ๆ</span>
                        <span className="font-bold text-gray-800 dark:text-white">{stats.leftWithOther} คน ({stats.leftWithOtherPercent}%)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2 mb-4">3.4 รายได้เฉลี่ยต่อคนต่อปี</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'มากกว่า 100,001 บาท/ปี', val: stats.incMoreThan100k, pct: stats.incMoreThan100kPercent },
                        { label: '50,001 - 100,000 บาท/ปี', val: stats.inc50kTo100k, pct: stats.inc50kTo100kPercent },
                        { label: '30,001 - 50,000 บาท/ปี', val: stats.inc30kTo50k, pct: stats.inc30kTo50kPercent },
                        { label: '20,001 - 30,000 บาท/ปี', val: stats.inc20kTo30k, pct: stats.inc20kTo30kPercent },
                        { label: '10,001 - 20,000 บาท/ปี', val: stats.inc10kTo20k, pct: stats.inc10kTo20kPercent },
                        { label: 'ต่ำกว่า 10,000 บาท/ปี (ยากจนพิเศษ)', val: stats.incLessThan10k, pct: stats.incLessThan10kPercent, isDanger: true }
                      ].map((item, idx) => (
                        <div key={idx} className={`flex justify-between p-2 rounded-lg text-xs ${item.isDanger && item.val > 0 ? 'bg-red-500/10 text-red-500 font-medium' : 'bg-gray-50/50 dark:bg-slate-950/20'}`}>
                          <span>{item.label}</span>
                          <span className="font-bold">{item.val} คน ({item.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">4.1 สุขภาพ</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>ร่างกายไม่แข็งแรง</span>
                      <span className="font-bold">{stats.healthUnhealthy} คน ({stats.healthUnhealthyPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>มีโรคประจำตัวหรือเจ็บป่วยบ่อย</span>
                      <span className="font-bold">{stats.healthCongenital} คน ({stats.healthCongenitalPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">มีภาวะทุพโภชนาการ</span>
                      <span className="font-bold text-red-500">{stats.healthMalnutrition} คน ({stats.healthMalnutritionPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>ป่วยเป็นโรคร้ายแรง/เรื้อรัง</span>
                      <span className="font-bold">{stats.healthSerious} คน ({stats.healthSeriousPercent}%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">4.10 การติดเกม</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>เล่นเกมเกินวันละ 1 ชั่วโมง</span>
                      <span className="font-bold">{stats.gameMoreThan1h} คน ({stats.gameMoreThan1hPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">เล่นเกมเกิน 2 ชั่วโมง/วัน</span>
                      <span className="font-bold text-red-500">{stats.gameMoreThan2h} คน ({stats.gameMoreThan2hPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">ลักขโมยเงิน / โกหกเพื่อเล่นเกม</span>
                      <span className="font-bold text-red-500">{stats.gameStealMoney} คน ({stats.gameStealMoneyPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>หมกมุ่นจริงจังกับการเล่นเกม</span>
                      <span className="font-bold">{stats.gameObsessed} คน ({stats.gameObsessedPercent}%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">4.7 สารเสพติด</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>คบเพื่อนกลุ่มใช้สารเสพติด</span>
                      <span className="font-bold">{stats.drugFriends} คน ({stats.drugFriendsPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>สมาชิกครอบครัวยุ่งเกี่ยวกับสารเสพติด</span>
                      <span className="font-bold">{stats.drugFamily} คน ({stats.drugFamilyPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">ปัจจุบันเกี่ยวข้องกับสารเสพติด</span>
                      <span className="font-bold text-red-500">{stats.drugInvolved} คน ({stats.drugInvolvedPercent}%)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">4.8 ความรุนแรง</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm">
                      <span>ก้าวร้าว เกเร</span>
                      <span className="font-bold">{stats.vioAggressive} คน ({stats.vioAggressivePercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">ทะเลาะวิวาทเป็นประจำ</span>
                      <span className="font-bold text-red-500">{stats.vioFightsRegular} คน ({stats.vioFightsRegularPercent}%)</span>
                    </div>
                    <div className="flex justify-between p-2.5 bg-gray-50/50 dark:bg-slate-950/20 rounded-xl text-sm border-l-4 border-red-500">
                      <span className="text-red-500 font-medium">ทำร้ายร่างกายตนเอง / ผู้อื่น</span>
                      <span className="font-bold text-red-500">{(stats.vioAssault + stats.vioSelfHarm)} คน</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* A4 Print Preview Panel (screen only) */}
      {completedVisitsCount > 0 && (
        <div className="no-print">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">ตัวอย่างเอกสารก่อนพิมพ์ (Print Preview)</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">แสดงหน้าเอกสารขนาด A4 จริง — ตรงกับที่จะพิมพ์ออกมา</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto', background: '#f0f0f0', borderRadius: 12, padding: '24px 0' }}>
              <div style={{
                width: 794,
                margin: '0 auto',
                background: 'white',
                boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
                fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                color: 'black',
                fontSize: 13,
                borderRadius: 2,
              }}>
                {renderPrintContent(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {completedVisitsCount > 0 && createPortal(renderPrintContent(false), document.body)}
    </div>
  );
}
