import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  User, Home, Calendar, ShieldAlert, Heart, Activity, FileText,
  ChevronLeft, Sparkles, MapPin, Phone, Users, CheckCircle2,
  AlertTriangle, AlertCircle, Smile, HelpCircle, Eye, Mail, ArrowLeft, RefreshCw,
  Award, ExternalLink, Trash2, Plus, X, QrCode, Copy
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';
import { getStudentPortfolios } from '../../services/portfolioService';
import { useAcademicYearStore } from '../../store/academicYearStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Legend, BarChart, Bar, CartesianGrid } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { behaviorService } from '../../services/studentsupport/behaviorService';
import type { BehaviorPoint } from '../../services/studentsupport/behaviorService';
import { QRCodeSVG } from 'qrcode.react';

const pad = (value: number) => String(value).padStart(2, '0');

const formatThaiBEEInputDate = (isoDate: string) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  const beYear = parseInt(y, 10) + 543;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${beYear}`;
};

const parseThaiBEInputDate = (input: string) => {
  if (!input) return null;
  const parts = input.split('/').map(part => part.trim());
  if (parts.length !== 3) return null;
  const [dayStr, monthStr, yearStr] = parts;
  if (!/^[0-9]{1,2}$/.test(dayStr) || !/^[0-9]{1,2}$/.test(monthStr) || !/^[0-9]{4}$/.test(yearStr)) return null;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const beYear = Number(yearStr);
  const year = beYear - 543;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
};

const formatThaiBuddhistDate = (isoDate: string) => {
  if (!isoDate) return '';
  try {
    const date = new Date(`${isoDate}T00:00:00`);
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      calendar: 'buddhist'
    }).format(date);
  } catch (e) {
    return isoDate;
  }
};

const thaiWeekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// V14: Helper functions
const getSdqDimLevel = (
  score: number,
  dim: 'emotional' | 'conduct' | 'hyperactivity' | 'peer',
  evalType: 'STUDENT' | 'TEACHER' | 'PARENT'
): 'NORMAL' | 'RISK' | 'PROBLEM' => {
  const t: Record<string, Record<string, { risk: number; problem: number }>> = {
    STUDENT: { emotional: { risk: 6, problem: 7 }, conduct: { risk: 5, problem: 6 }, hyperactivity: { risk: 6, problem: 7 }, peer: { risk: 4, problem: 5 } },
    TEACHER: { emotional: { risk: 4, problem: 5 }, conduct: { risk: 4, problem: 5 }, hyperactivity: { risk: 6, problem: 7 }, peer: { risk: 6, problem: 7 } },
    PARENT:  { emotional: { risk: 4, problem: 5 }, conduct: { risk: 4, problem: 5 }, hyperactivity: { risk: 6, problem: 7 }, peer: { risk: 6, problem: 7 } },
  };
  const { risk, problem } = t[evalType][dim];
  if (score >= problem) return 'PROBLEM';
  if (score >= risk) return 'RISK';
  return 'NORMAL';
};
const getLvColor = (lv: 'NORMAL' | 'RISK' | 'PROBLEM'): string =>
  lv === 'PROBLEM' ? '#ef4444' : lv === 'RISK' ? '#f59e0b' : '#10b981';
const getEqLvColor = (lv: string): string =>
  lv === 'LOWER_THAN_NORMAL' ? '#ef4444' : lv === 'HIGHER_THAN_NORMAL' ? '#8b5cf6' : '#10b981';
const generateSdqWeaknesses = (sdq: any, evalType: 'STUDENT' | 'TEACHER' | 'PARENT') => {
  const ws: { dim: string; icon: string; text: string }[] = [];
  if (getSdqDimLevel(sdq.peer_score, 'peer', evalType) !== 'NORMAL')
    ws.push({ dim: 'ด้านความสัมพันธ์กับเพื่อน', icon: '👥', text: 'นักเรียนค่อนข้างแยกตัว ไม่ค่อยมีเพื่อนสนิท หรืออาจเผชิญการรังแก ควรให้คุณครูประจำชั้นจัดกิจกรรมเพื่อนคู่คิด หรือดึงตัวเข้าทำกิจกรรมกลุ่มที่มีความเป็นมิตรและมีโครงสร้างชัดเจน' });
  if (getSdqDimLevel(sdq.hyperactivity_score, 'hyperactivity', evalType) !== 'NORMAL')
    ws.push({ dim: 'ด้านสมาธิ/อยู่ไม่นิ่ง', icon: '⚡', text: 'นักเรียนมีพฤติกรรมวอกแวกง่าย ขาดสมาธิจดจ่อ และอยู่ไม่นิ่ง แนะนำให้ครูจัดที่นั่งแถวหน้า หลีกเลี่ยงหน้าต่างเพื่อลดสิ่งเร้า และจัดงานแบ่งย่อยขั้นสั้น ๆ เพื่อช่วยความตั้งใจทำงาน' });
  if (getSdqDimLevel(sdq.conduct_score, 'conduct', evalType) !== 'NORMAL')
    ws.push({ dim: 'ด้านความประพฤติ/เกเร', icon: '⚠️', text: 'นักเรียนมีพฤติกรรมต่อต้าน ก้าวร้าว หรือฝ่าฝืนกฎระเบียบ แนะนำให้ใช้การเสริมแรงทางบวก (Positive Reinforcement) แทนการตักเตือนรุนแรง ประสานงานผู้ปกครองร่วมกันทำข้อตกลงพฤติกรรมที่ชัดเจน' });
  if (getSdqDimLevel(sdq.emotional_score, 'emotional', evalType) !== 'NORMAL')
    ws.push({ dim: 'ด้านอารมณ์', icon: '💭', text: 'นักเรียนมีความวิตกกังวลสูง ซึมเศร้า หรือร้องไห้ง่าย แนะนำให้ครูสร้างพื้นที่ปลอดภัยในการพูดคุย ประสานงานนักจิตวิทยาโรงเรียนหรือครูแนะแนวเพื่อให้การปรึกษาเชิงประคับประคองเป็นระยะ' });
  return ws;
};

export default function Student360() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { selectedYear, selectedSemester } = useAcademicYearStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SDQ_EQ' | 'HOME_VISIT' | 'ATTENDANCE' | 'CASES' | 'PORTFOLIO' | 'BEHAVIOR'>('OVERVIEW');
  const [recalcEqLoading, setRecalcEqLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    url: string;
    title: string;
    studentName: string;
    classroom: string;
    code: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  // Behavior points state
  const [behaviorPoints, setBehaviorPoints] = useState<BehaviorPoint[]>([]);
  const [behaviorSummary, setBehaviorSummary] = useState({ plusSum: 0, minusSum: 0, netScore: 100 });
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [submittingBehavior, setSubmittingBehavior] = useState(false);
  const [behaviorForm, setBehaviorForm] = useState({
    type: 'MINUS' as 'PLUS' | 'MINUS',
    points: 5,
    category: 'มาสาย/หนีเรียน',
    description: '',
    incident_date: new Date().toISOString().split('T')[0]
  });

  // Date Picker State for Behavior Modal (Thai B.E. calendar)
  const [bDateInput, setBDateInput] = useState('');
  const [bDateError, setBDateError] = useState('');
  const [showBDatePicker, setShowBDatePicker] = useState(false);
  const [bCalendarMonth, setBCalendarMonth] = useState(new Date().getMonth());
  const [bCalendarYear, setBCalendarYear] = useState(new Date().getFullYear());

  // State for Behavior Log Deletion Custom Modal
  const [deletingBehaviorId, setDeletingBehaviorId] = useState<string | null>(null);
  const [isDeletingBehavior, setIsDeletingBehavior] = useState(false);

  // Click outside to close Behavior Date Picker
  useEffect(() => {
    if (!showBDatePicker) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.b-datepicker-container')) {
        setShowBDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showBDatePicker]);

  const selectBCalendarDate = (day: number) => {
    const date = new Date(bCalendarYear, bCalendarMonth, day);
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const isoDate = `${y}-${m}-${d}`;
    setBehaviorForm(prev => ({ ...prev, incident_date: isoDate }));
    setBDateInput(formatThaiBEEInputDate(isoDate));
    setBDateError('');
    setShowBDatePicker(false);
  };

  const bDaysInMonth = getDaysInMonth(bCalendarYear, bCalendarMonth);
  const bFirstWeekday = new Date(bCalendarYear, bCalendarMonth, 1).getDay();
  const bCalendarCells = Array(bFirstWeekday).fill(null).concat(Array.from({ length: bDaysInMonth }, (_, i) => i + 1));

  const { user } = useAuthStore();
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setTeacherId(data.id);
      }
    };
    fetchTeacherId();
  }, [user?.id]);

  const fetchBehaviorData = async () => {
    if (!studentId) return;
    try {
      const pts = await behaviorService.getStudentBehaviorPoints(studentId, selectedYear?.id);
      const summ = await behaviorService.getStudentBehaviorSummary(studentId, selectedYear?.id);
      setBehaviorPoints(pts);
      setBehaviorSummary(summ);
    } catch (err) {
      console.error('Error fetching behavior data:', err);
    }
  };

  const refreshAllData = async () => {
    if (!studentId) return;
    try {
      const data = await studentSupportService.getStudent360Profile(
        studentId,
        selectedYear?.id,
        selectedSemester?.id
      );
      setProfile(data);
      await fetchBehaviorData();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!studentId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await studentSupportService.getStudent360Profile(
          studentId,
          selectedYear?.id,
          selectedSemester?.id
        );
        setProfile(data);
        const portfoliosData = await getStudentPortfolios(studentId);
        setPortfolios(portfoliosData || []);
        await fetchBehaviorData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [studentId, selectedYear?.id, selectedSemester?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังรวบรวมข้อมูล Profile 360° เจาะลึก...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-4">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="mx-auto text-rose-400" size={48} />
          <h3 className="text-lg font-black">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
          <p className="text-sm text-gray-400">{error || 'ไม่พบข้อมูลนักเรียน'}</p>
          <button
            onClick={() => navigate('/studentsupport')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xs transition-all"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    );
  }

  const { student, sdq, eq, attendanceSummary, attendanceByMonth, leaves, cases } = profile;

  const totalDays = attendanceSummary.present + attendanceSummary.late + attendanceSummary.absent + attendanceSummary.leave;
  const attendanceRate = totalDays ? Math.round((attendanceSummary.present / totalDays) * 100) : 100;

  // V14: แยก SDQ ตามประเภทผู้ประเมิน
  const normalizedSdq = ((sdq as any[]) ?? []).map((s: any) => ({
    ...s,
    evaluator_type: String(s.evaluator_type || '').trim().toUpperCase()
  }));
  const teacherSdq: any = normalizedSdq.find((s: any) => s.evaluator_type === 'TEACHER') ?? null;
  const studentSdq: any = normalizedSdq.find((s: any) => s.evaluator_type === 'STUDENT') ?? null;
  const parentSdq:  any = normalizedSdq.find((s: any) => s.evaluator_type === 'PARENT')  ?? null;
  const primarySdq: any = teacherSdq ?? studentSdq ?? parentSdq ?? null;
  const primaryEvalType: 'STUDENT' | 'TEACHER' | 'PARENT' =
    teacherSdq ? 'TEACHER' : studentSdq ? 'STUDENT' : 'PARENT';
  const latestEq: any = (eq as any[])?.[0] ?? null;

  const attendanceRisk = attendanceSummary.absent > 5 ? 'PROBLEM' : attendanceSummary.absent > 3 ? 'RISK' : 'NORMAL';

  const getOverallRisk = () => {
    let score = 0;
    if (primarySdq?.result_difficulties === 'PROBLEM') score += 3.5;
    else if (primarySdq?.result_difficulties === 'RISK') score += 1.5;
    if (latestEq?.eq_level === 'LOWER_THAN_NORMAL') score += 2.0;
    if (attendanceSummary.absent > 5) score += 2.5;
    else if (attendanceSummary.absent > 3) score += 1.0;
    if (score >= 6.0) return { key: 'URGENT', label: 'ช่วยเหลือเร่งด่วน (แดง)', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' };
    if (score >= 3.5) return { key: 'RISK', label: 'กลุ่มเสี่ยง (ส้ม)', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    if (score >= 1.5) return { key: 'MONITOR', label: 'เฝ้าระวัง (เหลือง)', color: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' };
    return { key: 'NORMAL', label: 'ปกติ (เขียว)', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
  };
  const riskStatus = getOverallRisk();

  // V14: Donut chart data
  const sdqDonutData = primarySdq ? [
    { name: 'อารมณ์',      actualScore: primarySdq.emotional_score,    value: Math.max(primarySdq.emotional_score, 0.5),    color: getLvColor(getSdqDimLevel(primarySdq.emotional_score, 'emotional', primaryEvalType)) },
    { name: 'เกเร',        actualScore: primarySdq.conduct_score,       value: Math.max(primarySdq.conduct_score, 0.5),       color: getLvColor(getSdqDimLevel(primarySdq.conduct_score, 'conduct', primaryEvalType)) },
    { name: 'สมาธิ',      actualScore: primarySdq.hyperactivity_score, value: Math.max(primarySdq.hyperactivity_score, 0.5), color: getLvColor(getSdqDimLevel(primarySdq.hyperactivity_score, 'hyperactivity', primaryEvalType)) },
    { name: 'เพื่อน',     actualScore: primarySdq.peer_score,           value: Math.max(primarySdq.peer_score, 0.5),           color: getLvColor(getSdqDimLevel(primarySdq.peer_score, 'peer', primaryEvalType)) },
    { name: 'สัมพันธภาพ', actualScore: primarySdq.prosocial_score,     value: Math.max(primarySdq.prosocial_score, 0.5),     color: primarySdq.prosocial_score >= 4 ? '#10b981' : '#ef4444' },
  ] : [];
  const eqDonutData: { name: string; value: number; level: string; color: string }[] = latestEq
    ? (latestEq.goodness_score != null
        ? [
            { name: 'ด้านดี',  value: latestEq.goodness_score,   level: latestEq.goodness_level,   color: getEqLvColor(latestEq.goodness_level) },
            { name: 'ด้านเก่ง', value: latestEq.competence_score, level: latestEq.competence_level, color: getEqLvColor(latestEq.competence_level) },
            { name: 'ด้านสุข', value: latestEq.happiness_score,  level: latestEq.happiness_level,  color: getEqLvColor(latestEq.happiness_level) },
          ]
        : [{ name: 'EQ รวม', value: latestEq.total_score, level: latestEq.eq_level, color: getEqLvColor(latestEq.eq_level) }])
    : [];
  const triWeaknesses = primarySdq ? generateSdqWeaknesses(primarySdq, primaryEvalType) : [];

  // V15.3: SDQ History Timeline Data
  const sdqTimeline = (() => {
    const all = normalizedSdq;
    if (all.length < 2) return [];
    return all
      .filter((s: any) => s.total_difficulties_score != null && s.created_at)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s: any) => ({
        date: new Date(s.created_at).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
        dateRaw: s.created_at,
        score: s.total_difficulties_score,
        type: s.evaluator_type as 'TEACHER' | 'STUDENT' | 'PARENT',
        label: s.evaluator_type === 'TEACHER' ? 'ครู' : s.evaluator_type === 'STUDENT' ? 'นักเรียน' : 'ผู้ปกครอง',
      }));
  })();

  // V15.3: Group by date + evaluator for chart
  const sdqChartData = (() => {
    const map: Record<string, any> = {};
    sdqTimeline.forEach(pt => {
      const key = `${pt.date}_${pt.type}`;
      if (!map[pt.date]) map[pt.date] = { date: pt.date };
      const fieldKey = pt.type === 'TEACHER' ? 'TEACHER' : pt.type === 'STUDENT' ? 'STUDENT' : 'PARENT';
      map[pt.date][fieldKey] = pt.score;
    });
    return Object.values(map);
  })();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 pb-24 md:pb-8 relative overflow-hidden font-sans">

      {/* Premium Glassmorphic Success Toast */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-500/15 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 size={20} className="animate-bounce" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black">สำเร็จ!</p>
              <p className="text-[10px] text-gray-300 font-medium mt-0.5">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Error Toast */}
      {toastError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-rose-500/30 text-rose-300 px-4 py-3 rounded-2xl shadow-2xl shadow-rose-500/15 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertCircle size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-black">เกิดข้อผิดพลาด!</p>
              <p className="text-[10px] text-gray-300 font-medium mt-0.5">{toastError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          
          {/* Left / Center Content */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left w-full md:w-auto">
            
            {/* Back Button for Desktop (hidden on mobile, mobile has bottom bar) */}
            <button
              onClick={() => navigate('/studentsupport')}
              className="hidden md:flex p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
              title="ย้อนกลับ"
            >
              <ArrowLeft size={20} className="text-gray-300" />
            </button>

            {/* Student Info Details */}
            <div className="space-y-1.5 md:space-y-0.5 flex flex-col items-center md:items-start w-full">
              <span className="px-3 py-0.5 bg-indigo-500/20 text-indigo-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-indigo-500/35 w-fit">
                Student Profile 360°
              </span>
              <h1 className="text-xl md:text-3xl font-black text-white leading-tight">
                {student.prefix || ''}{student.first_name} {student.last_name}
              </h1>
              <p className="text-xs text-gray-400">
                รหัสประจำตัว: <span className="text-gray-300 font-bold">{student.student_code}</span> • ชั้น {student.classroom?.level}/{student.classroom?.room}
              </p>
            </div>
          </div>

          {/* Right / Bottom Risk Status badge */}
          <div className={`px-5 py-3 rounded-2xl border text-xs font-black text-center w-full md:w-auto shrink-0 shadow-lg ${riskStatus.color}`}>
            สถานะความเสี่ยงภาพรวม: {riskStatus.label}
          </div>
        </header>

        {/* Tab Navigation Menu */}
        <nav className="hidden md:flex gap-2 w-full overflow-x-auto bg-white/5 border border-white/10 rounded-2xl p-2.5">
          {[
            { key: 'OVERVIEW', label: 'สรุปภาพรวม', icon: Activity },
            { key: 'SDQ_EQ', label: 'พฤติกรรม & อารมณ์ (SDQ/EQ)', icon: Smile },
            { key: 'BEHAVIOR', label: 'คะแนนพฤติกรรม', icon: Heart },
            { key: 'ATTENDANCE', label: 'การเข้าเรียน & การลา', icon: Calendar },
            { key: 'PORTFOLIO', label: 'ผลงาน & กิจกรรม', icon: Award },
            { key: 'CASES', label: 'เคสและการช่วยเหลือ', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/0 text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Left Card: Basic info */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <User size={18} className="text-indigo-400" />
                ข้อมูลนักเรียน & ครอบครัว
              </h3>

              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400 font-medium">ชื่อเล่น</span>
                  <span className="text-white font-bold">{student.nickname || 'ไม่ระบุ'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400 font-medium">เพศ</span>
                  <span className="text-white font-bold">{student.gender === 'MALE' ? 'ชาย' : student.gender === 'FEMALE' ? 'หญิง' : ''}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400 font-medium">ห้องเรียน</span>
                  <span className="text-white font-bold">{student.classroom?.level}/{student.classroom?.room}</span>
                </div>

                {student.parent ? (
                  <div className="pt-3 space-y-2">
                    <span className="text-xxs text-gray-400 font-bold block uppercase tracking-wider">ผู้ปกครองหลัก</span>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">ชื่อ-สกุล</span>
                      <span className="text-white font-bold">{student.parent.first_name} {student.parent.last_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">ความสัมพันธ์</span>
                      <span className="text-white font-bold">{student.parent.relation === 'FATHER' ? 'บิดา' : student.parent.relation === 'MOTHER' ? 'มารดา' : 'ผู้ปกครอง'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">เบอร์โทรศัพท์</span>
                      <span className="text-white font-bold">{student.parent.phone || 'ไม่ระบุ'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">ไม่พบบันทึกข้อมูลผู้ปกครองในระบบ</p>
                )}
              </div>
            </div>

            {/* Right Multi-Widgets Area (2 Columns) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Overall Risk Factors Grid */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  ปัจจัยการคัดกรองความเสี่ยงรอบทิศทาง
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Factor 1: SDQ */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-gray-400 font-bold mb-2">พฤติกรรม (SDQ)</span>
                    {primarySdq ? (
                      <span className={`px-2 py-1 rounded-full text-xxs font-black border ${primarySdq.result_difficulties === 'PROBLEM' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                          primarySdq.result_difficulties === 'RISK' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                            'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                        {primarySdq.result_difficulties === 'PROBLEM' ? 'มีปัญหา' :
                          primarySdq.result_difficulties === 'RISK' ? 'กลุ่มเสี่ยง' : 'ปกติ'}
                      </span>
                    ) : (
                      <span className="text-xxs text-gray-500 italic">ยังไม่ได้ประเมิน</span>
                    )}
                  </div>

                  {/* Factor 2: EQ */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-gray-400 font-bold mb-2">อารมณ์ (EQ)</span>
                    {latestEq ? (
                      <span className={`px-2 py-1 rounded-full text-xxs font-black border ${latestEq.eq_level === 'LOWER_THAN_NORMAL' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                          latestEq.eq_level === 'NORMAL' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            'text-violet-400 bg-violet-500/10 border-violet-500/20'
                        }`}>
                        {latestEq.eq_level === 'LOWER_THAN_NORMAL' ? 'ต่ำกว่าเกณฑ์' :
                          latestEq.eq_level === 'NORMAL' ? 'ปกติ' : 'สูงกว่าเกณฑ์'}
                      </span>
                    ) : (
                      <span className="text-xxs text-gray-500 italic">ยังไม่ได้ประเมิน</span>
                    )}
                  </div>

                  {/* Factor 3: Attendance */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-gray-400 font-bold mb-2">การมาเรียน</span>
                    <span className={`px-2 py-1 rounded-full text-xxs font-black border ${attendanceRisk === 'PROBLEM' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                        attendanceRisk === 'RISK' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                      ขาดเรียน: {attendanceSummary.absent} วัน
                    </span>
                  </div>

                  {/* Factor 4: Behavior Points */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-gray-400 font-bold mb-2">คะแนนพฤติกรรม</span>
                    <span className={`px-2 py-1 rounded-full text-xxs font-black border ${behaviorSummary.netScore < 50 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                        behaviorSummary.netScore < 80 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                      คะแนนสุทธิ: {behaviorSummary.netScore} คะแนน
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Support Cases widget */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-400" />
                    เคสการดูแลช่วยเหลือนักเรียน
                  </span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400 font-bold">{cases.length} เคส</span>
                </h3>

                {cases.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">ไม่พบบันทึกเคสช่วยเหลือสำหรับนักเรียนคนนี้</p>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 3).map((c: any) => (
                      <div key={c.id} className="p-3 bg-white/5 rounded-2xl flex items-center justify-between gap-3 border border-white/5">
                        <div>
                          <p className="text-xs font-bold text-white leading-snug">{c.title}</p>
                          <span className="text-[10px] text-gray-500 block mt-0.5">เปิดเคสเมื่อ: {new Date(c.created_at).toLocaleDateString('th-TH')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${c.status === 'CLOSED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            c.status === 'HELPING' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                              'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                          }`}>
                          {c.status === 'CLOSED' ? 'ปิดเคสแล้ว' : c.status === 'HELPING' ? 'กำลังช่วยเหลือ' : 'ติดตาม'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SDQ_EQ */}
        {activeTab === 'SDQ_EQ' && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* SECTION 1: Assessment Status Cards — 3 ชุดผู้ประเมิน */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <FileText size={18} className="text-emerald-400" />
                สถานะแบบประเมิน SDQ — 3 ชุดผู้ประเมิน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { type: 'TEACHER' as const, label: 'ครูประเมินนักเรียน',     data: teacherSdq, icon: '👨\u200d🏫' },
                  { type: 'STUDENT' as const, label: 'นักเรียนประเมินตนเอง',   data: studentSdq, icon: '🎒' },
                  { type: 'PARENT'  as const, label: 'ผู้ปกครองประเมิน',       data: parentSdq,  icon: '👨\u200d👩\u200d👧' },
                ]).map(({ type, label, data, icon }) => (
                  <div key={type} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icon}</span>
                        <span className="text-xs font-bold text-gray-300">{label}</span>
                      </div>
                      {data ? (
                        <>
                          <div className={`px-3 py-2 rounded-xl text-xs font-black text-center ${
                            data.result_difficulties === 'PROBLEM' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' :
                            data.result_difficulties === 'RISK'    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                                                                     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {data.result_difficulties === 'PROBLEM' ? '🔴 มีปัญหา' : data.result_difficulties === 'RISK' ? '🟡 กลุ่มเสี่ยง' : '🟢 ปกติ'}
                          </div>
                          <p className="text-[10px] text-gray-500 text-center">
                            คะแนนรวม: <span className="text-white font-bold">{data.total_difficulties_score}</span>/40 • {new Date(data.created_at).toLocaleDateString('th-TH')}
                          </p>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate(`/studentsupport/sdq/${student.id}?type=${type}`)}
                          className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-dashed border-white/20 text-gray-500 text-xs font-bold hover:bg-white/10 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
                        >
                          <AlertCircle size={14} />
                          ยังไม่ได้ประเมิน — คลิกเพื่อเริ่ม
                        </button>
                      )}
                    </div>
                    {type !== 'TEACHER' && (
                      <button
                        onClick={() => {
                          const classroomInfo = student.classroom ? `${student.classroom.level}/${student.classroom.room}` : '';
                          const queryParams = new URLSearchParams({
                            type,
                            yearId: selectedYear?.id || '',
                            semesterId: selectedSemester?.id || '',
                            name: `${student.prefix || ''}${student.first_name} ${student.last_name}`,
                            code: student.student_code || '',
                            room: classroomInfo,
                            timestamp: Date.now().toString()
                          }).toString();
                          
                          const publicUrl = `${window.location.origin}/public/sdq/${student.id}?${queryParams}`;
                          setQrModalData({
                            url: publicUrl,
                            title: `QR Code แบบประเมิน SDQ (${label})`,
                            studentName: `${student.prefix || ''}${student.first_name} ${student.last_name}`,
                            classroom: classroomInfo,
                            code: student.student_code || ''
                          });
                          setQrModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <QrCode size={14} />
                        สแกน QR Code เพื่อประเมิน
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: SDQ Donut Chart + Dimension Scores */}
            {primarySdq ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Smile size={18} className="text-emerald-400" />
                    วิเคราะห์ผลคะแนน SDQ — แผนภูมิโดนัท
                  </h3>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-lg font-bold">
                    อ้างอิง: {teacherSdq ? 'ครูประเมิน' : studentSdq ? 'นักเรียนประเมิน' : 'ผู้ปกครองประเมิน'}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Donut Chart */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[280px] mx-auto">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={sdqDonutData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {sdqDonutData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.88} />)}
                          </Pie>
                          <Tooltip content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const { name, actualScore, color } = payload[0].payload;
                            return <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 14px' }}><p style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, margin: 0 }}>{name}: <span style={{ color }}>{actualScore} / 10</span></p></div>;
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-white leading-none">{primarySdq.total_difficulties_score}</span>
                        <span className="text-[11px] text-gray-400 mt-0.5 font-bold">/ 40 คะแนน</span>
                        <span className={`text-[11px] font-black mt-2 px-3 py-1 rounded-full ${
                          primarySdq.result_difficulties === 'PROBLEM' ? 'bg-rose-500/20 text-rose-400' :
                          primarySdq.result_difficulties === 'RISK'    ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {primarySdq.result_difficulties === 'PROBLEM' ? 'มีปัญหา' : primarySdq.result_difficulties === 'RISK' ? 'กลุ่มเสี่ยง' : 'ปกติ'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 w-full max-w-[280px] mx-auto mt-3">
                      {sdqDonutData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-0.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[9px] text-gray-500 font-bold text-center leading-tight">{d.name}</span>
                          <span className="text-[11px] font-black" style={{ color: d.color }}>{d.actualScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Dimension Score Bars */}
                  <div className="space-y-3">
                    {([
                      { label: '1. ด้านอารมณ์',             score: primarySdq.emotional_score,    dim: 'emotional'    as const },
                      { label: '2. ด้านความประพฤติ',          score: primarySdq.conduct_score,       dim: 'conduct'      as const },
                      { label: '3. ด้านสมาธิ/ไม่อยู่นิ่ง', score: primarySdq.hyperactivity_score, dim: 'hyperactivity' as const },
                      { label: '4. ด้านความสัมพันธ์เพื่อน', score: primarySdq.peer_score,           dim: 'peer'         as const },
                    ]).map(({ label, score, dim }) => {
                      const lv  = getSdqDimLevel(score, dim, primaryEvalType);
                      const col = getLvColor(lv);
                      const th  = lv === 'PROBLEM' ? 'มีปัญหา' : lv === 'RISK' ? 'เสี่ยง' : 'ปกติ';
                      return (
                        <div key={dim} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-semibold">{label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-white">{score}/10</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ backgroundColor: `${col}22`, color: col }}>{th}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score * 10}%`, backgroundColor: col }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="space-y-1 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-300 font-semibold">5. สัมพันธภาพทางสังคม (จุดแข็ง)</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white">{primarySdq.prosocial_score}/10</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${primarySdq.prosocial_score >= 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {primarySdq.prosocial_score >= 4 ? 'มีจุดแข็ง' : 'ขาดจุดแข็ง'}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${primarySdq.prosocial_score * 10}%`, backgroundColor: primarySdq.prosocial_score >= 4 ? '#10b981' : '#ef4444' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl text-center space-y-4">
                <FileText className="mx-auto text-gray-600" size={36} />
                <p className="font-bold text-xs text-gray-400">ยังไม่มีการประเมินคัดกรองพฤติกรรม SDQ ของนักเรียนรายนี้</p>
                <button onClick={() => navigate(`/studentsupport/sdq/${student.id}`)} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white transition-all shadow-md">ประเมินคัดกรองทันที</button>
              </div>
            )}

            {/* SECTION 3: EQ Donut Chart */}
            {latestEq ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Smile size={18} className="text-violet-400" />
                    วิเคราะห์ผลคะแนน EQ — ความฉลาดทางอารมณ์ (52 ข้อ)
                  </h3>
                  {/* V15.4: EQ Recalculate Button */}
                  <button
                    onClick={async () => {
                      setRecalcEqLoading(true);
                      try {
                        await studentSupportService.recalculateAllEqScores();
                        // Reload profile data
                        setProfile(await studentSupportService.getStudent360Profile(
                          studentId!,
                          selectedYear?.id,
                          selectedSemester?.id
                        ));
                      } catch (e) { console.error(e); }
                      finally { setRecalcEqLoading(false); }
                    }}
                    disabled={recalcEqLoading}
                    title="คำนวณคะแนน EQ รายมิติใหม่"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 hover:bg-violet-500/20 font-bold text-[11px] transition-all disabled:opacity-40"
                  >
                    <RefreshCw size={12} className={recalcEqLoading ? 'animate-spin' : ''} />
                    {recalcEqLoading ? 'กำลังคำนวณ...' : 'คำนวณใหม่'}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[280px] mx-auto">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={eqDonutData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={4} dataKey="value" strokeWidth={0}>
                            {eqDonutData.map((e, i) => <Cell key={i} fill={e.color} opacity={0.88} />)}
                          </Pie>
                          <Tooltip content={({ active, payload }: any) => {
                            if (!active || !payload?.length) return null;
                            const { name, value, color } = payload[0].payload;
                            return <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 14px' }}><p style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, margin: 0 }}>{name}: <span style={{ color }}>{value} คะแนน</span></p></div>;
                          }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-white leading-none">{latestEq.total_score}</span>
                        <span className="text-[11px] text-gray-400 mt-0.5 font-bold">/ 208 คะแนน</span>
                        <span className={`text-[11px] font-black mt-2 px-3 py-1 rounded-full ${
                          latestEq.eq_level === 'LOWER_THAN_NORMAL'  ? 'bg-rose-500/20 text-rose-400' :
                          latestEq.eq_level === 'HIGHER_THAN_NORMAL' ? 'bg-violet-500/20 text-violet-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {latestEq.eq_level === 'LOWER_THAN_NORMAL' ? 'ต่ำกว่าปกติ' : latestEq.eq_level === 'HIGHER_THAN_NORMAL' ? 'สูงกว่าปกติ' : 'ปกติ'}
                        </span>
                      </div>
                    </div>
                    {eqDonutData.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mx-auto mt-3">
                        {eqDonutData.map((d, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl" style={{ backgroundColor: `${d.color}15`, border: `1px solid ${d.color}25` }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[9px] text-gray-400 font-bold">{d.name}</span>
                            <span className="text-sm font-black" style={{ color: d.color }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {eqDonutData.length > 1 ? (
                      <>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">รายละเอียดรายมิติ EQ</p>
                        {eqDonutData.map((d, i) => {
                          const maxs  = [80, 72, 56];
                          const norms = ['48-59', '43-52', '48-57'];
                          const lvTh  = d.level === 'LOWER_THAN_NORMAL' ? 'ต่ำกว่าปกติ' : d.level === 'HIGHER_THAN_NORMAL' ? 'สูงกว่าปกติ' : 'ปกติ';
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-300 font-semibold">{d.name} <span className="text-[10px] text-gray-600">(ปกติ {norms[i]})</span></span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-white">{d.value}/{maxs[i]}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ backgroundColor: `${d.color}22`, color: d.color }}>{lvTh}</span>
                                </div>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(d.value / maxs[i]) * 100}%`, backgroundColor: d.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 py-4 text-center">คะแนนรายมิติจะแสดงหลังทำแบบประเมิน EQ ใหม่</p>
                    )}
                    <p className="text-[10px] text-gray-500 leading-relaxed pt-2 border-t border-white/10">
                      อ้างอิงเกณฑ์กรมสุขภาพจิตวัยรุ่นไทยอายุ 12-17 ปี<br />
                      ปกติ: 139-168 | ด้านดี: 48-59 | ด้านเก่ง: 43-52 | ด้านสุข: 48-57
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl text-center space-y-4">
                <Smile className="mx-auto text-gray-600" size={36} />
                <p className="font-bold text-xs text-gray-400">ยังไม่มีการตอบแบบประเมิน EQ 52 ข้อ ของนักเรียนคนนี้</p>
                <button onClick={() => navigate(`/studentsupport/eq/${student.id}`)} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-xs text-white transition-all shadow-md">เริ่มตอบแบบสอบถาม EQ</button>
              </div>
            )}

            {/* SECTION 4: Triangulation Report */}
            {primarySdq && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
                  <Sparkles size={18} className="text-amber-400" />
                  บทวิเคราะห์แบบจำลองสามเส้า (Triangulation Report)
                </h3>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-black text-emerald-400">💪 จุดแข็ง (Strengths)</p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {primarySdq.prosocial_score >= 4
                      ? 'นักเรียนมีความเห็นอกเห็นใจผู้อื่น มีพฤติกรรมเอื้อเฟื้อเผื่อแผ่ มีจิตสาธารณะ และพร้อมรับฟังช่วยเหลือผู้อื่นอยู่เสมอในเกณฑ์ปกติ ถือเป็นทรัพยากรบุคคลที่เป็นต้นแบบและแกนนำกลุ่มเพื่อนได้ดี'
                      : 'นักเรียนยังขาดจุดแข็งพฤติกรรมทางสังคมที่โดดเด่น ควรส่งเสริมทักษะความฉลาดทางอารมณ์ กิจกรรมจิตอาสา หรือการมีส่วนร่วมในทีมทำงานกลุ่มเพื่อนช่วยเพื่อนเพื่อพัฒนาการเข้าสังคมที่ดีขึ้น'
                    }
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-black text-rose-400">⚠️ จุดที่ต้องให้ความช่วยเหลือ (Intervention Points)</p>
                  {triWeaknesses.length === 0 ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-xs text-emerald-400 font-bold text-center">
                      ✅ ไม่พบพฤติกรรมที่ต้องการการช่วยเหลือพิเศษในขณะนี้
                    </div>
                  ) : (
                    triWeaknesses.map((w: any, i: number) => (
                      <div key={i} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-black text-rose-400">{w.icon} {w.dim}</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{w.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SECTION 5: V15.3 SDQ History Timeline */}
            {sdqChartData.length >= 2 && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-sky-400" />
                    ประวัติคะแนน SDQ ย้อนหลัง (Timeline)
                  </h3>
                  <span className="text-[10px] text-gray-500 font-bold">คะแนนรวมปัญหา (0–40)</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sdqChartData} margin={{ top: 8, right: 24, left: -16, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 40]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={15} stroke="rgba(251,191,36,0.35)" strokeDasharray="4 2"
                      label={{ value: 'เสี่ยง', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
                    <ReferenceLine y={18} stroke="rgba(239,68,68,0.35)" strokeDasharray="4 2"
                      label={{ value: 'ปัญหา', fill: '#ef4444', fontSize: 9, position: 'right' }} />
                    <Tooltip
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div style={{ background: 'rgba(9,13,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
                            <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{label}</p>
                            {payload.map((p: any) => (
                              <p key={p.dataKey} style={{ color: p.stroke, fontWeight: 600, fontSize: 11 }}>
                                {p.dataKey === 'TEACHER' ? 'ครู' : p.dataKey === 'STUDENT' ? 'นักเรียน' : 'ผู้ปกครอง'}: {p.value} คะแนน
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend formatter={(v: string) => <span style={{ fontSize: 10, color: '#9ca3af' }}>{v === 'TEACHER' ? 'ครูประเมิน' : v === 'STUDENT' ? 'นักเรียนประเมิน' : 'ผู้ปกครองประเมิน'}</span>} />
                    <Line dataKey="TEACHER" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                    <Line dataKey="STUDENT" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                    <Line dataKey="PARENT"  stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-gray-600 text-center">เส้นแบ่ง: เหลือง = เสี่ยง (≥ 15) │ แดง = มีปัญหา (≥ 18) — อ้างอิงเกณฑ์ครูประเมิน</p>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: ATTENDANCE */}
        {activeTab === 'ATTENDANCE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual statistics */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between items-center text-center">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 w-full">
                สถิติร้อยละเวลาการเข้าแถว (Homeroom)
              </h3>

              <div className="my-8 relative flex items-center justify-center">
                {/* Circular indicator style */}
                <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center">
                  <div>
                    <span className="text-3xl font-black text-white">{attendanceRate}%</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">เข้าชั้นเรียน</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full text-xs">
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-xxs text-gray-500 block mb-0.5">มาเรียน (PRESENT)</span>
                  <span className="font-bold text-emerald-400">{attendanceSummary.present} วัน</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-xxs text-gray-500 block mb-0.5">มาสาย (LATE)</span>
                  <span className="font-bold text-yellow-300">{attendanceSummary.late} วัน</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-xxs text-gray-500 block mb-0.5">ขาดเรียน (ABSENT)</span>
                  <span className="font-bold text-rose-400">{attendanceSummary.absent} วัน</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <span className="text-xxs text-gray-500 block mb-0.5">ลากิจ/ลาป่วย</span>
                  <span className="font-bold text-gray-300">{attendanceSummary.leave} วัน</span>
                </div>
              </div>
            </div>

            {/* Leaves history */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                ประวัติใบลาและการขาดเรียนสะสม ({leaves.length} ใบขออนุญาต)
              </h3>

              {leaves.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-8 text-center">นักเรียนรายนี้ยังไม่มีประวัติการส่งใบขออนุญาตลาป่วยหรือลากิจ</p>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[350px]">
                  {leaves.map((leave: any) => (
                    <div key={leave.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{leave.reason || 'ไม่ระบุเหตุผลในการลา'}</p>
                        <span className="text-xxs text-gray-500 block mt-0.5">ประเภท: {leave.leave_type === 'SICK' ? 'ลาป่วย' : 'ลากิจ'} • วันเริ่มลา: {new Date(leave.start_date).toLocaleDateString('th-TH')}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leave.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                          leave.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' : 'bg-yellow-500/10 text-yellow-300'
                        }`}>
                        {leave.status === 'APPROVED' ? 'อนุมัติเรียบร้อย' : leave.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอกระบวนการอนุมัติ'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* V15.9: Attendance Monthly Mini-Chart */}
          {Array.isArray(attendanceByMonth) && attendanceByMonth.length >= 2 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-400" />
                  แนวโน้มการเข้าเรียนรายเดือน
                </h3>
                <span className="text-[10px] text-gray-500 font-bold">จำนวนวันต่อเดือน</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceByMonth} margin={{ top: 4, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div style={{ background: 'rgba(9,13,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
                          <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{label}</p>
                          {payload.map((p: any) => (
                            <p key={p.dataKey} style={{ color: p.fill, fontWeight: 600, fontSize: 11 }}>
                              {p.dataKey === 'present' ? 'มาเรียน' : p.dataKey === 'absent' ? 'ขาด' : 'สาย'}: {p.value} วัน
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend formatter={(v: string) => <span style={{ fontSize: 10, color: '#9ca3af' }}>{v === 'present' ? 'มาเรียน' : v === 'absent' ? 'ขาดเรียน' : 'มาสาย'}</span>} />
                  <Bar dataKey="present" fill="#10b981" radius={[4,4,0,0]} maxBarSize={32} />
                  <Bar dataKey="absent"  fill="#ef4444" radius={[4,4,0,0]} maxBarSize={32} />
                  <Bar dataKey="late"    fill="#eab308" radius={[4,4,0,0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        )}

        {/* TAB 4.5: PORTFOLIO */}
        {activeTab === 'PORTFOLIO' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <span>ผลงานและกิจกรรมที่บันทึกไว้ในระบบ (Student Portfolio)</span>
              </h3>
              <button
                onClick={() => navigate(`/studentsupport/profile/${student.id}/portfolio`, { state: { from: `/studentsupport/profile/${student.id}` } })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xxs flex items-center gap-1.5 transition-all shadow-md"
              >
                จัดการผลงานสะสม
              </button>
            </div>

            {portfolios.length === 0 ? (
              <div className="text-center py-12 text-gray-500 space-y-2">
                <Award className="mx-auto text-gray-650" size={32} />
                <p className="font-bold text-xs">ยังไม่มีการบันทึกประวัติผลงาน/กิจกรรมของนักเรียน</p>
                <p className="text-[11px] text-gray-600">ครูที่ปรึกษาสามารถคลิก "จัดการผลงานสะสม" เพื่อบันทึกผลงานสะสมเพิ่มเติม</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios.map((item: any) => (
                  <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start text-[10px]">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold">
                          {item.category === 'ACADEMIC' ? 'วิชาการ/ผลการเรียน' :
                           item.category === 'ACTIVITY' ? 'กิจกรรม/จิตอาสา' :
                           item.category === 'AWARD' ? 'รางวัล/การแข่งขัน' :
                           item.category === 'SKILL' ? 'ทักษะพิเศษ' : 'อื่นๆ'}
                        </span>
                        <span className="text-gray-500 font-medium">ปี {item.academic_year || '-'}/{item.semester || '-'}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-2 mt-1">
                      <span>{item.date ? new Date(item.date).toLocaleDateString('th-TH') : '-'}</span>
                      {item.certificate_url ? (
                        <a href={item.certificate_url} target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline flex items-center gap-0.5">
                          <span>{item.certificate_label || 'ผลงาน'}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span>ไม่มีหลักฐานแนบ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CASES */}
        {activeTab === 'CASES' && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-400" />
                ประวัติกรณีศึกษาและการดูแลช่วยเหลือนักเรียน (Case Management Logs)
              </h3>

              <button
                onClick={() => navigate('/studentsupport/cases')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-xxs flex items-center gap-1.5 transition-all shadow-md"
              >
                เปิดเคส / จัดการที่นี่
              </button>
            </div>

            {/* Quick Assessment Actions inside CASES tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="space-y-1">
                <span className="text-xxs text-gray-400 font-bold block uppercase tracking-wider">ประเมินและคัดกรองพฤติกรรม</span>
                <button
                  onClick={() => navigate(`/studentsupport/sdq/${student.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold text-xs transition-all hover:scale-[1.01]"
                >
                  <FileText size={16} />
                  ทำแบบประเมิน SDQ (25 ข้อ)
                </button>
              </div>
              <div className="space-y-1">
                <span className="text-xxs text-gray-400 font-bold block uppercase tracking-wider">ประเมินความฉลาดทางอารมณ์</span>
                <button
                  onClick={() => navigate(`/studentsupport/eq/${student.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 font-bold text-xs transition-all hover:scale-[1.01]"
                >
                  <Smile size={16} />
                  ทำแบบประเมิน EQ (52 ข้อ)
                </button>
              </div>
            </div>

            {cases.length === 0 ? (
              <div className="text-center py-12 text-gray-500 space-y-3">
                <AlertCircle className="mx-auto text-gray-600" size={32} />
                <p className="font-bold text-xs">นักเรียนคนนี้ยังไม่เคยวอกแวก หรือโดนรายงานพฤติกรรมเสี่ยงมาก่อน</p>
                <p className="text-[11px] text-gray-600">ปกติหากครูสังเกตพฤติกรรมเสี่ยง สามารถเปิดเคสช่วยเหลือได้</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cases.map((c: any) => (
                  <div key={c.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/5 pb-2">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-snug">{c.title}</h4>
                        <span className="text-[10px] text-gray-500">
                          ระดับเฝ้าระวัง: {c.risk_level === 'URGENT' ? 'ด่วนที่สุด (แดง)' : c.risk_level === 'RISK' ? 'กลุ่มเสี่ยง (ส้ม)' : 'เฝ้าระวัง (เหลือง)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${c.status === 'CLOSED' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            c.status === 'HELPING' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                              'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                          }`}>
                          {c.status === 'CLOSED' ? 'ปิดเคสแล้ว' : c.status === 'HELPING' ? 'กำลังช่วยเหลือ' : 'กำลังติดตาม'}
                        </span>
                      </div>
                    </div>

                    {c.description && (
                      <p className="text-xs text-gray-300 leading-relaxed bg-white/5 rounded-xl p-3">
                        <span className="text-[10px] text-gray-500 block mb-1 font-bold">ข้อมูลพฤติกรรมตอนแจ้งเคส:</span>
                        {c.description}
                      </p>
                    )}

                    {/* Show case logs if loaded */}
                    {c.case_logs && c.case_logs.length > 0 && (
                      <div className="space-y-3 pl-4 border-l border-white/10 pt-2">
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">บันทึกประวัติการช่วยเหลือ:</span>
                        {c.case_logs.map((log: any) => (
                          <div key={log.id} className="text-xxs space-y-0.5 bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                            <div className="flex justify-between text-gray-500">
                              <span className="font-bold">ครู{log.logged_by || 'ผู้ดูแล'}</span>
                              <span>{new Date(log.created_at).toLocaleDateString('th-TH')}</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{log.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4.6: BEHAVIOR */}
        {activeTab === 'BEHAVIOR' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header and Add Action */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Heart size={18} className="text-rose-400 fill-rose-400" />
                    <span>คะแนนพฤติกรรมนักเรียน (Behavior Points Tracker)</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    คะแนนเริ่มต้น 100 คะแนน ใช้ประเมินความเสี่ยงด้านวินัยและความประพฤติร่วมกับ Risk Intelligence Engine
                  </p>
                </div>
                <button
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    setBehaviorForm({
                      type: 'MINUS',
                      points: 5,
                      category: 'มาสาย/หนีเรียน',
                      description: '',
                      incident_date: todayStr
                    });
                    setBDateInput(formatThaiBEEInputDate(todayStr));
                    setBDateError('');
                    setShowBDatePicker(false);
                    setBCalendarMonth(new Date().getMonth());
                    setBCalendarYear(new Date().getFullYear());
                    setShowBehaviorModal(true);
                  }}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Plus size={14} />
                  <span>+ บันทึกพฤติกรรม</span>
                </button>
              </div>

              {/* Behavior Metrics Summary Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนสุทธิปัจจุบัน</span>
                  <div className="relative flex items-center justify-center">
                    {/* Circle Score Display */}
                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 font-black text-2xl shadow-inner ${
                      behaviorSummary.netScore < 50 ? 'border-rose-500 text-rose-400 bg-rose-500/10' :
                      behaviorSummary.netScore < 80 ? 'border-amber-500 text-amber-400 bg-amber-500/10' :
                      'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {behaviorSummary.netScore}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold mt-3 px-2 py-0.5 rounded-full border ${
                    behaviorSummary.netScore < 50 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    behaviorSummary.netScore < 80 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {behaviorSummary.netScore < 50 ? 'มีปัญหา (PROBLEM)' :
                     behaviorSummary.netScore < 80 ? 'กลุ่มเสี่ยง (RISK)' :
                     'ปกติ (NORMAL)'}
                  </span>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนความดีสะสม</span>
                  <div className="text-3xl font-black text-emerald-400">+{behaviorSummary.plusSum}</div>
                  <span className="text-[10px] text-gray-500 mt-2">คะแนนที่ได้รับบวกเพิ่ม</span>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">คะแนนโดนตัดสะสม</span>
                  <div className="text-3xl font-black text-rose-400">-{behaviorSummary.minusSum}</div>
                  <span className="text-[10px] text-gray-500 mt-2">คะแนนที่ถูกหักเนื่องจากผิดวินัย</span>
                </div>
              </div>
            </div>

            {/* Behavior Logs Timeline List */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">
                ประวัติรายการพฤติกรรมของปีการศึกษานี้
              </h3>

              {behaviorPoints.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-2">
                  <Activity className="mx-auto text-gray-650" size={32} />
                  <p className="font-bold text-xs">ยังไม่มีบันทึกประวัติคะแนนพฤติกรรมในภาคเรียนนี้</p>
                  <p className="text-[11px] text-gray-600">กดปุ่ม "+ บันทึกพฤติกรรม" เพื่อจดบันทึกความประพฤติใหม่</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {behaviorPoints.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 ${
                          item.type === 'PLUS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.type === 'PLUS' ? '+' : '-'}{item.points}
                        </span>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.type === 'PLUS' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                              'text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>
                              {item.category}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              วันที่เกิดเหตุ: {new Date(item.incident_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            บันทึกโดย: ครู{item.teacher?.first_name || ''} {item.teacher?.last_name || 'ผู้ดูแลระบบ'}
                          </p>
                        </div>
                      </div>

                      {/* Delete button (only show for the teacher who recorded it or administrators) */}
                      <button
                        onClick={() => setDeletingBehaviorId(item.id!)}
                        className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all self-end sm:self-center"
                        title="ลบข้อมูลพฤติกรรม"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ADD BEHAVIOR MODAL */}
      {showBehaviorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-6 bg-gradient-to-r from-rose-500/20 to-indigo-500/20 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-base font-black flex items-center gap-2">
                <Heart size={18} className="text-rose-400" />
                <span>บันทึกคะแนนพฤติกรรมนักเรียน</span>
              </h3>
              <button
                onClick={() => setShowBehaviorModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!studentId) return;
                setSubmittingBehavior(true);
                try {
                  await behaviorService.addBehaviorPoint({
                    student_id: studentId,
                    academic_year_id: selectedYear?.id,
                    semester_id: selectedSemester?.id,
                    type: behaviorForm.type,
                    points: Number(behaviorForm.points),
                    category: behaviorForm.category,
                    description: behaviorForm.description,
                    incident_date: behaviorForm.incident_date,
                    recorded_by: teacherId || undefined
                  });
                  await refreshAllData();
                  setShowBehaviorModal(false);
                } catch (err: any) {
                  alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                } finally {
                  setSubmittingBehavior(false);
                }
              }}
              className="p-6 space-y-4"
            >
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">ประเภทพฤติกรรม *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBehaviorForm(prev => ({ 
                      ...prev, 
                      type: 'PLUS', 
                      category: 'ช่วยเหลือสังคม/จิตอาสา',
                      points: 10
                    }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      behaviorForm.type === 'PLUS'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-white/0 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>➕ เพิ่มคะแนนความดี</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBehaviorForm(prev => ({ 
                      ...prev, 
                      type: 'MINUS', 
                      category: 'มาสาย/หนีเรียน',
                      points: 5
                    }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      behaviorForm.type === 'MINUS'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md shadow-rose-500/5'
                        : 'bg-white/0 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>➖ หักคะแนนความประพฤติ</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Points Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">คะแนน *</label>
                  <select
                    value={behaviorForm.points}
                    onChange={(e) => setBehaviorForm(prev => ({ ...prev, points: Number(e.target.value) }))}
                    className="w-full bg-[#0f172a] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-900"
                  >
                    <option value="5">5 คะแนน</option>
                    <option value="10">10 คะแนน</option>
                    <option value="20">20 คะแนน</option>
                    <option value="50">50 คะแนน</option>
                  </select>
                </div>

                 {/* Date Picker Selection */}
                <div className="relative b-datepicker-container">
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">วันที่เกิดเหตุ *</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="วว/ดด/ปปปป"
                      className="w-full bg-[#0f172a] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      value={bDateInput}
                      onFocus={() => setShowBDatePicker(true)}
                      onClick={() => setShowBDatePicker(true)}
                      onChange={e => {
                        const value = e.target.value;
                        setBDateInput(value);
                        const parsed = parseThaiBEInputDate(value);
                        if (parsed) {
                          setBehaviorForm(prev => ({ ...prev, incident_date: parsed }));
                          setBDateError('');
                          const parsedDate = new Date(`${parsed}T00:00:00`);
                          setBCalendarMonth(parsedDate.getMonth());
                          setBCalendarYear(parsedDate.getFullYear());
                        } else {
                          setBDateError('รูปแบบวันที่ไม่ถูกต้อง โปรดใช้ วว/ดด/ปปปป (พ.ศ.)');
                        }
                      }}
                    />
                  </div>
                  {bDateError && (
                    <p className="text-[10px] text-rose-500 mt-1 absolute z-10 bg-[#1e293b] px-2 py-0.5 rounded border border-rose-500/20">{bDateError}</p>
                  )}

                  {showBDatePicker && (
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-2xl border border-white/10 bg-[#1e293b] shadow-2xl p-4 text-white min-w-[260px]">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (bCalendarMonth === 0) {
                              setBCalendarMonth(11);
                              setBCalendarYear(prev => prev - 1);
                            } else {
                              setBCalendarMonth(prev => prev - 1);
                            }
                          }}
                          className="rounded-lg p-1 text-gray-400 hover:bg-white/10 transition"
                        >
                          ‹
                        </button>
                        <div className="text-xs font-bold text-white">
                          {thaiMonths[bCalendarMonth]} {bCalendarYear + 543}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (bCalendarMonth === 11) {
                              setBCalendarMonth(0);
                              setBCalendarYear(prev => prev + 1);
                            } else {
                              setBCalendarMonth(prev => prev + 1);
                            }
                          }}
                          className="rounded-lg p-1 text-gray-400 hover:bg-white/10 transition"
                        >
                          ›
                        </button>
                      </div>

                      {/* Days of Week */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
                        {thaiWeekdays.map(day => <div key={day}>{day}</div>)}
                      </div>

                      {/* Calendar Cells */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {bCalendarCells.map((day, index) => {
                          const isSelected = day &&
                            day === new Date(`${behaviorForm.incident_date}T00:00:00`).getDate() &&
                            bCalendarMonth === new Date(`${behaviorForm.incident_date}T00:00:00`).getMonth() &&
                            bCalendarYear === new Date(`${behaviorForm.incident_date}T00:00:00`).getFullYear();

                          return (
                            <button
                              key={`${bCalendarYear}-${bCalendarMonth}-${index}`}
                              type="button"
                              onClick={() => day && selectBCalendarDate(day)}
                              className={`h-7 text-[11px] rounded-lg transition ${day
                                ? isSelected
                                  ? 'bg-rose-500 text-white font-bold'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                : 'pointer-events-none text-transparent'
                                }`}
                            >
                              {day || ''}
                            </button>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                        <button
                          type="button"
                          onClick={() => setShowBDatePicker(false)}
                          className="text-gray-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
                        >
                          ปิด
                        </button>
                        <span className="text-gray-500">ปฏิทินไทย (พ.ศ.)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">หมวดหมู่พฤติกรรม *</label>
                <select
                  value={behaviorForm.category}
                  onChange={(e) => setBehaviorForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-900"
                >
                  {behaviorForm.type === 'PLUS' ? (
                    <>
                      <option value="ช่วยเหลือสังคม/จิตอาสา">ช่วยเหลือสังคม/จิตอาสา</option>
                      <option value="มีคุณธรรม/ซื่อสัตย์">มีคุณธรรม/ซื่อสัตย์</option>
                      <option value="แต่งกายเรียบร้อย">แต่งกายเรียบร้อย</option>
                      <option value="พัฒนาโรงเรียน">พัฒนาโรงเรียน</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </>
                  ) : (
                    <>
                      <option value="มาสาย/หนีเรียน">มาสาย/หนีเรียน</option>
                      <option value="ฝ่าฝืนกฎวินัย/การแต่งกาย">ฝ่าฝืนกฎวินัย/การแต่งกาย</option>
                      <option value="ก้าวร้าว/ทะเลาะวิวาท">ก้าวร้าว/ทะเลาะวิวาท</option>
                      <option value="สารเสพติด/อบายมุข">สารเสพติด/อบายมุข</option>
                      <option value="ชู้สาว">ชู้สาว</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">รายละเอียดเพิ่มเติม</label>
                <textarea
                  placeholder="รายละเอียดเหตุการณ์หรือหมายเหตุ..."
                  rows={3}
                  value={behaviorForm.description}
                  onChange={(e) => setBehaviorForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#0f172a] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-gray-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBehaviorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingBehavior || !!bDateError}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {submittingBehavior ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBehaviorId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black">ยืนยันการลบรายการพฤติกรรม?</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  คุณแน่ใจว่าต้องการลบรายการพฤติกรรมนี้ใช่หรือไม่? คะแนนของนักเรียนจะได้รับการคำนวณใหม่โดยอัตโนมัติ และไม่สามารถย้อนกลับการดำเนินการได้
                </p>
              </div>
            </div>
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingBehavior}
                onClick={() => setDeletingBehaviorId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeletingBehavior}
                onClick={async () => {
                  if (!studentId || !deletingBehaviorId) return;
                  setIsDeletingBehavior(true);
                  try {
                    await behaviorService.deleteBehaviorPoint(deletingBehaviorId, studentId, selectedYear?.id);
                    await refreshAllData();
                    setDeletingBehaviorId(null);
                  } catch (err: any) {
                    alert('ไม่สามารถลบรายการได้: ' + err.message);
                  } finally {
                    setIsDeletingBehavior(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition shadow-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingBehavior ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar for Mobile (Line style with quick actions) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/10 py-3 px-2 flex justify-around items-center z-50 shadow-2xl safe-bottom">
        {/* 0. ย้อนกลับ */}
        <button
          onClick={() => navigate('/studentsupport')}
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-all hover:scale-105"
          title="กลับหน้าควบคุมที่ปรึกษา"
        >
          <ChevronLeft size={20} className="text-gray-400" />
          <span className="text-[10px] font-black text-gray-400">ย้อนกลับ</span>
        </button>

        {/* 1. ดู 360° */}
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-indigo-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Activity size={20} />
          <span className="text-[10px] font-black">ดู 360°</span>
        </button>

        {/* 2. SDQ/EQ */}
        <button
          onClick={() => setActiveTab('SDQ_EQ')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SDQ_EQ' ? 'text-violet-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Smile size={20} />
          <span className="text-[10px] font-black">ผล SDQ/EQ</span>
        </button>

        {/* 2.5. คะแนนพฤติกรรม */}
        <button
          onClick={() => setActiveTab('BEHAVIOR')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'BEHAVIOR' ? 'text-rose-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Heart size={20} />
          <span className="text-[10px] font-black">พฤติกรรม</span>
        </button>

        {/* 3. เวลาเรียน */}
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ATTENDANCE' ? 'text-emerald-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Calendar size={20} />
          <span className="text-[10px] font-black">เวลาเรียน</span>
        </button>

        {/* 3.5. ผลงาน */}
        <button
          onClick={() => setActiveTab('PORTFOLIO')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PORTFOLIO' ? 'text-amber-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Award size={20} />
          <span className="text-[10px] font-black">ผลงาน</span>
        </button>

        {/* 4. จัดการเคส */}
        <button
          onClick={() => setActiveTab('CASES')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'CASES' ? 'text-rose-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <ShieldAlert size={20} />
          <span className="text-[10px] font-black">จัดการเคส</span>
        </button>
      </div>

      {/* Premium Glassmorphic QR Code Modal */}
      {qrModalOpen && qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setQrModalOpen(false)}></div>
          <div className="bg-[#1e293b] border border-white/10 rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <h3 className="text-base font-black text-white leading-snug">{qrModalData.title}</h3>
              <p className="text-xs text-gray-400 font-bold">
                นักเรียน: {qrModalData.studentName} ({qrModalData.code})<br />
                ชั้นเรียน: {qrModalData.classroom}
              </p>
              
              <div className="p-4 bg-white rounded-2xl shadow-inner border border-white/10">
                <QRCodeSVG value={qrModalData.url} size={200} level="H" includeMargin={false} />
              </div>
              
              <p className="text-[10px] text-gray-500 max-w-[240px] leading-relaxed">
                สแกนด้วยโทรศัพท์เพื่อกรอกแบบประเมิน SDQ ได้ทันที หน้านี้จะซ่อนเมนูระบบโดยอัตโนมัติ
              </p>

              <div className="flex w-full gap-2 pt-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(qrModalData.url);
                      setSuccessMessage('คัดลอกลิงก์แบบประเมินเรียบร้อยแล้ว!');
                      setTimeout(() => setSuccessMessage(null), 2500);
                    } catch (_) {
                      setToastError('ไม่สามารถคัดลอกลิงก์ได้');
                      setTimeout(() => setToastError(null), 2500);
                    }
                  }}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 font-bold text-xs rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> คัดลอกลิงก์
                </button>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
