import { Menu, Settings, Sparkles } from 'lucide-react'
import { Badge } from '../ui/Badge'

export function TopBar({ view, onOpenMobileNav, onOpenSettings, runsCount }) {
  return (
    <header className="sticky top-0 z-20 border-b border-panel-edge/60 bg-void/70 px-4 py-3.5 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-panel-edge/70 bg-white/5 text-star-muted lg:hidden"
            aria-label="Abrir navegação"
          >
            <Menu size={16} />
          </button>
          <div className="min-w-0">
            <p className="kicker flex items-center gap-1.5">
              <Sparkles size={11} className="text-pulse" />
              Observatory
            </p>
            <h1 className="truncate text-[16px] font-semibold tracking-tight text-star">
              {view?.label}
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Badge tone="pulse" dot>
            deterministic planner
          </Badge>
          <Badge tone="signal">sandbox read-only</Badge>
          <span className="font-mono text-[11px] text-star-faint">{runsCount} runs</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-panel-edge/70 bg-white/5 text-star-muted transition hover:border-aurora/40 hover:text-star"
          aria-label="Ajustes"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  )
}
