import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Save,
  CheckCircle,
  Clock,
  CheckCheck,
  Search,
  MessageSquare,
  Users,
  Check,
  UserCheck,
  Send,
  Layers,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import {
  getAssignmentById,
  getSubmissionsByAssignment,
  batchSaveSubmissions,
  updateSubmission
} from '../../services/assignmentService';
import type {
  Assignment,
  AssignmentSubmission,
  SubmissionStatus,
  UpdateSubmissionDTO
} from '../../types/assignment';
import { GradingModal } from './components/GradingModal';
import { AssignmentAlertModal } from './components/AssignmentAlertModal';

export const AssignmentGrading: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuthStore();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state for inline edits
  const [editedSubmissions, setEditedSubmissions] = useState<
    Record<string, { status: SubmissionStatus; score: number | null; is_received?: boolean; group_name?: string | null; feedback?: string | null }>
  >({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'received' | 'not_received' | 'submitted' | 'graded'>('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  // Individual Grading Modal State
  const [selectedSubForModal, setSelectedSubForModal] = useState<AssignmentSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);
  const [actualTeacherId, setActualTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const resolveTeacher = async () => {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setActualTeacherId(data.id);
      } catch (err) {
        console.warn('Could not resolve teacher profile in grading:', err);
      }
    };
    resolveTeacher();
  }, [user?.id]);

  // Alert Modal
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const fetchData = async () => {
    if (!assignmentId) return;
    setLoading(true);
    try {
      const a = await getAssignmentById(assignmentId);
      setAssignment(a);

      const subs = await getSubmissionsByAssignment(assignmentId);
      setSubmissions(subs);

      // เติม initial inline edit state
      const initialMap: Record<string, { status: SubmissionStatus; score: number | null; is_received?: boolean; group_name?: string | null; feedback?: string | null }> = {};
      subs.forEach(s => {
        initialMap[s.id] = {
          status: s.status,
          score: s.score ?? null,
          is_received: s.is_received || s.status === 'submitted' || s.status === 'graded',
          group_name: s.group_name || null,
          feedback: s.feedback || null
        };
      });
      setEditedSubmissions(initialMap);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error('Error fetching assignment grading data:', err);
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถโหลดข้อมูลการส่งงานได้'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  // ดึงรายชื่อกลุ่มทั้งหมด (ถ้ามี)
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    submissions.forEach(s => {
      if (s.group_name) groups.add(s.group_name);
    });
    return Array.from(groups).sort();
  }, [submissions]);

  // สลับสถานะ "รับงานแล้ว" (Received)
  const handleToggleReceived = (subId: string) => {
    setEditedSubmissions(prev => {
      const current = prev[subId];
      const nextReceived = !current.is_received;
      return {
        ...prev,
        [subId]: {
          ...current,
          is_received: nextReceived
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // สลับสถานะ "ส่งงานแล้ว" (Submitted)
  const handleToggleSubmitted = (subId: string) => {
    setEditedSubmissions(prev => {
      const current = prev[subId];
      const isTurnedIn = current.status === 'submitted' || current.status === 'graded';
      const nextStatus: SubmissionStatus = isTurnedIn ? 'pending' : 'submitted';
      return {
        ...prev,
        [subId]: {
          ...current,
          status: nextStatus,
          // หากส่งงานแล้ว ให้ถือว่ารับงานแล้วด้วยอัตโนมัติ
          is_received: !isTurnedIn ? true : current.is_received
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // แก้ไขสถานะเต็มรูปแบบ
  const handleStatusChange = (subId: string, newStatus: SubmissionStatus) => {
    setEditedSubmissions(prev => {
      const current = prev[subId];
      let newScore = current.score;
      if (newStatus === 'graded' && (newScore === null || newScore === undefined)) {
        newScore = assignment?.max_score ?? 10;
      }
      return {
        ...prev,
        [subId]: {
          ...current,
          status: newStatus,
          score: newScore,
          is_received: newStatus === 'submitted' || newStatus === 'graded' ? true : current.is_received
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // แก้ไขคะแนนแบบ inline
  const handleScoreChange = (subId: string, valStr: string) => {
    const maxScore = assignment?.max_score ?? 10;
    const num = valStr !== '' ? parseFloat(valStr) : null;
    
    let validScore = num;
    if (num !== null) {
      if (num < 0) validScore = 0;
      else if (num > maxScore) validScore = maxScore;
    }

    setEditedSubmissions(prev => {
      const current = prev[subId];
      let autoStatus = current.status;
      if (validScore !== null && validScore > 0 && autoStatus === 'pending') {
        autoStatus = 'graded';
      }
      return {
        ...prev,
        [subId]: {
          ...current,
          score: validScore,
          status: autoStatus,
          is_received: true
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // เชครับงานทุกคน (All Received)
  const handleMarkAllReceived = () => {
    setEditedSubmissions(prev => {
      const updated = { ...prev };
      submissions.forEach(sub => {
        updated[sub.id] = {
          ...updated[sub.id],
          is_received: true
        };
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // เชคส่งงานทุกคน (All Submitted)
  const handleMarkAllSubmitted = () => {
    setEditedSubmissions(prev => {
      const updated = { ...prev };
      submissions.forEach(sub => {
        updated[sub.id] = {
          ...updated[sub.id],
          status: 'submitted',
          is_received: true
        };
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // การจัดการรายกลุ่ม (Group Actions)
  const handleMarkGroupReceived = (targetGroup: string) => {
    setEditedSubmissions(prev => {
      const updated = { ...prev };
      submissions.forEach(sub => {
        if (sub.group_name === targetGroup) {
          updated[sub.id] = {
            ...updated[sub.id],
            is_received: true
          };
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleMarkGroupSubmitted = (targetGroup: string) => {
    setEditedSubmissions(prev => {
      const updated = { ...prev };
      submissions.forEach(sub => {
        if (sub.group_name === targetGroup) {
          updated[sub.id] = {
            ...updated[sub.id],
            status: 'submitted',
            is_received: true
          };
        }
      });
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // บันทึกการเปลี่ยนแปลงทั้งหมดแบบกลุ่ม (Batch Save)
  const handleSaveAll = async () => {
    if (!hasUnsavedChanges) return;
    setIsSavingBatch(true);
    try {
      const itemsToUpdate = Object.entries(editedSubmissions).map(([id, val]) => ({
        id,
        status: val.status,
        score: val.score,
        is_received: val.is_received,
        group_name: val.group_name,
        feedback: val.feedback
      }));

      await batchSaveSubmissions(itemsToUpdate, actualTeacherId || undefined);
      setHasUnsavedChanges(false);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'บันทึกสำเร็จ!',
        message: 'บันทึกสถานะการรับงาน การส่งงาน และคะแนนเรียบร้อยแล้ว'
      });
      fetchData();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'บันทึกไม่สำเร็จ',
        message: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      });
    } finally {
      setIsSavingBatch(false);
    }
  };

  // บันทึกคะแนนผ่าน Modal รายบุคคล
  const handleSaveIndividualModal = async (subId: string, payload: UpdateSubmissionDTO) => {
    setIsModalSaving(true);
    try {
      await updateSubmission(subId, {
        ...payload,
        checked_by: actualTeacherId || undefined
      });
      setIsModalOpen(false);
      setSelectedSubForModal(null);
      setAlertConfig({
        isOpen: true,
        type: 'success',
        title: 'บันทึกคะแนนสำเร็จ',
        message: 'บันทึกคะแนนและข้อเสนอแนะเรียบร้อยแล้ว'
      });
      fetchData();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถบันทึกได้'
      });
    } finally {
      setIsModalSaving(false);
    }
  };

  // คำนวณสรุปสถิติตามข้อมูลที่กำลังแก้ไข
  const currentTotal = submissions.length;
  let currentReceived = 0;
  let currentSubmitted = 0;
  let currentGraded = 0;
  let currentPending = 0;
  let totalScoreSum = 0;
  let scoredStudentCount = 0;

  submissions.forEach(sub => {
    const edit = editedSubmissions[sub.id] || { status: sub.status, score: sub.score, is_received: sub.is_received };
    if (edit.is_received) currentReceived += 1;
    if (edit.status === 'submitted') currentSubmitted += 1;
    else if (edit.status === 'graded') currentGraded += 1;
    else currentPending += 1;

    if (edit.score !== null && edit.score !== undefined) {
      totalScoreSum += edit.score;
      scoredStudentCount += 1;
    }
  });

  const avgScore = scoredStudentCount > 0 ? (totalScoreSum / scoredStudentCount).toFixed(1) : '-';
  const totalTurnedIn = currentSubmitted + currentGraded;
  const turnInRate = currentTotal > 0 ? Math.round((totalTurnedIn / currentTotal) * 100) : 0;
  const receiveRate = currentTotal > 0 ? Math.round((currentReceived / currentTotal) * 100) : 0;

  // กรองรายชื่อนักเรียน
  const filteredSubmissions = submissions.filter(sub => {
    const edit = editedSubmissions[sub.id] || { status: sub.status, is_received: sub.is_received, group_name: sub.group_name };
    const student = sub.student;
    const nameMatch = student
      ? `${student.first_name} ${student.last_name} ${student.student_code} ${student.nickname || ''} ${edit.group_name || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : false;

    // กรองสถานะ
    let statusMatch = true;
    if (statusFilter === 'received') statusMatch = !!edit.is_received;
    else if (statusFilter === 'not_received') statusMatch = !edit.is_received;
    else if (statusFilter === 'submitted') statusMatch = edit.status === 'submitted';
    else if (statusFilter === 'graded') statusMatch = edit.status === 'graded';

    // กรองกลุ่ม
    const groupMatch = selectedGroupFilter === 'ALL' || edit.group_name === selectedGroupFilter;

    return nameMatch && statusMatch && groupMatch;
  });

  const maxScore = assignment?.max_score ?? 10;
  const returnUrl = assignment 
    ? `/assignments/subject/${assignment.subject_id}/classroom/${assignment.classroom_id}` 
    : '/assignments';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-24">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={returnUrl}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับรายการงาน</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs">
              {assignment?.subject?.subject_code || 'วิชา'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {assignment?.title || 'กำลังโหลด...'}
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              ห้อง {assignment?.classroom?.level}/{assignment?.classroom?.room}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              assignment?.assignment_type === 'group'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
            }`}>
              {assignment?.assignment_type === 'group' ? (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>งานกลุ่ม</span>
                </>
              ) : (
                <span>งานเดี่ยว ({currentTotal} คน)</span>
              )}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>คะแนนเต็ม {maxScore}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleMarkAllReceived}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            title="เชครับงานทุกคนในห้อง"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>เชครับงานทุกคน</span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllSubmitted}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/80 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            title="เชคส่งงานทุกคนในห้อง"
          >
            <Send className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>เชคส่งงานทุกคน</span>
          </button>

          <button
            type="button"
            disabled={!hasUnsavedChanges || isSavingBatch}
            onClick={handleSaveAll}
            className={`min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSavingBatch ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Assigned */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            นักเรียนที่ได้รับมอบหมาย
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {currentTotal}
            </span>
            <span className="text-xs font-semibold text-slate-400">คน</span>
          </div>
        </div>

        {/* Received Count */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
            📥 รับงานแล้ว ({receiveRate}%)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {currentReceived}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {currentTotal} คน</span>
          </div>
        </div>

        {/* Submitted Count */}
        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block mb-1">
            📤 ส่งงานแล้ว ({turnInRate}%)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {totalTurnedIn}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {currentTotal} คน</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
            💯 คะแนนเฉลี่ย
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {avgScore}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ {maxScore}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 text-xs font-bold overflow-x-auto">
          {[
            { id: 'ALL', label: 'ทั้งหมด', count: currentTotal },
            { id: 'received', label: '📥 รับงานแล้ว', count: currentReceived },
            { id: 'not_received', label: '⏳ ยังไม่รับ', count: currentTotal - currentReceived },
            { id: 'submitted', label: '📤 ส่งแล้ว', count: currentSubmitted },
            { id: 'graded', label: '✓ ตรวจแล้ว', count: currentGraded }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Group Filter Dropdown if groups exist */}
        {availableGroups.length > 0 && (
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedGroupFilter}
              onChange={e => setSelectedGroupFilter(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">เลือกดูทุกกลุ่ม ({availableGroups.length} กลุ่ม)</option>
              {availableGroups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative sm:w-60">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ เลขที่ หรือกลุ่ม..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
          />
        </div>
      </div>

      {/* Student Grading List / Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">กำลังโหลดรายชื่อนักเรียน...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">ไม่พบรายชื่อนักเรียนตามเงื่อนไขที่เลือก</p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/80 dark:border-slate-800 shadow-md overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-3 sm:px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-3 sm:px-4">รหัส / นักเรียน</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-36">1. การรับงาน</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-40">2. การส่งงาน</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-36">3. คะแนน ({maxScore})</th>
                  <th className="py-3.5 px-3 sm:px-4 text-center w-20">ตรวจ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm font-medium">
                {filteredSubmissions.map((sub, idx) => {
                  const student = sub.student;
                  const currentEdit = editedSubmissions[sub.id] || {
                    status: sub.status,
                    score: sub.score,
                    is_received: sub.is_received,
                    group_name: sub.group_name
                  };
                  const scoreVal = currentEdit.score !== null && currentEdit.score !== undefined ? currentEdit.score : '';

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-amber-500/5 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {student?.student_code || '-'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {student ? `${student.first_name} ${student.last_name}` : 'นักเรียน'}
                            </span>
                            {student?.nickname && (
                              <span className="text-slate-400 text-xs ml-1">
                                ({student.nickname})
                              </span>
                            )}
                          </div>
                          {/* Group Badge */}
                          {currentEdit.group_name && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20">
                              👥 {currentEdit.group_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 1. Received Check Button */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleReceived(sub.id)}
                          className={`w-full min-h-[36px] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                            currentEdit.is_received
                              ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {currentEdit.is_received ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>รับงานแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>ยังไม่ได้รับ</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 2. Submitted Check Button */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(sub.id, 'pending')}
                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                              currentEdit.status === 'pending'
                                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            ยังไม่ส่ง
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSubmitted(sub.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              currentEdit.status === 'submitted' || currentEdit.status === 'graded'
                                ? 'bg-sky-500 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>ส่งแล้ว</span>
                          </button>
                        </div>
                      </td>

                      {/* 3. Inline Score Input */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={maxScore}
                            step="0.5"
                            value={scoreVal}
                            onChange={e => handleScoreChange(sub.id, e.target.value)}
                            placeholder="0"
                            className="w-16 min-h-[36px] text-center font-bold text-sm px-1.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleScoreChange(sub.id, String(maxScore))}
                            className="px-1.5 py-1 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                            title="ให้คะแนนเต็ม"
                          >
                            เต็ม
                          </button>
                        </div>
                      </td>

                      {/* 4. Feedback / Detail Modal */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubForModal({
                              ...sub,
                              status: currentEdit.status,
                              score: currentEdit.score,
                              is_received: currentEdit.is_received,
                              group_name: currentEdit.group_name,
                              feedback: currentEdit.feedback
                            });
                            setIsModalOpen(true);
                          }}
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-colors ${
                            currentEdit.feedback
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                          }`}
                          title={currentEdit.feedback || 'เพิ่มข้อเสนอแนะ'}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Floating Save Button on Mobile if changed */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            type="button"
            disabled={isSavingBatch}
            onClick={handleSaveAll}
            className="w-full min-h-[50px] px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-2xl flex items-center justify-center gap-2"
          >
            {isSavingBatch ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>บันทึกข้อมูลที่แก้ไขทั้งหมด</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Individual Grading Modal */}
      {selectedSubForModal && (
        <GradingModal
          isOpen={isModalOpen}
          submission={selectedSubForModal}
          maxScore={maxScore}
          onSave={handleSaveIndividualModal}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubForModal(null);
          }}
          isSaving={isModalSaving}
        />
      )}

      {/* Alert Modal */}
      <AssignmentAlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AssignmentGrading;
