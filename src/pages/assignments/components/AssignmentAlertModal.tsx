import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'confirm' | 'info';

export interface AssignmentAlertModalProps {
  isOpen: boolean;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  isPending?: boolean;
}

export const AssignmentAlertModal: React.FC<AssignmentAlertModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  onConfirm,
  onClose,
  isPending = false
}) => {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  // Config ไอคอนและสีตามประเภทของการแจ้งเตือน
  const iconConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
    },
    confirm: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/20',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
    }
  }[type];

  const IconComponent = iconConfig.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop with Glassmorphism */}
      <div 
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" 
        onClick={!isPending ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button (เฉพาะกรณีไม่ใช่ระหว่างรอ confirm) */}
        {!isPending && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Circle */}
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl border ${iconConfig.bgColor} flex items-center justify-center shadow-inner`}>
          <IconComponent className={`w-8 h-8 ${iconConfig.iconColor}`} />
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-line">
          {message}
        </p>

        {/* Buttons Action */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
          {isConfirm && (
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="w-full sm:w-1/2 min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm || onClose}
            className={`w-full ${isConfirm ? 'sm:w-1/2' : 'w-full'} min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${iconConfig.btnColor}`}
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

