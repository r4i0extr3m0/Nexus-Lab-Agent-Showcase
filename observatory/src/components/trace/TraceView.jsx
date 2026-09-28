import { Activity, ChevronDown } from 'lucide-react'
import { useObservatory } from '../../state/store'
import { ROUTE_META } from '../../runtime/router'
import { formatDateTime, statusTone, truncate } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Panel, PanelHeader } from '../ui/Panel'
import { TraceSummary } from './TraceSummary'
import { TraceTimeline } from './TraceTimeline'

export function TraceView({ onGoToMission }) {
  const { activeRun, runs, activeRunId, setActiveRunId } = useObservatory()

  if (!activeRun) {
    return (
      <EmptyState
        icon={Activity}
        title="Nenhum trace selecionado"
        description="Execute uma requisição no Mission Control para inspecionar o rastro completo de execução."
        action={
          <button
            type="button"
            onClick={onGoToMission}
            className="focus-ring rounded-xl border border-aurora/40 bg-aurora/15 px-4 py-2 text-[12.5px] text-star"
          >
            Ir para Mission Control
          </button>
        }
      />
    )
  }

  const meta = ROUTE_META[activeRun.agent] || ROUTE_META.core

  return (
    <div className="space-y-5">
      <Panel className="panel-pad">
        <PanelHeader
          kicker={`Trace · ${formatDateTime(activeRun.startedAt)}`}
          title={truncate(activeRun.prompt, 90)}
          icon={Activity}
          actions={
            runs.length > 1 ? (
              <label className="relative flex items-center">
                <select
                  value={activeRunId}
                  onChange={(event) => setActiveRunId(event.target.value)}
                  className="focus-ring appearance-none rounded-xl border border-panel-edge/70 bg-void-deep py-2 pl-3 pr-8 font-mono text-[11px] text-star-muted"
                >
                  {runs.map((run) => (
                    <option key={run.requestId} value={run.requestId}>
                      {run.requestId} · {truncate(run.prompt, 34)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 text-star-faint" />
              </label>
            ) : null
          }
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={meta.accent}>{meta.label}</Badge>
          <Badge tone={statusTone(activeRun.status)} dot>
            {activeRun.status}
          </Badge>
          <span className="font-mono text-[10.5px] text-star-faint">{activeRun.requestId}</span>
        </div>
      </Panel>

      <TraceSummary run={activeRun} />
      <TraceTimeline run={activeRun} />
    </div>
  )
}
