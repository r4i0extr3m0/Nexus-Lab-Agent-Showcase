import { cn } from '../../lib/cn'

export function Panel({ className, children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={cn('glass', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function PanelHeader({ kicker, title, description, actions, icon: Icon, className }) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-panel-edge bg-white/5 text-pulse">
            <Icon size={17} strokeWidth={1.8} />
          </span>
        ) : null}
        <div>
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h2 className="text-[15px] font-semibold tracking-tight text-star">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-star-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
