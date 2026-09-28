export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-panel-edge/80 bg-void-deep/40 px-6 py-12 text-center">
      {Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-panel-edge bg-white/5 text-aurora-soft">
          <Icon size={20} strokeWidth={1.7} />
        </span>
      ) : null}
      <p className="mt-4 text-[13.5px] font-semibold text-star">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-star-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
