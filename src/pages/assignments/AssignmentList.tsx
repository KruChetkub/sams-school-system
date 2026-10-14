import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Award,
  Users,
  User,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertCircle,
  FileCheck,
  ChevronRight,
  BookOpen,
  Search,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAcademicYearStore } from '../../store/academicYearStore';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} from '../../services/assignmentService';
import { supabase } from '../../lib/supabase';
import type { Assignment, CreateAssignmentDTO, UpdateAssignmentDTO } from '../../types/assignment';
import { AssignmentFormModal } from './components/AssignmentFormModal';
import { AssignmentAlertModal } from './components/AssignmentAlertModal';

export const AssignmentList: React.FC = () => {
  const { subjectId, classroomId } = useParams<{ subjectId: string; classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedYear, selectedSemester } = useAcademicYearStore();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<{ code: string; name: string } | null>(null);
  const [classroomInfo, setClassroomInfo] = useState<{ level: string; room: string } | null>(null);
  const [currentTeacherId, setCurrentTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ตัวกรองแยกประเภทงาน (ทั้งหมด / งานเดี่ยว / งานกลุ่ม) และช่องค้นหา
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'group'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // ดึง ID ครูที่ถูกต้องจากตาราง teachers
  useEffect(() => {
    const resolveTeacher = async () => {
      if (!user?.id) return;
      try {
        const { data: teacherProfile } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (teacherProfile) {
          setCurrentTeacherId(teacherProfile.id);
          return;
        }

        if (subjectId && classroomId) {
          const { data: sched } = await supabase
            .from('schedules')
            .select('teacher_id')
            .eq('subject_id', subjectId)
            .eq('classroom_id', classroomId)
            .not('teacher_id', 'is', null)
            .maybeSingle();
          if (sched?.teacher_id) {
            setCurrentTeacherId(sched.teacher_id);
          }
        }
      } catch (err) {
        console.warn('Could not resolve teacher profile:', err);
      }
    };
    resolveTeacher();
  }, [user?.id, subjectId, classroomId]);

  // Form Modal State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert & Confirm Modal State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssignments = async () => {
    if (!subjectId || !classroomId) return;
    setLoading(true);
    try {
      // 1. ดึงข้อมูลวิชา
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('subject_code, subject_name')
        .eq('id', subjectId)
        .single();
      if (subjectData) {
        setSubjectInfo({ code: subjectData.subject_code, name: subjectData.subject_name });
      }

      // 2. ดึงข้อมูลห้องเรียน
      const { data: classroomData } = await supabase
        .from('classrooms')
        .select('level, room')
        .eq('id', classroomId)
        .single();
      if (classroomData) {
        setClassroomInfo({ level: classroomData.level, room: classroomData.room });
      }

      // 3. ดึงรายการงาน
      const data = await getAssignments({
        subjectId,
        classroomId,
        academicYearId: selectedYear?.id,
        semesterId: selectedSemester?.id
      });
      setAssignments(data);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [subjectId, classroomId, selectedYear?.id, selectedSemester?.id]);

  // จัดการการบันทึกงาน (สร้างใหม่ หรือ แก้ไข)
  const handleSaveAssignment = async (data: CreateAssignmentDTO | UpdateAssignmentDTO) => {
    setIsSubmitting(true);
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment.id, data as UpdateAssignmentDTO);
        setAlertConfig({
          isOpen: true,
          type: 'success',
          title: 'แก้ไขงานสำเร็จ',
          message: 'บันทึกการเปลี่ยนแปลงรายละเอียดงานเรียบร้อยแล้ว'
        });
      } else {
        await createAssignment(data as CreateAssignmentDTO);
        setAlertConfig({
          isOpen: true,
          type: 'success',
          title: 'สั่งงานใหม่สำเร็จ',
          message: 'สร้างงานและเตรียมรายชื่อนักเรียนสำหรับเช็คงานเรียบร้อยแล้ว'
        });
      }
      setIsFormOpen(false);
      setEditingAssignment(null);
      fetchAssignments();
    } catch (err: any) {
      setAlertConfig({
        isOpen: true,
        type: 'error',
        title: 'เกิดข้อผิดพลาด',
        message: err.message || 'ไม่สามารถบันทึกข้อมูลได้'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // จัดการการลบงาน
  const handleConfirmDelete = (assignment: Assignment) => {
    setAlertConfig({
      isOpen: true,
      type: 'confirm',
      title: 'ยืนยันการลบชิ้นงาน?',
      message: `คุณต้องการลบ "${assignment.title}" ออกจากระบบใช่หรือไม่?\n\n(ข้อมูลการส่งงานและคะแนนของนักเรียนในชิ้นงานนี้จะถูกลบออกทั้งหมด)`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          await deleteAssignment(assignment.id);
          setAlertConfig({
            isOpen: true,
            type: 'success',
            title: 'ลบชิ้นงานเรียบร้อย',
            message: 'ลบชิ้นงานและข้อมูลการส่งงานสำเร็จ'
          });
          fetchAssignments();
        } catch (err: any) {
          setAlertConfig({
            isOpen: true,
            type: 'error',
            title: 'ไม่สามารถลบได้',
            message: err.message || 'เกิดข้อผิดพลาดในการลบชิ้นงาน'
          });
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const classroomLabel = classroomInfo ? `${classroomInfo.level}/${classroomInfo.room}` : '';

  // สรุปยอดจำนวนงานตามประเภท
  const individualCount = useMemo(() => {
    return assignments.filter(a => a.assignment_type === 'individual').length;
  }, [assignments]);

  const groupCount = useMemo(() => {
    return assignments.filter(a => a.assignment_type === 'group').length;
  }, [assignments]);

  // กรองรายการงานตามประเภทและคำค้นหา
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const typeMatch = filterType === 'all' || a.assignment_type === filterType;
      const q = searchTerm.toLowerCase().trim();
      const searchMatch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q));
      return typeMatch && searchMatch;
    });
  }, [assignments, filterType, searchTerm]);

  // ฟังก์ชันจัดรูปแบบวันส่ง
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return 'ไม่กำหนดวันส่ง';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              to="/assignments"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับหน้ารวมวิชา</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-black text-xs">
              {subjectInfo?.code || '...'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {subjectInfo?.name || 'กำลังโหลดวิชา...'}
            </h2>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              ห้อง {classroomLabel}
            </span>
          </div>
        </div>

        {/* Create Assignment Button */}
        <button
          type="button"
          onClick={() => {
            setEditingAssignment(null);
            setIsFormOpen(true);
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>สั่งงานใหม่</span>
        </button>
      </div>

      {/* Category Filter Tabs & Search */}
      {assignments.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>งานทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                {assignments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('individual')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                filterType === 'individual'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>งานเดี่ยว</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-mono">
                {individualCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('group')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                filterType === 'group'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>งานกลุ่ม</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 text-[10px] font-mono">
                {groupCount}
              </span>
            </button>
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่องาน..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
            />
          </div>
        </div>
      )}

      {/* Assignment List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">กำลังโหลดรายการชิ้นงาน...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-8 sm:p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <FileCheck className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white">ยังไม่มีการสั่งงานในห้องนี้</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            เริ่มต้นมอบหมายงาน การบ้าน หรือชิ้นงานแรกให้แก่นักเรียนห้อง {classroomLabel} ได้เลย
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingAssignment(null);
              setIsFormOpen(true);
            }}
            className="mt-5 min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>สั่งงานใหม่ตอนนี้</span>
          </button>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <FileCheck className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-500">ไม่พบชิ้นงานในหมวดหมู่นี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            <span>
              {filterType === 'all' ? 'ชิ้นงานทั้งหมด' : filterType === 'individual' ? 'งานเดี่ยว' : 'งานกลุ่ม'} {filteredAssignments.length} รายการ
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map((assignment) => {
              const originalIndex = assignments.findIndex(a => a.id === assignment.id) + 1;
              const summary = assignment.submissions_summary || { total: 0, submitted: 0, graded: 0, pending: 0, late: 0 };
              const totalHandedIn = summary.submitted + summary.graded + summary.late;
              const percentHandedIn = summary.total > 0 ? Math.round((totalHandedIn / summary.total) * 100) : 0;

              return (
                <div
                  key={assignment.id}
                  className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/80 dark:border-slate-800 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left: Title, Description, Meta badges */}
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Number badge: งานที่ 1, งานที่ 2 ... */}
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center gap-1 border border-amber-500/30">
                          งานที่ {originalIndex}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>{assignment.max_score} คะแนน</span>
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 ${
                          assignment.assignment_type === 'group'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {assignment.assignment_type === 'group' ? (
                            <>
                              <Users className="w-3.5 h-3.5 text-amber-500" />
                              <span>งานกลุ่ม ({summary.total} คน)</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              <span>งานเดี่ยว ({summary.total} คน)</span>
                            </>
                          )}
                        </span>

                        {assignment.due_date && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>กำหนดส่ง: {formatDueDate(assignment.due_date)}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                        {assignment.title}
                      </h3>

                      {assignment.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    {/* Middle: Submission Rate Progress Bar */}
                    <div className="w-full lg:w-60 p-3 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300">ส่งงานแล้ว</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono">
                          {totalHandedIn} / {summary.total} ({percentHandedIn}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentHandedIn}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>ตรวจแล้ว: {summary.graded}</span>
                        <span className="text-rose-500">ค้างส่ง: {summary.pending}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 pt-2 lg:pt-0 shrink-0">
                      {/* Check / Grade Button */}
                      <Link
                        to={`/assignments/${assignment.id}/grading`}
                        className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>เช็คงาน & ให้คะแนน</span>
                      </Link>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setIsFormOpen(true);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="แก้ไขรายละเอียดงาน"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(assignment)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors"
                        title="ลบงาน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      {subjectId && classroomId && (
        <AssignmentFormModal
          isOpen={isFormOpen}
          initialData={editingAssignment}
          subjectId={subjectId}
          classroomId={classroomId}
          subjectName={subjectInfo?.name}
          classroomLabel={classroomLabel}
          academicYearId={selectedYear?.id}
          semesterId={selectedSemester?.id}
          teacherId={currentTeacherId || undefined}
          onSubmit={handleSaveAssignment}
          onClose={() => {
            setIsFormOpen(false);
            setEditingAssignment(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Alert & Confirm Modal */}
      <AssignmentAlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        isPending={isDeleting}
      />
    </div>
  );
};

export default AssignmentList;

