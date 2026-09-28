import { cn } from '../../lib/cn'

const TONES = {
  aurora: 'border-aurora/40 bg-aurora/10 text-aurora-soft',
  pulse: 'border-pulse/40 bg-pulse/10 text-pulse-soft',
  signal: 'border-signal/40 bg-signal/10 text-signal',
  flare: 'border-flare/40 bg-flare/10 text-flare',
  alert: 'border-alert/40 bg-alert/10 text-alert',
  star: 'border-panel-edge bg-white/5 text-star-muted',
}

export function Badge({ tone = 'star', children, className, icon: Icon, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em]',
        TONES[tone] || TONES.star,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {Icon ? <Icon size={12} strokeWidth={2} /> : null}
      {children}
    </span>
  )
}
