import React, { useState, useEffect } from 'react';
import { X, Award, MessageSquare, Check, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { AssignmentSubmission, UpdateSubmissionDTO, SubmissionStatus } from '../../../types/assignment';

export interface GradingModalProps {
  isOpen: boolean;
  submission: AssignmentSubmission | null;
  maxScore: number;
  onSave: (id: string, payload: UpdateSubmissionDTO) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  isOpen,
  submission,
  maxScore,
  onSave,
  onClose,
  isSaving = false
}) => {
  const [status, setStatus] = useState<SubmissionStatus>('pending');
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (submission) {
      setStatus(submission.status || 'pending');
      setScore(submission.score !== null && submission.score !== undefined ? String(submission.score) : '');
      setFeedback(submission.feedback || '');
    } else {
      setStatus('pending');
      setScore('');
      setFeedback('');
    }
    setErrorMsg('');
  }, [submission, isOpen]);

  if (!isOpen || !submission) return null;

  const handleStatusChange = (newStatus: SubmissionStatus) => {
    setStatus(newStatus);
    // หากเลือกตรวจแล้วและยังไม่มีคะแนน ให้กรอกคะแนนเต็มเป็นค่าเริ่มต้นให้สะดวก
    if (newStatus === 'graded' && !score) {
      setScore(String(maxScore));
    }
  };

  const handleQuickScore = (val: number) => {
    setScore(String(val));
    if (status === 'pending') {
      setStatus('graded');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = score !== '' ? parseFloat(score) : null;

    if (numScore !== null) {
      if (isNaN(numScore) || numScore < 0) {
        setErrorMsg('คะแนนต้องไม่น้อยกว่า 0');
        return;
      }
      if (numScore > maxScore) {
        setErrorMsg(`คะแนนต้องไม่เกินคะแนนเต็ม (${maxScore} คะแนน)`);
        return;
      }
    }

    try {
      await onSave(submission.id, {
        status,
        score: numScore,
        feedback: feedback.trim() || null
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกคะแนน');
    }
  };

  const studentName = submission.student 
    ? `${submission.student.first_name} ${submission.student.last_name}` 
    : 'นักเรียน';

  const statusOptions: { value: SubmissionStatus; label: string; icon: any; color: string }[] = [
    {
      value: 'pending',
      label: 'ยังไม่ส่ง',
      icon: Clock,
      color: status === 'pending'
        ? 'border-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-2 ring-slate-500/30'
        : 'border-slate-200 dark:border-slate-700 text-slate-500'
    },
    {
      value: 'submitted',
      label: 'ส่งแล้ว (รอตรวจ)',
      icon: AlertCircle,
      color: status === 'submitted'
        ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-400 ring-2 ring-sky-500/30'
        : 'border-slate-200 dark:border-slate-700 text-slate-500'
    },
    {
      value: 'late',
      label: 'ส่งช้า',
      icon: Clock,
      color: status === 'late'
        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/30'
        : 'border-slate-200 dark:border-slate-700 text-slate-500'
    },
    {
      value: 'graded',
      label: 'ตรวจแล้ว',
      icon: CheckCircle,
      color: status === 'graded'
        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/30'
        : 'border-slate-200 dark:border-slate-700 text-slate-500'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={!isSaving ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-5 sm:p-7 my-auto text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Student Info */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold mb-1">
              รหัส: {submission.student?.student_code || '-'}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {studentName}
              {submission.student?.nickname && (
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm ml-1.5">
                  ({submission.student.nickname})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              สถานะการส่งงาน
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusChange(opt.value)}
                    className={`min-h-[44px] p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${opt.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>คะแนนที่ได้ (เต็ม {maxScore})</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickScore(maxScore)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                >
                  เต็ม ({maxScore})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickScore(maxScore / 2)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  ครึ่ง ({maxScore / 2})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickScore(0)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                >
                  0
                </button>
              </div>
            </div>
            <input
              type="number"
              min="0"
              max={maxScore}
              step="0.5"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder={`กรอกคะแนน 0 - ${maxScore}`}
              className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold"
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>คำแนะนำ / หมายเหตุจากครูผู้สอน</span>
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="เช่น ลายมือเรียบร้อยดีมาก, แก้ไขข้อ 2 อีกครั้ง..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกคะแนน</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

