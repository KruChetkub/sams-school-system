import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Sparkles, Activity, FileText, CheckCircle2,
  AlertTriangle, ShieldAlert, Heart, Eye, ArrowRight, Smile, X, ClipboardList, GraduationCap, ArrowLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';
import { useAcademicYearStore } from '../../store/academicYearStore';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

interface AdvisorDashboardProps {
  simulatedTeacherUserId?: string;
  onBack?: () => void;
}

export default function AdvisorDashboard({ simulatedTeacherUserId, onBack }: AdvisorDashboardProps = {}) {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYearStore();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [classroomInfo, setClassroomInfo] = useState('');
  const [riskFilter, setRiskFilter] = useState<string | null>(null); // null = แสดงทั้งหมด

  useEffect(() => {
    const loadAdvisorData = async () => {
      setLoading(true);
      try {
        let activeUserId = simulatedTeacherUserId;
        if (!activeUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError('กรุณาเข้าสู่ระบบก่อนใช้งาน');
            setLoading(false);
            return;
          }
          activeUserId = user.id;
        }

        // ดึงข้อมูลชื่อครูที่ปรึกษา
        let { data: teacher } = await supabase
          .from('teachers')
          .select('first_name, last_name')
          .eq('user_id', activeUserId)
          .maybeSingle();

        if (!teacher) {
          const { data: fallbackTeacher } = await supabase
            .from('teachers')
            .select('first_name, last_name')
            .eq('id', activeUserId)
            .maybeSingle();
          if (fallbackTeacher) teacher = fallbackTeacher;
        }

        if (teacher) {
          setTeacherName(`${teacher.first_name || ''} ${teacher.last_name || ''}`.trim());
        }

        // ดึงข้อมูลนักเรียนในห้องเรียน
        const data = await studentSupportService.getAdvisorStudents(activeUserId, selectedYear?.id);
        setStudents(data);

        if (data && data.length > 0 && data[0].classroom) {
          setClassroomInfo(`${data[0].classroom.level}/${data[0].classroom.room}`);
        } else {
          setClassroomInfo('');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAdvisorData();
  }, [selectedYear, simulatedTeacherUserId]);

  // คำนวณจำนวนนักเรียนแต่ละกลุ่มความเสี่ยง
  // *** ใช้วิธีคำนวณ real-time จากข้อมูล SDQ/EQ เหมือน Student360 ***
  // ไม่พึ่ง student_support_risk_analysis table เพื่อความถูกต้องทันที
  const computeStudentRisk = (s: any): 'NORMAL' | 'MONITOR' | 'RISK' | 'URGENT' | null => {
    const sdqList = (s.student_support_sdq as any[]) ?? [];
    const eqList = (s.student_support_eq as any[]) ?? [];

    // ถ้าไม่มี SDQ เลย ถือว่ายังไม่ได้คัดกรอง (null)
    if (sdqList.length === 0) return null;

    const teacherSdq = sdqList.find((x: any) => x.evaluator_type === 'TEACHER');
    const studentSdq = sdqList.find((x: any) => x.evaluator_type === 'STUDENT');
    const primarySdq = teacherSdq ?? studentSdq ?? sdqList[0];
    const latestEq = eqList[0] ?? null;

    // คะแนนถ่วงน้ำหนักปัจจัยเสี่ยง (ตรงกับ Student360.getOverallRisk)
    let score = 0;
    if (primarySdq?.result_difficulties === 'PROBLEM') score += 3.5;
    else if (primarySdq?.result_difficulties === 'RISK') score += 1.5;
    if (latestEq?.eq_level === 'LOWER_THAN_NORMAL') score += 2.0;

    if (score >= 6.0) return 'URGENT';
    if (score >= 3.5) return 'RISK';
    if (score >= 1.5) return 'MONITOR';
    return 'NORMAL';
  };

  const totalCount = students.length;
  const normalStudents = students.filter(s => computeStudentRisk(s) === 'NORMAL');
  const monitorStudents = students.filter(s => computeStudentRisk(s) === 'MONITOR');
  const riskStudents = students.filter(s => computeStudentRisk(s) === 'RISK');
  const urgentStudents = students.filter(s => computeStudentRisk(s) === 'URGENT');
  const unscreenedCount = students.filter(s => computeStudentRisk(s) === null).length;
  const screenedCount = totalCount - unscreenedCount;

  // V14: Classroom Risk Donut data
  const riskDonutData = [
    { name: 'ปกติ', value: normalStudents.length, key: 'NORMAL', color: '#10b981' },
    { name: 'เฝ้าระวัง', value: monitorStudents.length, key: 'MONITOR', color: '#eab308' },
    { name: 'กลุ่มเสี่ยง', value: riskStudents.length, key: 'RISK', color: '#f97316' },
    { name: 'ช่วยเหลือด่วน', value: urgentStudents.length, key: 'URGENT', color: '#ef4444' },
  ].filter(d => d.value > 0);

  // V14: SDQ 5-Dimension Stacked Bar data (จาก TEACHER assessment)
  const sdqDimLabels = [
    { key: 'emotional', th: 'ด้านอารมณ์' },
    { key: 'conduct', th: 'ด้านเกเร' },
    { key: 'hyperactivity', th: 'ด้านสมาธิ' },
    { key: 'peer', th: 'ด้านเพื่อน' },
    { key: 'prosocial', th: 'สัมพันธภาพ' },
  ];
  // Thresholds per dimension for TEACHER evaluator
  const sdqTeacherThresholds: Record<string, { risk: number; problem: number }> = {
    emotional: { risk: 4, problem: 5 },
    conduct: { risk: 4, problem: 5 },
    hyperactivity: { risk: 6, problem: 7 },
    peer: { risk: 6, problem: 7 },
    prosocial: { risk: 0, problem: 0 }, // special
  };
  const sdqStackedData = sdqDimLabels.map(({ key, th }) => {
    let normal = 0, risk = 0, problem = 0;
    const normalNames: string[] = [], riskNames: string[] = [], problemNames: string[] = [];
    students.forEach(s => {
      const sdqList = s.student_support_sdq as any[] | null;
      const sdq = sdqList?.find((x: any) => x.evaluator_type === 'TEACHER') ?? sdqList?.[0];
      if (!sdq) return;
      const score: number = sdq[`${key}_score`] ?? 0;
      const name = `${s.first_name} ${s.last_name}`;
      if (key === 'prosocial') {
        if (score >= 4) { normal++; normalNames.push(name); }
        else { problem++; problemNames.push(name); }
      } else {
        const t = sdqTeacherThresholds[key];
        if (score >= t.problem) { problem++; problemNames.push(name); }
        else if (score >= t.risk) { risk++; riskNames.push(name); }
        else { normal++; normalNames.push(name); }
      }
    });
    return { dim: th, ปกติ: normal, เสี่ยง: risk, 'มีปัญหา': problem, normalNames, riskNames, problemNames };
  });

  // Filtered student list for drill-down
  const filteredStudents = riskFilter
    ? students.filter(s => s.student_support_risk_analysis?.[0]?.risk_level === riskFilter)
    : students;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังคำนวณแบบจำลองและวิเคราะห์ความเสี่ยงรายห้อง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {onBack && (
          <div className="flex justify-start">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <ArrowLeft size={16} /> ย้อนกลับไปหน้าเลือกครูผู้สอน
            </button>
          </div>
        )}

        {simulatedTeacherUserId && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/20 p-2.5 rounded-2xl text-amber-400 border border-amber-500/30">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-300 text-sm">กำลังทำหน้าที่แทนครูที่ปรึกษา (Simulation Mode)</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  คุณกำลังเข้าถึงพอร์ทัลดูแลช่วยเหลือนักเรียนในฐานะ <span className="underline text-amber-200 font-bold">{teacherName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/15 whitespace-nowrap"
            >
              ยกเลิกการจำลองตัวตน
            </button>
          </div>
        )}

        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="space-y-1.5">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-emerald-500/35 flex items-center gap-1.5 w-fit">
              <Sparkles size={12} /> Student Support System
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              ภาพรวมห้องเรียน {classroomInfo ? `ชั้น ${classroomInfo.startsWith('ม.') ? classroomInfo : `ม.${classroomInfo}`}` : ''}
            </h1>
            <p className="text-sm text-gray-400">
              ครูประจำชั้น: <span className="text-emerald-400 font-bold">{teacherName || 'ไม่พบชื่อคุณครู'}</span>
            </p>
          </div>

          <button
            onClick={() => navigate('/studentsupport/students')}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all duration-300 flex items-center gap-2 w-fit"
          >
            ไปที่ระบบคัดกรองรายบุคคล
            <ArrowRight size={16} />
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 📊 Overview Stats Calculation Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          {/* Card Total */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Users size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">นักเรียนทั้งหมด</p>
            <h3 className="text-3xl font-black mt-2 text-white">{totalCount} <span className="text-sm text-gray-500">คน</span></h3>
          </div>

          {/* Card Green */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มปกติ</p>
            <h3 className="text-3xl font-black mt-2 text-emerald-400">{normalStudents.length} <span className="text-sm text-emerald-600">คน</span></h3>
          </div>

          {/* Card Yellow */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-yellow-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
              <Activity size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มเฝ้าระวัง</p>
            <h3 className="text-3xl font-black mt-2 text-yellow-400">{monitorStudents.length} <span className="text-sm text-yellow-600">คน</span></h3>
          </div>

          {/* Card Orange */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">กลุ่มเสี่ยง</p>
            <h3 className="text-3xl font-black mt-2 text-amber-400">{riskStudents.length} <span className="text-sm text-amber-600">คน</span></h3>
          </div>

          {/* Card Red */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all">
            <div className="absolute top-3 right-3 p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">ช่วยเหลือด่วน</p>
            <h3 className="text-3xl font-black mt-2 text-rose-400">{urgentStudents.length} <span className="text-sm text-rose-600">คน</span></h3>
          </div>

        </section>

        {/* V15.2: SDQ Screening Progress Widget */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardList size={18} className="text-sky-400" />
                ความคืบหน้าการคัดกรอง SDQ — แยกตามผู้ประเมิน
              </h2>
              <p className="text-[11px] text-gray-400">ตรวจสอบว่านักเรียนคนใดยังไม่ได้รับการประเมินครบทั้ง 3 ชุด</p>
            </div>
            <button
              onClick={() => navigate('/studentsupport/students')}
              className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 transition-all"
            >
              จัดการรายบุคคล <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              {
                type: 'TEACHER',
                label: 'ครูประเมินนักเรียน',
                icon: '\ud83d\udc68\u200d\ud83c\udfeb',
                color: '#0ea5e9',
                bgColor: 'bg-sky-500/10',
                borderColor: 'border-sky-500/25',
                textColor: 'text-sky-400',
              },
              {
                type: 'STUDENT',
                label: 'นักเรียนประเมินตนเอง',
                icon: '\ud83c\udf92',
                color: '#6366f1',
                bgColor: 'bg-indigo-500/10',
                borderColor: 'border-indigo-500/25',
                textColor: 'text-indigo-400',
              },
              {
                type: 'PARENT',
                label: 'ผู้ปกครองประเมิน',
                icon: '\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67',
                color: '#f59e0b',
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/25',
                textColor: 'text-amber-400',
              },
            ] as const).map(({ type, label, icon, color, bgColor, borderColor, textColor }) => {
              const doneCount = students.filter(s =>
                (s.student_support_sdq as any[])?.some((x: any) => x.evaluator_type === type)
              ).length;
              const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
              const notDone = totalCount - doneCount;
              const notDoneStudents = students.filter(s =>
                !(s.student_support_sdq as any[])?.some((x: any) => x.evaluator_type === type)
              );
              return (
                <div key={type} className={`${bgColor} border ${borderColor} rounded-2xl p-4 space-y-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className={`text-xs font-bold ${textColor}`}>{label}</span>
                    <span className={`ml-auto text-lg font-black ${textColor}`}>{doneCount}/{totalCount}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-400">ประเมินแล้ว</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  {notDone > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-bold">ยังไม่ได้ประเมิน ({notDone} คน):</p>
                      <div className="flex flex-wrap gap-1">
                        {notDoneStudents.slice(0, 5).map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => navigate(`/studentsupport/sdq/${s.id}?type=${type}`)}
                            className="px-2 py-0.5 bg-white/5 border border-white/10 hover:border-white/25 text-[10px] text-gray-400 hover:text-white font-bold rounded-lg transition-all"
                          >
                            {s.first_name}
                          </button>
                        ))}
                        {notDone > 5 && (
                          <span className="px-2 py-0.5 text-[10px] text-gray-600 font-bold">+{notDone - 5} คน</span>
                        )}
                      </div>
                    </div>
                  )}
                  {notDone === 0 && (
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> ครบทุกคนแล้ว! ชุดนี้สมบูรณ์
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* รวม 3 ชุด */}
          {totalCount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 flex-wrap">
              <div className="space-y-1 flex-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-400">
                  <span>ครบทั้ง 3 ชุด</span>
                  <span className="text-white">
                    {students.filter(s => {
                      const sdqList = s.student_support_sdq as any[];
                      return ['TEACHER', 'STUDENT', 'PARENT'].every(t =>
                        sdqList?.some((x: any) => x.evaluator_type === t)
                      );
                    }).length}/{totalCount} คน
                  </span>
                </div>
                <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{
                      width: `${Math.round(
                        (students.filter(s => {
                          const sdqList = s.student_support_sdq as any[];
                          return ['TEACHER', 'STUDENT', 'PARENT'].every(t =>
                            sdqList?.some((x: any) => x.evaluator_type === t)
                          );
                        }).length / totalCount) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {Math.round(
                  (students.filter(s => {
                    const sdqList = s.student_support_sdq as any[];
                    return ['TEACHER', 'STUDENT', 'PARENT'].every(t =>
                      sdqList?.some((x: any) => x.evaluator_type === t)
                    );
                  }).length / totalCount) * 100
                )}%
              </div>
            </div>
          )}
        </section>

        {/* V14 CHARTS ROW */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* === Classroom Risk Donut (2/5 cols) === */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                ภาพรวมความเสี่ยงห้องเรียน
              </h2>
              <p className="text-[11px] text-gray-400">คลิกสไลซ์เพื่อกรองรายชื่อด้านล่าง</p>
            </div>

            {/* Donut */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={riskDonutData}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={100}
                    paddingAngle={3} dataKey="value" strokeWidth={0}
                    onClick={(entry: any) => setRiskFilter(prev => prev === entry.key ? null : entry.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {riskDonutData.map((e, i) => (
                      <Cell
                        key={i} fill={e.color}
                        opacity={riskFilter && riskFilter !== e.key ? 0.3 : 0.9}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const { name, value, color } = payload[0].payload;
                    return (
                      <div style={{ background: 'rgba(9,13,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '8px 14px' }}>
                        <p style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700, margin: 0 }}>
                          {name}: <span style={{ color }}>{value} คน</span>
                        </p>
                      </div>
                    );
                  }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-white leading-none">{screenedCount}</span>
                <span className="text-[10px] text-gray-400 font-bold">/ {totalCount} คน</span>
                <span className="text-[10px] text-emerald-400 font-bold mt-1">คัดกรองแล้ว</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'ปกติ', count: normalStudents.length, color: '#10b981', key: 'NORMAL' },
                { label: 'เฝ้าระวัง', count: monitorStudents.length, color: '#eab308', key: 'MONITOR' },
                { label: 'กลุ่มเสี่ยง', count: riskStudents.length, color: '#f97316', key: 'RISK' },
                { label: 'ช่วยเหลือด่วน', count: urgentStudents.length, color: '#ef4444', key: 'URGENT' },
              ].map(({ label, count, color, key }) => (
                <button
                  key={key}
                  onClick={() => setRiskFilter(prev => prev === key ? null : key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
                  style={{
                    backgroundColor: riskFilter === key ? `${color}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${riskFilter === key ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[11px] font-bold" style={{ color: riskFilter === key ? color : '#9ca3af' }}>{label}</span>
                  <span className="text-[11px] font-black ml-auto" style={{ color }}>{count}</span>
                </button>
              ))}
            </div>

            {riskFilter && (
              <button onClick={() => setRiskFilter(null)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all border border-white/10 hover:border-white/20">
                <X size={12} /> ล้างตัวกรอง
              </button>
            )}
          </div>

          {/* === SDQ 5-Dimension Stacked Bar (3/5 cols) === */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Smile size={16} className="text-emerald-400" />
                SDQ — สัดส่วนพฤติกรรม 5 มิติทั้งห้อง
              </h2>
              <p className="text-[11px] text-gray-400">อ้างอิงจากการประเมินของครู (Stacked 100%)</p>
            </div>

            {sdqStackedData.some(d => d['ปกติ'] + d['เสี่ยง'] + d['มีปัญหา'] > 0) ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={sdqStackedData}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 16, bottom: 0 }}
                  barSize={22}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis
                    type="number" domain={[0, 'dataMax']}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    type="category" dataKey="dim" width={72}
                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      const entry = sdqStackedData.find(d => d.dim === label);
                      return (
                        <div style={{ background: 'rgba(9,13,22,0.97)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', minWidth: 180 }}>
                          <p style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 900, marginBottom: 6 }}>{label}</p>
                          {payload.map((p: any) => (
                            <div key={p.name} style={{ marginBottom: 4 }}>
                              <span style={{ color: p.fill, fontSize: 10, fontWeight: 700 }}>{p.name}: {p.value} คน</span>
                              {p.name === 'มีปัญหา' && entry?.problemNames.length ? (
                                <p style={{ color: '#ef4444', fontSize: 9, margin: '2px 0 0 0' }}>{entry.problemNames.join(', ')}</p>
                              ) : p.name === 'เสี่ยง' && entry?.riskNames.length ? (
                                <p style={{ color: '#f97316', fontSize: 9, margin: '2px 0 0 0' }}>{entry.riskNames.join(', ')}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="ปกติ" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="เสี่ยง" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="มีปัญหา" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Legend
                    wrapperStyle={{ paddingTop: 8, fontSize: 11, color: '#9ca3af', fontWeight: 700 }}
                    formatter={(val: string) => <span style={{ color: val === 'มีปัญหา' ? '#ef4444' : val === 'เสี่ยง' ? '#f59e0b' : '#10b981' }}>{val}</span>}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <FileText className="text-gray-600" size={32} />
                <p className="text-xs text-gray-500 font-bold">ยังไม่มีข้อมูล SDQ สำหรับสร้างกราฟ</p>
                <p className="text-[10px] text-gray-600">เริ่มประเมิน SDQ นักเรียนเพื่อดูภาพรวม</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                รายชื่อนักเรียนแยกตามกลุ่มความเสี่ยง
                {riskFilter && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 ml-1">
                    กรอง: {riskFilter === 'NORMAL' ? 'ปกติ' : riskFilter === 'MONITOR' ? 'เฝ้าระวัง' : riskFilter === 'RISK' ? 'กลุ่มเสี่ยง' : 'ช่วยเหลือด่วน'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">มองเห็นสถานะระดับการช่วยเหลือของนักเรียนรายบุคคลในแถบสีคอลัมน์ทันที</p>
            </div>
            {riskFilter && (
              <button onClick={() => setRiskFilter(null)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white font-bold transition-all"><X size={12} /> ล้างตัวกรอง</button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Column 1: Normal (Green) */}
            <div className={`bg-white/5 border rounded-2xl p-4 flex flex-col h-[400px] transition-all ${riskFilter === 'NORMAL' ? 'border-emerald-500/40' : 'border-white/5'}`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> กลุ่มปกติ</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xxs font-black">{normalStudents.length} คน</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {normalStudents.length === 0 ? (
                  <p className="text-xxs text-gray-500 italic text-center py-8">ไม่มีข้อมูลนักเรียน</p>
                ) : (
                  normalStudents
                    .filter(s => !riskFilter || s.student_support_risk_analysis?.[0]?.risk_level === riskFilter || riskFilter === 'NORMAL')
                    .map(student => (
                      <div key={student.id} className="group flex flex-col gap-1.5 p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition">
                        <div className="flex items-center gap-2.5" onClick={() => navigate(`/studentsupport/profile/${student.id}`)}>
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-300 flex items-center justify-center font-bold text-xs border border-white/5 uppercase shrink-0">
                            {student.first_name[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate leading-snug">{student.first_name} {student.last_name}</p>
                            <p className="text-[10px] text-gray-500 truncate">รหัส {student.student_code}</p>
                          </div>
                        </div>
                        {/* V15.10: Quick Actions */}
                        <div className="hidden group-hover:flex gap-1.5 pt-1 border-t border-white/5">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/profile/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition">
                            <Eye size={10} /> 360°
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/sdq/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition">
                            <FileText size={10} /> SDQ
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/cases`, { state: { prefillStudentId: student.id } }); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition">
                            <ShieldAlert size={10} /> เคส
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Column 2: Monitor (Yellow) */}
            <div className={`bg-white/5 border rounded-2xl p-4 flex flex-col h-[400px] transition-all ${riskFilter === 'MONITOR' ? 'border-yellow-500/40' : 'border-white/5'}`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5"><Activity size={14} /> กลุ่มเฝ้าระวัง</span>
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 text-xxs font-black">{monitorStudents.length} คน</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {monitorStudents.length === 0 ? (
                  <p className="text-xxs text-gray-500 italic text-center py-8">ไม่มีข้อมูลนักเรียน</p>
                ) : (
                  monitorStudents.map(student => (
                    <div key={student.id} className="group flex flex-col gap-1.5 p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition">
                      <div className="flex items-center gap-2.5" onClick={() => navigate(`/studentsupport/profile/${student.id}`)}>
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-300 flex items-center justify-center font-bold text-xs border border-white/5 uppercase shrink-0">
                          {student.first_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate leading-snug">{student.first_name} {student.last_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">รหัส {student.student_code}</p>
                        </div>
                      </div>
                      <div className="hidden group-hover:flex gap-1.5 pt-1 border-t border-white/5">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/profile/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition">
                          <Eye size={10} /> 360°
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/sdq/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition">
                          <FileText size={10} /> SDQ
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/cases`, { state: { prefillStudentId: student.id } }); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition">
                          <ShieldAlert size={10} /> เคส
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 3: Risk (Orange) */}
            <div className={`bg-white/5 border rounded-2xl p-4 flex flex-col h-[400px] transition-all ${riskFilter === 'RISK' ? 'border-amber-500/40' : 'border-white/5'}`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5"><AlertTriangle size={14} /> กลุ่มเสี่ยง</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xxs font-black">{riskStudents.length} คน</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {riskStudents.length === 0 ? (
                  <p className="text-xxs text-gray-500 italic text-center py-8">ไม่มีข้อมูลนักเรียน</p>
                ) : (
                  riskStudents.map(student => (
                    <div key={student.id} className="group flex flex-col gap-1.5 p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition">
                      <div className="flex items-center gap-2.5" onClick={() => navigate(`/studentsupport/profile/${student.id}`)}>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs border border-white/5 uppercase shrink-0">
                          {student.first_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate leading-snug">{student.first_name} {student.last_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">รหัส {student.student_code}</p>
                        </div>
                      </div>
                      <div className="hidden group-hover:flex gap-1.5 pt-1 border-t border-white/5">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/profile/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition">
                          <Eye size={10} /> 360°
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/sdq/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition">
                          <FileText size={10} /> SDQ
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/cases`, { state: { prefillStudentId: student.id } }); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition">
                          <ShieldAlert size={10} /> เคส
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 4: Urgent (Red) */}
            <div className={`bg-white/5 border rounded-2xl p-4 flex flex-col h-[400px] transition-all ${riskFilter === 'URGENT' ? 'border-rose-500/40' : 'border-white/5'}`}>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5"><ShieldAlert size={14} /> ช่วยเหลือด่วน</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xxs font-black">{urgentStudents.length} คน</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {urgentStudents.length === 0 ? (
                  <p className="text-xxs text-gray-500 italic text-center py-8">ไม่มีข้อมูลนักเรียน</p>
                ) : (
                  urgentStudents.map(student => (
                    <div key={student.id} className="group flex flex-col gap-1.5 p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition">
                      <div className="flex items-center gap-2.5" onClick={() => navigate(`/studentsupport/profile/${student.id}`)}>
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs border border-white/5 uppercase shrink-0">
                          {student.first_name[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate leading-snug">{student.first_name} {student.last_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">รหัส {student.student_code}</p>
                        </div>
                      </div>
                      <div className="hidden group-hover:flex gap-1.5 pt-1 border-t border-white/5">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/profile/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition">
                          <Eye size={10} /> 360°
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/sdq/${student.id}`); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition">
                          <FileText size={10} /> SDQ
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/studentsupport/cases`, { state: { prefillStudentId: student.id } }); }} className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition">
                          <ShieldAlert size={10} /> เคส
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
