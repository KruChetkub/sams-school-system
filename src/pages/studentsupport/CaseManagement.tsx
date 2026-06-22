import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, PlusCircle,
  MessageSquare, User, Clock, ArrowLeft, Send, Sparkles, Filter, Check, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { studentSupportService } from '../../services/studentsupport/studentSupportService';
import type { SupportCase } from '../../services/studentsupport/studentSupportService';
import { useAcademicYearStore } from '../../store/academicYearStore';

export default function CaseManagement() {
  const navigate = useNavigate();
  const { selectedYear, selectedSemester } = useAcademicYearStore();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [newLogComment, setNewLogComment] = useState('');
  const [updateStatus, setUpdateStatus] = useState<SupportCase['status'] | ''>('');

  // สถานะเปิดเคสใหม่
  const [openModal, setOpenModal] = useState(false);
  const [advisingStudents, setAdvisingStudents] = useState<any[]>([]);
  const [newCaseStudentId, setNewCaseStudentId] = useState('');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCaseRisk, setNewCaseRisk] = useState<'MONITOR' | 'RISK' | 'URGENT'>('MONITOR');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchCasesData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('กรุณาเข้าสู่ระบบก่อนใช้งาน');
        setLoading(false);
        return;
      }

      // ดึงบทบาทผู้ใช้
      let { data: teacher, error: teacherErr } = await supabase
        .from('teachers')
        .select('id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacher) {
        const { data: fallbackTeacher } = await supabase
          .from('teachers')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();
        if (fallbackTeacher) teacher = fallbackTeacher;
      }

      if (teacherErr) throw teacherErr;
      const role = teacher?.role;
      if (teacher) {
        setUserRole(role);
      }

      // ดึงรายชื่อเคส
      let loadedCases = [];
      if (role === 'ADMIN' || role === 'EXECUTIVE') {
        loadedCases = await studentSupportService.getAllCases(selectedYear?.id);
      } else {
        loadedCases = await studentSupportService.getAdvisorCases(user.id, selectedYear?.id);
      }
      setCases(loadedCases as any[]);

      // ดึงรายชื่อเด็กมาเก็บไว้ เผื่อคุณครูต้องการเปิดเคสช่วยเหลือคนใหม่
      let students = [];
      if (role === 'ADMIN' || role === 'EXECUTIVE') {
        students = await studentSupportService.getAllStudentsForExecutive(selectedYear?.id);
      } else {
        students = await studentSupportService.getAdvisorStudents(user.id, selectedYear?.id);
      }
      setAdvisingStudents(students);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesData();
  }, [selectedYear]);

  // ดึงรายละเอียดเคสที่เลือกแบบสมบูรณ์ รวมถึง Case Logs
  const selectCaseDetails = async (caseId: string) => {
    setError(null);
    try {
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
        .eq('id', caseId)
        .single();

      if (error) throw error;

      // ดึง Log ทั้งหมด
      const { data: logs, error: logsErr } = await supabase
        .from('student_support_case_logs')
        .select(`
          *,
          teacher:logged_by (first_name, last_name)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (logsErr) throw logsErr;

      const fullCase: SupportCase = {
        ...data,
        case_logs: logs || []
      };

      setSelectedCase(fullCase);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newLogComment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลเซสชันผู้ใช้');

      await studentSupportService.addCaseLog({
        case_id: selectedCase.id!,
        comment: newLogComment,
        teacher_user_id: user.id,
        update_status: updateStatus || undefined
      });

      setNewLogComment('');
      setUpdateStatus('');

      // ดึงข้อมูลเคสที่อัปเดตใหม่
      await selectCaseDetails(selectedCase.id!);

      // รีเฟรชรายการเคสหลัก
      let loadedCases = [];
      if (userRole === 'ADMIN' || userRole === 'EXECUTIVE') {
        loadedCases = await studentSupportService.getAllCases(selectedYear?.id);
      } else {
        loadedCases = await studentSupportService.getAdvisorCases(user.id, selectedYear?.id);
      }
      setCases(loadedCases as any[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenNewCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseStudentId || !newCaseTitle.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ไม่พบข้อมูลเซสชันผู้ใช้');

      const data = await studentSupportService.openSupportCase({
        student_id: newCaseStudentId,
        title: newCaseTitle,
        description: newCaseDesc,
        risk_level: newCaseRisk,
        teacher_user_id: user.id,
        academic_year_id: selectedYear?.id,
        semester_id: selectedSemester?.id
      });

      setOpenModal(false);
      setNewCaseStudentId('');
      setNewCaseTitle('');
      setNewCaseDesc('');
      setNewCaseRisk('MONITOR');

      // รีโหลดข้อมูลเคส
      let loadedCases = [];
      if (userRole === 'ADMIN' || userRole === 'EXECUTIVE') {
        loadedCases = await studentSupportService.getAllCases(selectedYear?.id);
      } else {
        loadedCases = await studentSupportService.getAdvisorCases(user.id, selectedYear?.id);
      }
      setCases(loadedCases as any[]);

      if (data) {
        await selectCaseDetails(data.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'URGENT': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      case 'RISK': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'URGENT': return 'ด่วนที่สุด (แดง)';
      case 'RISK': return 'กลุ่มเสี่ยง (ส้ม)';
      default: return 'เฝ้าระวัง (เหลือง)';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ปิดเคสแล้ว
          </span>
        );
      case 'HELPING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
            ดำเนินการช่วยเหลือ
          </span>
        );
      case 'FOLLOWING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            กำลังติดตาม
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xxs font-bold bg-white/10 text-gray-300 border border-white/20">
            เปิดเคสใหม่
          </span>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CLOSED': return 'ปิดเคสแล้ว';
      case 'HELPING': return 'ดำเนินการช่วยเหลือ';
      case 'FOLLOWING': return 'กำลังติดตาม';
      default: return 'เปิดเคสใหม่';
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 relative overflow-hidden font-sans">

      {/* Decorative Glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/studentsupport')}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-amber-500/35 flex items-center gap-1.5 w-fit">
                <Sparkles size={12} /> Student Case Management
              </span>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                ระบบจัดการเคสดูแลช่วยเหลือนักเรียน
              </h1>
              <p className="text-xs md:text-sm text-gray-400">
                ระบบคัดกรอง ปรึกษา ลงประวัติกิจกรรม และบันทึกติดตามความคืบหน้าเด็กในปกครอง
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle size={16} />
            เปิดเคสช่วยเหลือใหม่
          </button>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3 text-red-300 text-sm">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Interface: Two Column Grid on desktop */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Column Left: Case List (5 cols) */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 max-h-[700px] overflow-y-auto">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              รายการเคสทั้งหมด ({cases.length} รายการ)
            </h3>

            {loading ? (
              <div className="py-12 text-center text-gray-500">กำลังโหลด...</div>
            ) : cases.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <MessageSquare className="mx-auto text-gray-600" size={36} />
                <p className="font-bold text-sm">ยังไม่มีเคสการดูแลนักเรียนในระบบ</p>
                <p className="text-xs text-gray-500">สามารถกดปุ่ม "เปิดเคสช่วยเหลือใหม่" ด้านบนได้ทันที</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectCaseDetails(c.id!)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 hover:translate-x-1 ${selectedCase?.id === c.id
                      ? 'bg-white/10 border-indigo-500 shadow-md'
                      : 'bg-white/5 border-white/5 hover:border-white/10'
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getRiskColor(c.risk_level)}`}>
                        {getRiskLabel(c.risk_level)}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-1">
                      {c.title}
                    </h4>

                    {c.student && (
                      <p className="text-xs text-gray-400 font-medium">
                        เด็กนักเรียน: {c.student.first_name} {c.student.last_name} ({c.student.student_code})
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xxs text-gray-500 mt-1 border-t border-white/5 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(c.created_at!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                      {c.teacher && (
                        <span>ผู้เปิดเคส: {c.teacher.first_name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column Right: Case Detail & Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[500px]">
            {selectedCase ? (
              <div className="space-y-6 flex flex-col justify-between h-full">

                {/* Case Meta info */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">รายละเอียดกรณีการช่วยเหลือ</span>
                      <h2 className="text-lg font-black text-white mt-1 leading-snug">
                        {selectedCase.title}
                      </h2>
                      {selectedCase.student && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-400">
                            นักเรียน: <span className="text-white font-bold">{selectedCase.student.first_name} {selectedCase.student.last_name}</span> (ชั้น ม.{selectedCase.student.classroom?.level}/{selectedCase.student.classroom?.room})
                          </p>
                          <button
                            onClick={() => navigate(`/studentsupport/profile/${selectedCase.student_id}`)}
                            className="p-1 hover:bg-white/10 rounded text-indigo-400 flex items-center gap-1 text-xxs font-bold border border-indigo-500/20"
                            title="ดูโปรไฟล์ 360°"
                          >
                            <Eye size={12} />
                            โปรไฟล์
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xxs font-black border ${getRiskColor(selectedCase.risk_level)}`}>
                        ระดับความรุนแรง: {getRiskLabel(selectedCase.risk_level)}
                      </span>
                      {getStatusBadge(selectedCase.status)}
                    </div>
                  </div>

                  {selectedCase.description && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs md:text-sm text-gray-300 leading-relaxed">
                      <span className="text-xxs text-gray-500 font-bold block mb-1">เหตุผลและรายละเอียดพฤติกรรมเสี่ยง:</span>
                      {selectedCase.description}
                    </div>
                  )}
                </div>

                {/* Case Logs Timeline */}
                <div className="space-y-4 pt-4 border-t border-white/5 flex-1 overflow-y-auto max-h-[300px] pr-2">
                  <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                    <Clock size={12} />
                    บันทึกประวัติกิจกรรมและติดตามผล (Timeline)
                  </h3>

                  {(!selectedCase.case_logs || selectedCase.case_logs.length === 0) ? (
                    <p className="text-xs text-gray-500 italic py-4">ยังไม่มีการบันทึกประวัติการช่วยเหลือ หรือการปรึกษาใดๆ ในหน้านี้</p>
                  ) : (
                    <div className="space-y-4 relative pl-4 border-l border-white/10">
                      {selectedCase.case_logs.map((log) => (
                        <div key={log.id} className="relative space-y-1">
                          {/* Timeline dot */}
                          <div className="absolute top-1.5 -left-[21px] w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-[#0f172a]" />

                          <div className="flex items-center justify-between text-xxs text-gray-500">
                            <span className="font-bold text-gray-400">
                              {log.teacher?.first_name} {log.teacher?.last_name}
                            </span>
                            <span>
                              {new Date(log.created_at!).toLocaleString('th-TH', {
                                day: 'numeric', month: 'short', year: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-3">
                            {log.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Log Creator Form */}
                {selectedCase.status !== 'CLOSED' && (
                  <form onSubmit={handleAddLog} className="pt-4 border-t border-white/10 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xxs text-gray-400 font-bold block mb-1">อัปเดตสถานะของเคสการรักษา:</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value as any)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-gray-300"
                        >
                          <option value="">คงสถานะเดิม ({getStatusLabel(selectedCase.status)})</option>
                          <option value="FOLLOWING">ติดตามความคืบหน้า (FOLLOWING)</option>
                          <option value="HELPING">ดำเนินการช่วยเหลือเชิงลึก (HELPING)</option>
                          <option value="CLOSED">ดำเนินการปิดเคสเรียบร้อย (CLOSED)</option>
                        </select>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="เขียนคำอธิบายกิจกรรมการช่วยเหลือ หรือบันทึกอัปเดตตรงนี้..."
                        value={newLogComment}
                        onChange={(e) => setNewLogComment(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-xs md:text-sm focus:outline-none focus:border-indigo-500 text-white"
                        required
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-md"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                )}

                {selectedCase.status === 'CLOSED' && (
                  <div className="mt-4 p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs">
                    <CheckCircle2 size={18} />
                    <span>เคสช่วยเหลือนี้ได้รับการปิดคัดกรองสมบูรณ์แล้ว เมื่อวันที่ {new Date(selectedCase.closed_at!).toLocaleDateString('th-TH')}</span>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 my-auto py-12 space-y-3">
                <User className="text-gray-600" size={48} />
                <p className="font-bold text-sm">ไม่มีเคสการประเมินถูกเลือก</p>
                <p className="text-xs text-gray-500 max-w-xs">กรุณาเลือกเคสจากรายการด้านซ้าย หรือคลิก "เปิดเคสช่วยเหลือใหม่" เพื่อดำเนินการคัดกรองข้อมูล</p>
              </div>
            )}
          </div>

        </section>

        {/* Modal: Open New Case */}
        {openModal && (
          <div className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">

              <div className="space-y-1">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xxs font-bold uppercase tracking-widest rounded-full border border-emerald-500/35 w-fit block">
                  New Support Case Entry
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  เปิดกรณีกระบวนการช่วยเหลือใหม่
                </h3>
                <p className="text-xxs text-gray-400">กรอกพฤติกรรมเสี่ยง คัดเลือกเด็กนักเรียน และระดับการเฝ้าระวัง</p>
              </div>

              <form onSubmit={handleOpenNewCase} className="space-y-4">
                {/* Select Student */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">1. คัดเลือกเด็กนักเรียนในชั้นเรียน:</label>
                  <select
                    value={newCaseStudentId}
                    onChange={(e) => setNewCaseStudentId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3 text-xs md:text-sm focus:outline-none focus:border-emerald-500 text-white"
                    required
                  >
                    <option value="" className="bg-[#0f172a]">-- เลือกนักเรียน --</option>
                    {advisingStudents.map(student => (
                      <option key={student.id} value={student.id} className="bg-[#0f172a]">
                        {student.prefix || ''}{student.first_name} {student.last_name} ({student.student_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Case Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">2. หัวข้อกรณีการส่งเรื่องช่วยเหลือ:</label>
                  <input
                    type="text"
                    placeholder="เช่น ขาดเรียนวิชาหลัก หรือ พฤติกรรมอารมณ์ฉุนเฉียว"
                    value={newCaseTitle}
                    onChange={(e) => setNewCaseTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm focus:outline-none focus:border-emerald-500 text-white"
                    required
                  />
                </div>

                {/* Case Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300">3. รายละเอียดและลักษณะความเสี่ยง (พฤติกรรม/สุขภาพ):</label>
                  <textarea
                    placeholder="ระบุข้อสังเกตเพิ่มเติม เช่น ติดต่อผู้ปกครองแล้วเด็กมีพฤติกรรมแยกตัว คาดหวังการติดตามผล หรือพฤติกรรมก้าวร้าวกับเพื่อน..."
                    value={newCaseDesc}
                    onChange={(e) => setNewCaseDesc(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm focus:outline-none focus:border-emerald-500 text-white"
                  />
                </div>

                {/* Risk Level */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 font-bold block mb-1">4. ระดับความเร่งด่วนของการเฝ้าระวัง:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'MONITOR', label: 'เฝ้าระวัง (เหลือง)' },
                      { key: 'RISK', label: 'กลุ่มเสี่ยง (ส้ม)' },
                      { key: 'URGENT', label: 'ด่วนที่สุด (แดง)' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setNewCaseRisk(item.key as any)}
                        className={`py-2 px-1 rounded-xl text-xxs font-black border transition-all text-center ${newCaseRisk === item.key
                          ? item.key === 'URGENT' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' :
                            item.key === 'RISK' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                              'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs transition-all"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {submitting ? 'กำลังจัดเก็บ...' : 'เปิดเคสช่วยเหลือ'}
                    <Check size={14} />
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
