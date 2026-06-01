import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  User, Home, Calendar, ShieldAlert, Heart, Activity, FileText,
  ChevronLeft, Sparkles, MapPin, Phone, Users, CheckCircle2,
  AlertTriangle, AlertCircle, Smile, HelpCircle, Eye, Mail, ArrowLeft, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, Legend, BarChart, Bar, CartesianGrid } from 'recharts';

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SDQ_EQ' | 'HOME_VISIT' | 'ATTENDANCE' | 'CASES'>('OVERVIEW');
  const [recalcEqLoading, setRecalcEqLoading] = useState(false);

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
        const data = await studentSupportService.getStudent360Profile(studentId);
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [studentId]);

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
  const teacherSdq: any = (sdq as any[])?.find((s: any) => s.evaluator_type === 'TEACHER') ?? null;
  const studentSdq: any = (sdq as any[])?.find((s: any) => s.evaluator_type === 'STUDENT') ?? null;
  const parentSdq:  any = (sdq as any[])?.find((s: any) => s.evaluator_type === 'PARENT')  ?? null;
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
    const all = (sdq as any[]) ?? [];
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
              onClick={() => {
                if (window.history.state && window.history.state.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/studentsupport');
                }
              }}
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
            { key: 'ATTENDANCE', label: 'การเข้าเรียน & การลา', icon: Calendar },
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div key={type} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
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
                        setProfile(await studentSupportService.getStudent360Profile(studentId!));
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

      </div>

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

        {/* 3. เวลาเรียน */}
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ATTENDANCE' ? 'text-emerald-400 scale-105' : 'text-gray-400 hover:text-white'
            }`}
        >
          <Calendar size={20} />
          <span className="text-[10px] font-black">เวลาเรียน</span>
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
    </div>
  );
}
