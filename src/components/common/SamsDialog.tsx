import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, HelpCircle, AlertTriangle, X } from 'lucide-react'

export type SamsDialogVariant = 'info' | 'success' | 'warning' | 'danger'

export interface SamsConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: SamsDialogVariant
}

export interface SamsAlertOptions {
  title?: string
  message: string
  buttonText?: string
  variant?: SamsDialogVariant
}

interface InternalDialogItem {
  id: number
  mode: 'alert' | 'confirm'
  title: string
  message: string
  confirmText: string
  cancelText?: string
  variant: SamsDialogVariant
  resolve: (result: boolean) => void
}

type DialogListener = (queue: InternalDialogItem[]) => void

let dialogQueue: InternalDialogItem[] = []
let nextId = 1
const listeners = new Set<DialogListener>()

function notifyListeners() {
  const snapshot = [...dialogQueue]
  listeners.forEach(fn => fn(snapshot))
}

function enqueueDialog(item: Omit<InternalDialogItem, 'id'>) {
  dialogQueue.push({ ...item, id: nextId++ })
  notifyListeners()
}

function resolveCurrentDialog(result: boolean) {
  const current = dialogQueue.shift()
  if (current) {
    current.resolve(result)
    notifyListeners()
  }
}

export function samsConfirm(options: SamsConfirmOptions | string): Promise<boolean> {
  const opts: SamsConfirmOptions = typeof options === 'string' ? { message: options } : options
  return new Promise<boolean>((resolve) => {
    enqueueDialog({
      mode: 'confirm',
      title: opts.title || 'ยืนยันการดำเนินการ',
      message: opts.message,
      confirmText: opts.confirmText || 'ตกลง',
      cancelText: opts.cancelText || 'ยกเลิก',
      variant: opts.variant || 'info',
      resolve,
    })
  })
}

export function samsAlert(options: SamsAlertOptions | string): Promise<void> {
  const opts: SamsAlertOptions = typeof options === 'string' ? { message: options } : options
  const inferredVariant: SamsDialogVariant =
    opts.variant ||
    (/ผิดพลาด|ไม่สำเร็จ|ไม่พบ|ไม่สามารถ|ล้มเหลว|error/i.test(opts.message)
      ? 'danger'
      : /สำเร็จ|เรียบร้อย/i.test(opts.message)
      ? 'success'
      : 'info')

  const defaultTitle =
    opts.title ||
    (inferredVariant === 'danger'
      ? 'แจ้งเตือนข้อผิดพลาด'
      : inferredVariant === 'success'
      ? 'ดำเนินการสำเร็จ'
      : 'แจ้งเตือนจากระบบ SAMS')

  return new Promise<void>((resolve) => {
    enqueueDialog({
      mode: 'alert',
      title: defaultTitle,
      message: opts.message,
      confirmText: opts.buttonText || 'ตกลง',
      variant: inferredVariant,
      resolve: () => resolve(),
    })
  })
}

export function SamsDialogHost() {
  const [queue, setQueue] = useState<InternalDialogItem[]>(() => [...dialogQueue])

  useEffect(() => {
    const listener: DialogListener = (nextQueue) => setQueue(nextQueue)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const current = queue[0]
  if (!current) return null

  const themeMap: Record<
    SamsDialogVariant,
    {
      bar: string
      iconBg: string
      iconColor: string
      btnBg: string
      Icon: React.ComponentType<{ size?: number; className?: string }>
    }
  > = {
    info: {
      bar: 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500',
      iconBg: 'bg-indigo-100 border border-indigo-200',
      iconColor: 'text-indigo-600',
      btnBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/25',
      Icon: current.mode === 'confirm' ? HelpCircle : AlertCircle,
    },
    success: {
      bar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500',
      iconBg: 'bg-emerald-100 border border-emerald-200',
      iconColor: 'text-emerald-600',
      btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25',
      Icon: CheckCircle2,
    },
    warning: {
      bar: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500',
      iconBg: 'bg-amber-100 border border-amber-200',
      iconColor: 'text-amber-600',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25',
      Icon: AlertTriangle,
    },
    danger: {
      bar: 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-500',
      iconBg: 'bg-rose-100 border border-rose-200',
      iconColor: 'text-rose-600',
      btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25',
      Icon: AlertTriangle,
    },
  }

  const theme = themeMap[current.variant]
  const IconComp = theme.Icon

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => resolveCurrentDialog(false)}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className={`h-2 w-full ${theme.bar}`} />
        <button
          type="button"
          onClick={() => resolveCurrentDialog(false)}
          className="absolute right-4 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="ปิดหน้าต่าง"
        >
          <X size={18} />
        </button>

        <div className="p-7 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ${theme.iconBg}`}>
            <IconComp size={32} className={theme.iconColor} />
          </div>

          <h3 className="mb-2.5 text-xl font-extrabold text-slate-800">{current.title}</h3>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line text-left">
            {current.message}
          </div>

          <div className="mt-6 flex items-center gap-3">
            {current.mode === 'confirm' && (
              <button
                type="button"
                onClick={() => resolveCurrentDialog(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                {current.cancelText || 'ยกเลิก'}
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={() => resolveCurrentDialog(true)}
              className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all ${theme.btnBg}`}
            >
              {current.confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
