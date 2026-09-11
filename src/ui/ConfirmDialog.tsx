import type { ReactNode } from 'react'
import Button from './Button'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-gray-800"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-100">{title}</h3>
        <div className="text-gray-400 space-y-2">{children}</div>
        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} fullWidth onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
