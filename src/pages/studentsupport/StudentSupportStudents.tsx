import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Sparkles, Activity, FileText, CheckCircle2,
  AlertTriangle, ShieldAlert, Eye, Smile, HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';

export default function StudentSupportStudents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [classroomInfo, setClassroomInfo] = useState('');

  useEffect(() => {
    const loadStudentsData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('กรุณาเข้าสู่ระบบก่อนใช้งาน');
          setLoading(false);
          return;
        }

        // ดึงข้อมูลอาจารย์ที่ล็อกอิน
        let { data: teacher } = await supabase
          .from('teachers')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!teacher) {
          const { data: fallbackTeacher } = await supabase
            .from('teachers')
            .select('first_name, last_name')
            .eq('id', user.id)
            .maybeSingle();
          if (fallbackTeacher) teacher = fallbackTeacher;
        }

        if (teacher) {
          setTeacherName(`${teacher.first_name || ''} ${teacher.last_name || ''}`.trim());
        }

        // ดึงนักเรียนในห้องที่ครูดูแล
        const data = await studentSupportService.getAdvisorStudents(user.id);
        setStudents(data);
        
        if (data && data.length > 0 && data[0].classroom) {
          setClassroomInfo(`${data[0].classroom.level}/${data[0].classroom.room}`);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStudentsData();
  }, []);

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
            <ShieldAlert size={14} /> ช่วยเหลือด่วน (แดง)
          </span>
        );
      case 'RISK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle size={14} /> กลุ่มเสี่ยง (ส้ม)
          </span>
        );
      case 'MONITOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <Activity size={14} /> เฝ้าระวัง (เหลือง)
          </span>
        );
      case 'UNASSESSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <HelpCircle size={14} /> ยังไม่ได้ประเมิน (เทา)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={14} /> ปกติ (เขียว)
          </span>
        );
    }
  };

  const getSdqBadge = (assessmentList: any[]) => {
    if (!assessmentList || assessmentList.length === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400">
          ยังไม่ได้ประเมิน
        </span>
      );
    }
    const latest = assessmentList[0];
    const colorMap = {
      PROBLEM: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      RISK: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    const textMap = {
      PROBLEM: 'มีปัญหา',
      RISK: 'กลุ่มเสี่ยง',
      NORMAL: 'ปกติ'
    };
    const res = latest.result_difficulties as 'PROBLEM' | 'RISK' | 'NORMAL';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorMap[res]}`}>
        SDQ: {textMap[res]}
      </span>
    );
  };

  const getEqBadge = (assessmentList: any[]) => {
    if (!assessmentList || assessmentList.length === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400">
          ยังไม่ได้ประเมิน
        </span>
      );
    }
    const latest = assessmentList[0];
    const colorMap = {
      LOWER_THAN_NORMAL: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      NORMAL: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      HIGHER_THAN_NORMAL: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    };
    const textMap = {
      LOWER_THAN_NORMAL: 'ต่ำกว่าเกณฑ์',
      NORMAL: 'ปกติ',
      HIGHER_THAN_NORMAL: 'สูงกว่าเกณฑ์'
    };
    const res = latest.eq_level as 'LOWER_THAN_NORMAL' | 'NORMAL' | 'HIGHER_THAN_NORMAL';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorMap[res]}`}>
        EQ: {textMap[res]}
      </span>
    );
  };

  // คำนวณ risk level จาก SDQ/EQ real-time (ตรงกับ Student360 + AdvisorDashboard)
  const computeStudentRisk = (s: any): string => {
    const sdqList = (s.student_support_sdq as any[]) ?? [];
    const eqList  = (s.student_support_eq  as any[]) ?? [];
    if (sdqList.length === 0) return 'UNASSESSED';

    const teacherSdq = sdqList.find((x: any) => x.evaluator_type === 'TEACHER');
    const studentSdq = sdqList.find((x: any) => x.evaluator_type === 'STUDENT');
    const primarySdq = teacherSdq ?? studentSdq ?? sdqList[0];
    const latestEq   = eqList[0] ?? null;

    let score = 0;
    if (primarySdq?.result_difficulties === 'PROBLEM') score += 3.5;
    else if (primarySdq?.result_difficulties === 'RISK') score += 1.5;
    if (latestEq?.eq_level === 'LOWER_THAN_NORMAL') score += 2.0;

    if (score >= 6.0) return 'URGENT';
    if (score >= 3.5) return 'RISK';
    if (score >= 1.5) return 'MONITOR';
    return 'NORMAL';
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.prefix || ''}${s.first_name} ${s.last_name} ${s.nickname || ''}`.toLowerCase();
    const code = (s.student_code || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());

    const overallRisk = computeStudentRisk(s);
    const matchesRisk = filterRisk === 'ALL' || overallRisk === filterRisk;

    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">กำลังโหลดรายชื่อนักเรียนและข้อมูลการประเมิน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Glow effect backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="space-y-1.5">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-indigo-500/35 flex items-center gap-1.5 w-fit">
              <Sparkles size={12} /> Individual Screening
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              คัดกรองนักเรียนรายบุคคล {classroomInfo ? (classroomInfo.startsWith('ม.') ? classroomInfo : `ม.${classroomInfo}`) : ''}
            </h1>
            <p className="text-sm text-gray-400">
              ครูที่ปรึกษาประจำชั้น: <span className="text-emerald-400 font-bold">{teacherName || 'ไม่พบชื่ออาจารย์'}</span>
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Filter and Search Section */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อนักเรียน หรือ รหัสประจำตัว..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { key: 'ALL', label: 'ทั้งหมด' },
              { key: 'UNASSESSED', label: 'ยังไม่ได้ประเมิน (เทา)' },
              { key: 'NORMAL', label: 'ปกติ (เขียว)' },
              { key: 'MONITOR', label: 'เฝ้าระวัง (เหลือง)' },
              { key: 'RISK', label: 'เสี่ยง (ส้ม)' },
              { key: 'URGENT', label: 'ช่วยเหลือด่วน (แดง)' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterRisk(f.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${filterRisk === f.key
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-md'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Students list */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center shadow-lg">
            <Users className="mx-auto text-gray-500 mb-3" size={40} />
            <p className="text-gray-400 font-bold">ไม่พบรายชื่อนักเรียนตามตัวกรองที่เลือก</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => {
              const riskLevel = computeStudentRisk(student);
              const sdqList = student.student_support_sdq || [];
              const eqList = student.student_support_eq || [];

              return (
                <div
                  key={student.id}
                  className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Info & Avatar */}
                    <div className="flex gap-4">
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.first_name}
                          className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 text-emerald-300 flex items-center justify-center font-black text-xl border border-white/10 shrink-0 uppercase">
                          {student.first_name[0]}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <span className="text-xxs text-gray-500 font-bold tracking-wider uppercase">รหัส: {student.student_code}</span>
                        <h4 className="text-base font-bold text-white leading-snug group-hover:text-indigo-400 transition-colors">
                          {student.prefix || ''}{student.first_name} {student.last_name}
                        </h4>
                        {student.nickname && (
                          <span className="inline-block px-2 py-0.5 bg-white/5 text-gray-400 text-xxs font-bold rounded">
                            ชื่อเล่น: {student.nickname}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Overall Risk Level */}
                    <div className="flex items-center justify-between border-t border-b border-white/5 py-2.5">
                      <span className="text-xs text-gray-400">ประเมินความเสี่ยง</span>
                      {getRiskBadge(riskLevel)}
                    </div>

                    {/* Sub Assessments Status */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-xl p-2.5 text-center flex flex-col justify-center items-center gap-1 border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold">แบบประเมิน SDQ</span>
                        {getSdqBadge(sdqList)}
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 text-center flex flex-col justify-center items-center gap-1 border border-white/5">
                        <span className="text-[10px] text-gray-400 font-bold">แบบประเมิน EQ</span>
                        {getEqBadge(eqList)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/5">
                    {/* Profile 360 */}
                    <button
                      onClick={() => navigate(`/studentsupport/profile/${student.id}`)}
                      className="py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xxs border border-indigo-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                      title="ประวัตินักเรียน 360°"
                    >
                      <Eye size={14} />
                      ดู 360°
                    </button>

                    {/* Sdq Asses */}
                    <button
                      onClick={() => navigate(`/studentsupport/sdq/${student.id}`)}
                      className="py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xxs border border-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                      title="ประเมินพฤติกรรม SDQ"
                    >
                      <FileText size={14} />
                      ทำ SDQ
                    </button>

                    {/* Eq Asses */}
                    <button
                      onClick={() => navigate(`/studentsupport/eq/${student.id}`)}
                      className="py-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-bold text-xxs border border-violet-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                      title="ประเมิน EQ 52 ข้อ"
                    >
                      <Smile size={14} />
                      ทำ EQ
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
