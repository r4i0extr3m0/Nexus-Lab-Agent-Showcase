import { Cpu, Settings, ShieldCheck } from 'lucide-react'
import { APP, NAV_ITEMS } from '../../config/nav'
import { cn } from '../../lib/cn'
import { NexusMark } from './NexusMark'

export function Sidebar({ activeView, onNavigate, onOpenSettings, runsCount }) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-6 border-r border-panel-edge/70 bg-void-deep/70 px-4 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-1">
        <NexusMark size={38} />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold tracking-tight text-star">{APP.name}</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-star-faint">
            {APP.tagline}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <p className="kicker px-2 pb-1">Painéis</p>
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                'focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                active
                  ? 'bg-gradient-to-r from-aurora/20 via-aurora/5 to-transparent text-star'
                  : 'text-star-muted hover:bg-white/5 hover:text-star',
              )}
            >
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full transition',
                  active ? 'bg-gradient-to-b from-pulse to-aurora' : 'bg-transparent',
                )}
              />
              <item.icon
                size={17}
                strokeWidth={1.8}
                className={cn('transition', active ? 'text-pulse-soft' : 'text-star-faint group-hover:text-star-muted')}
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium">{item.label}</span>
                <span className="block truncate text-[10.5px] text-star-faint">{item.hint}</span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="glass space-y-3 rounded-2xl p-3.5">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-aurora-soft" />
          <span className="kicker">Runtime</span>
        </div>
        <p className="font-mono text-[11px] leading-relaxed text-star-muted">{APP.runtime}</p>
        <div className="hairline pt-3">
          <div className="flex items-center justify-between font-mono text-[10.5px] text-star-faint">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-signal" />
              offline-safe
            </span>
            <span>{runsCount} runs</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="focus-ring flex items-center gap-2 rounded-xl border border-panel-edge/70 bg-white/5 px-3 py-2.5 text-[12px] text-star-muted transition hover:border-aurora/40 hover:text-star"
      >
        <Settings size={15} />
        Ajustes da sessão
      </button>
    </aside>
  )
}
