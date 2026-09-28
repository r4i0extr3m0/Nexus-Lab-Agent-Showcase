import { Hexagon } from 'lucide-react'
import { cn } from '../../lib/cn'

export function NexusMark({ size = 34, className }) {
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center rounded-xl border border-aurora/40 bg-gradient-to-br from-aurora/25 via-pulse/10 to-transparent text-pulse-soft shadow-glow',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Hexagon size={size * 0.52} strokeWidth={1.8} />
      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-pulse animate-pulse-ring" />
    </span>
  )
}
