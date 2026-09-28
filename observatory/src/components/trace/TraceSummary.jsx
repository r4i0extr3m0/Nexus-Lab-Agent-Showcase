import { Activity, Clock, Layers } from 'lucide-react'
import { formatMs, formatClock, statusTone } from '../../lib/format'
import { ROUTE_META } from '../../runtime/router'
import { StatTile } from '../ui/StatTile'

export function TraceSummary({ run }) {
  const routeMeta = ROUTE_META[run.agent] || ROUTE_META.core
  const toolRounds = run.rounds.filter((round) => round.toolCalls.length > 0).length
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        kicker="Status"
        value={run.status}
        tone={statusTone(run.status)}
        icon={Activity}
        hint={`request ${run.requestId}`}
      />
      <StatTile
        kicker="Rota"
        value={routeMeta.label}
        tone={routeMeta.accent}
        hint={`confiança ${(run.confidence * 100).toFixed(0)}%`}
      />
      <StatTile
        kicker="Rodadas"
        value={`${toolRounds}/${run.maxToolRounds}`}
        tone="pulse"
        icon={Layers}
        hint="rodadas com ferramentas"
      />
      <StatTile
        kicker="Latência"
        value={formatMs(run.latencyMs)}
        tone="signal"
        icon={Clock}
        hint={`${run.toolCalls.length} ferramentas · ${formatClock(run.finishedAt)}`}
      />
    </div>
  )
}
