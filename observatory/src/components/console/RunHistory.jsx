import { Activity, Trash2 } from 'lucide-react'
import { ROUTE_META } from '../../runtime/router'
import { cn } from '../../lib/cn'
import { formatMs, truncate } from '../../lib/format'
import { Panel, PanelHeader } from '../ui/Panel'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'

export function RunHistory({ runs, activeRunId, onSelect, onClear, onOpenTrace, className }) {
  return (
    <Panel className={cn('panel-pad', className)}>
      <PanelHeader
        kicker="Histórico"
        title="Execuções"
        icon={Activity}
        actions={
          runs.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="focus-ring grid h-8 w-8 place-items-center rounded-lg border border-panel-edge/70 bg-white/5 text-star-faint transition hover:border-alert/40 hover:text-alert"
              aria-label="Limpar histórico"
            >
              <Trash2 size={14} />
            </button>
          ) : null
        }
      />
      <div className="mt-4 space-y-2">
        {runs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Sem execuções"
            description="Envie uma requisição no console para começar a observar o agente."
          />
        ) : (
          runs.map((run) => {
            const meta = ROUTE_META[run.agent] || ROUTE_META.core
            const active = run.requestId === activeRunId
            return (
              <button
                key={run.requestId}
                type="button"
                onClick={() => onSelect(run.requestId)}
                onDoubleClick={() => onOpenTrace?.(run.requestId)}
                className={cn(
                  'focus-ring w-full rounded-xl border px-3 py-2.5 text-left transition',
                  active
                    ? 'border-aurora/40 bg-aurora/5'
                    : 'border-panel-edge/60 bg-white/5 hover:border-panel-edge',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={meta.accent}>{meta.label}</Badge>
                  <span
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-[0.14em]',
                      run.status === 'SUCCESS' ? 'text-signal' : 'text-alert',
                    )}
                  >
                    {run.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] text-star-muted">
                  {truncate(run.prompt, 90)}
                </p>
                <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-star-faint">
                  <span>{run.toolCalls.length} tools</span>
                  <span>{formatMs(run.latencyMs)}</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </Panel>
  )
}
