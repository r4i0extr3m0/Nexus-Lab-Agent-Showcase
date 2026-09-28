import { cn } from '../../lib/cn'

const TONE_BAR = {
  aurora: 'from-aurora to-aurora-soft',
  pulse: 'from-pulse to-pulse-soft',
  signal: 'from-signal to-emerald-300',
  flare: 'from-flare to-amber-300',
  alert: 'from-alert to-rose-300',
  star: 'from-star-muted to-star',
}

export function BarChart({ data, valueFormatter = (value) => value, className }) {
  const max = Math.max(1, ...data.map((item) => item.value))
  return (
    <div className={cn('space-y-2.5', className)}>
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="min-w-[92px] font-mono text-[11px] text-star-muted">{item.label}</span>
          <span className="relative h-2 overflow-hidden rounded-full bg-white/5">
            <span
              className={cn(
                'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out',
                TONE_BAR[item.tone] || TONE_BAR.pulse,
              )}
              style={{ width: `${Math.max(3, (item.value / max) * 100)}%` }}
            />
          </span>
          <span className="w-10 text-right font-mono text-[11px] text-star">
            {valueFormatter(item.value)}
          </span>
        </div>
      ))}
      {data.length === 0 ? (
        <p className="font-mono text-[11px] text-star-faint">sem dados ainda</p>
      ) : null}
    </div>
  )
}
