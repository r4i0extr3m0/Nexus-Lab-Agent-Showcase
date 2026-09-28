import { cn } from '../../lib/cn'

const TONE_FILL = {
  aurora: 'from-aurora to-aurora-soft',
  pulse: 'from-pulse to-pulse-soft',
  signal: 'from-signal to-emerald-300',
  flare: 'from-flare to-amber-300',
  alert: 'from-alert to-rose-300',
  star: 'from-star-muted to-star',
}

export function ProgressBar({ value = 0, tone = 'pulse', className }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <span className={cn('relative block h-1.5 overflow-hidden rounded-full bg-white/5', className)}>
      <span
        className={cn('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out', TONE_FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </span>
  )
}
