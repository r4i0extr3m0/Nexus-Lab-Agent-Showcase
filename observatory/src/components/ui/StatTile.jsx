import { cn } from '../../lib/cn'

const TONES = {
  aurora: 'from-aurora/20 text-aurora-soft',
  pulse: 'from-pulse/20 text-pulse-soft',
  signal: 'from-signal/20 text-signal',
  flare: 'from-flare/20 text-flare',
  alert: 'from-alert/20 text-alert',
  star: 'from-white/10 text-star',
}

export function StatTile({ kicker, value, unit, hint, tone = 'star', icon: Icon, className }) {
  return (
    <div
      className={cn(
        'glass relative overflow-hidden bg-gradient-to-br to-transparent p-4',
        TONES[tone] ? TONES[tone].split(' ')[0] : '',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="kicker">{kicker}</p>
        {Icon ? <Icon size={15} className={cn('opacity-70', TONES[tone]?.split(' ')[1])} /> : null}
      </div>
      <p className={cn('mt-3 font-mono text-2xl font-semibold tracking-tight', TONES[tone]?.split(' ')[1])}>
        {value}
        {unit ? <span className="ml-1 text-[13px] font-normal text-star-faint">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-[11.5px] text-star-muted">{hint}</p> : null}
    </div>
  )
}
