import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Calendar, Award, FileText, Users, User, Search, CheckSquare, Square, Layers, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { compareStudentsByRosterOrder } from '../../../services/studentService';
import type { Assignment, CreateAssignmentDTO, UpdateAssignmentDTO, AssignmentType } from '../../../types/assignment';

export interface AssignmentFormModalProps {
  isOpen: boolean;
  initialData?: Assignment | null;
  subjectId: string;
  classroomId: string;
  subjectName?: string;
  classroomLabel?: string;
  academicYearId?: string | null;
  semesterId?: string | null;
  teacherId?: string | null;
  onSubmit: (data: CreateAssignmentDTO | UpdateAssignmentDTO) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface ClassroomStudent {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  gender?: string | null;
}

export const AssignmentFormModal: React.FC<AssignmentFormModalProps> = ({
  isOpen,
  initialData,
  subjectId,
  classroomId,
  subjectName,
  classroomLabel,
  academicYearId,
  semesterId,
  teacherId,
  onSubmit,
  onClose,
  isSubmitting = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState<number>(10);
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('individual');
  const [assignScope, setAssignScope] = useState<'all' | 'custom'>('all');
  const [groupName, setGroupName] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<ClassroomStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ฟอร์แมตวันเวลาเป็น format ที่ input type="datetime-local" รองรับ (YYYY-MM-DDTHH:mm)
  const formatForDateTimeInput = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // ดึงรายชื่อนักเรียนในห้องเรียน
  useEffect(() => {
    if (!isOpen || !classroomId) return;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, student_code, prefix, first_name, last_name, nickname, gender')
          .eq('classroom_id', classroomId)
          .is('deleted_at', null)
          .order('student_code', { ascending: true });

        if (!error && data) {
          setStudents([...data].sort(compareStudentsByRosterOrder));
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [isOpen, classroomId]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setMaxScore(initialData.max_score ?? 10);
      setDueDate(formatForDateTimeInput(initialData.due_date));
      setAssignmentType(initialData.assignment_type || 'individual');
      setAssignScope('all');
      setGroupName('');
      setSelectedStudentIds([]);
    } else {
      setTitle('');
      setDescription('');
      setMaxScore(10);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      defaultDate.setHours(23, 59, 0, 0);
      setDueDate(formatForDateTimeInput(defaultDate.toISOString()));
      setAssignmentType('individual');
      setAssignScope('all');
      setGroupName('');
      setSelectedStudentIds([]);
    }
    setErrorMsg('');
    setStudentSearch('');
  }, [initialData, isOpen]);

  // กรองรายชื่อนักเรียนตามคำค้นหา
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.student_code.toLowerCase().includes(q) ||
      (s.nickname && s.nickname.toLowerCase().includes(q))
    );
  }, [students, studentSearch]);

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearSelected = () => {
    setSelectedStudentIds([]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกหัวข้อชิ้นงาน / การบ้าน');
      return;
    }
    if (maxScore <= 0) {
      setErrorMsg('คะแนนเต็มต้องมากกว่า 0');
      return;
    }

    // ตรวจสอบกรณีงานกลุ่ม
    if (assignmentType === 'group' && !groupName.trim()) {
      setErrorMsg('กรุณาระบุชื่อกลุ่ม หรือกลุ่มที่ (เช่น กลุ่มที่ 1 หรือ กลุ่มทดลอง A)');
      return;
    }

    // ตรวจสอบการเลือกนักเรียน
    const needsStudentSelection = assignmentType === 'group' || (assignmentType === 'individual' && assignScope === 'custom');
    if (needsStudentSelection && selectedStudentIds.length === 0) {
      setErrorMsg('กรุณาเลือกนักเรียนอย่างน้อย 1 คน ที่ได้รับมอบหมายงานชิ้นนี้');
      return;
    }

    try {
      if (initialData) {
        // แก้ไข
        await onSubmit({
          title: title.trim(),
          description: description.trim() || null,
          max_score: Number(maxScore),
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignment_type: assignmentType,
          group_name: assignmentType === 'group' ? groupName.trim() : null
        });
      } else {
        // สร้างใหม่
        await onSubmit({
          academic_year_id: academicYearId || null,
          semester_id: semesterId || null,
          subject_id: subjectId,
          classroom_id: classroomId,
          teacher_id: teacherId || null,
          title: title.trim(),
          description: description.trim() || null,
          max_score: Number(maxScore),
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assignment_type: assignmentType,
          student_ids: needsStudentSelection ? selectedStudentIds : undefined,
          group_name: assignmentType === 'group' ? groupName.trim() : null
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const showStudentPicker = assignmentType === 'group' || (assignmentType === 'individual' && assignScope === 'custom');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-5 sm:p-7 text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {initialData ? 'แก้ไขชิ้นงาน / การบ้าน' : 'สั่งงานใหม่ (มอบหมายงาน)'}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {subjectName || 'วิชา'} · ห้อง {classroomLabel || 'ห้องเรียน'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              หัวข้อชิ้นงาน / ชื่องาน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="เช่น ใบงานที่ 1 การเขียนโปรแกรม หรือ โครงงานสิ่งประดิษฐ์"
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>คำอธิบาย / คำสั่งการทำงาน</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="ระบุคำสั่ง รูปแบบชิ้นงาน หรือเกณฑ์การส่งงาน..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium resize-none"
            />
          </div>

          {/* Grid: Max Score & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>คะแนนเต็ม <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={maxScore}
                onChange={e => setMaxScore(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>กำหนดส่ง</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Assignment Type Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ประเภทงาน
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssignmentType('individual')}
                  className={`min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                    assignmentType === 'individual'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>งานเดี่ยว (รายบุคคล)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignmentType('group');
                    if (!groupName) setGroupName('กลุ่มที่ 1');
                  }}
                  className={`min-h-[44px] p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all ${
                    assignmentType === 'group'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>งานกลุ่ม</span>
                </button>
              </div>
            </div>

            {/* Scope Selection for Individual */}
            {assignmentType === 'individual' && !initialData && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  ขอบเขตการมอบหมายงาน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignScope('all');
                      setSelectedStudentIds([]);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      assignScope === 'all'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ทุกคนทั้งห้อง ({students.length} คน)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignScope('custom')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                      assignScope === 'custom'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    เลือกเฉพาะนักเรียน ({selectedStudentIds.length} คน)
                  </button>
                </div>
              </div>
            )}

            {/* Group Name input for Group Assignment */}
            {assignmentType === 'group' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อกลุ่ม / กลุ่มที่ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="เช่น กลุ่มที่ 1 หรือ กลุ่มพลังงานสะอาด"
                    className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                  เลือกสมาชิกด้านล่าง เพื่อระบุว่านักเรียนคนใดบ้างที่อยู่ในกลุ่มนี้
                </p>
              </div>
            )}
          </div>

          {/* Student Picker Checklist (Show when Custom Individual or Group) */}
          {showStudentPicker && !initialData && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 bg-slate-50/50 dark:bg-slate-850/50 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {assignmentType === 'group' ? 'เลือกสมาชิกในกลุ่มนี้' : 'เลือกนักเรียนที่มอบหมาย'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-black">
                    เลือกแล้ว {selectedStudentIds.length} / {students.length} คน
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-100"
                  >
                    เลือกทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-50"
                  >
                    ล้าง
                  </button>
                </div>
              </div>

              {/* Search in student checklist */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ หรือเลขประจำตัว..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Student List */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                {loadingStudents ? (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">
                    กำลังโหลดรายชื่อนักเรียน...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">
                    ไม่พบข้อมูลนักเรียน
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const isChecked = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => handleToggleStudent(student.id)}
                        className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-500/10 dark:bg-amber-500/15'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                          )}
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {student.student_code}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {student.first_name} {student.last_name}
                          </span>
                          {student.nickname && (
                            <span className="text-[11px] text-slate-400">
                              ({student.nickname})
                            </span>
                          )}
                        </div>
                        {isChecked && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                            เลือกแล้ว
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>{initialData ? 'บันทึกการแก้ไข' : 'บันทึกสั่งงาน'}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AssignmentFormModal;
