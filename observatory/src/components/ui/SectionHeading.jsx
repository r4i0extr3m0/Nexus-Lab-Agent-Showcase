import { cn } from '../../lib/cn'

export function SectionHeading({ kicker, title, action, className }) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h3 className="mt-1 text-[13px] font-semibold tracking-tight text-star">{title}</h3>
      </div>
      {action}
    </div>
  )
}
