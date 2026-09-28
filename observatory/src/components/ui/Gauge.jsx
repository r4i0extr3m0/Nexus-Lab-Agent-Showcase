import { cn } from '../../lib/cn'

const TONE_STROKE = {
  aurora: ['#7c5cff', '#a78bfa'],
  pulse: ['#22d3ee', '#67e8f9'],
  signal: ['#4ade80', '#86efac'],
  flare: ['#fbbf24', '#fcd34d'],
  alert: ['#f87171', '#fca5a5'],
}

export function Gauge({ value = 0, size = 108, thickness = 8, tone = 'aurora', label, sublabel }) {
  const clamped = Math.max(0, Math.min(1, value))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference * clamped
  const [from, to] = TONE_STROKE[tone] || TONE_STROKE.aurora
  const gradientId = `gauge-${tone}-${size}`

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className={cn('font-mono text-xl font-semibold text-star')}>
          {Math.round(clamped * 100)}
          <span className="text-[11px] text-star-faint">%</span>
        </span>
        {label ? <span className="kicker mt-0.5">{label}</span> : null}
        {sublabel ? <span className="text-[10px] text-star-faint">{sublabel}</span> : null}
      </div>
    </div>
  )
}
