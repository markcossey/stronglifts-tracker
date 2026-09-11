import type { LiftStatus } from '../model/types'

const statusConfig: Record<LiftStatus, { bg: string; text: string; label: string }> = {
  progressing: { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Progressing' },
  failed: { bg: 'bg-amber-900/50', text: 'text-amber-400', label: 'Failed' },
  stalled: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Stalled' },
  deloading: { bg: 'bg-[#1a4a16]/50', text: 'text-[#47c23f]', label: 'Deloading' },
}

interface StatusBadgeProps {
  status: LiftStatus
  failureCount?: number
}

export default function StatusBadge({ status, failureCount }: StatusBadgeProps) {
  const config = statusConfig[status]
  const label = (status === 'failed' || status === 'stalled') && failureCount
    ? `${config.label} (${failureCount}/3)`
    : config.label

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {label}
    </span>
  )
}
