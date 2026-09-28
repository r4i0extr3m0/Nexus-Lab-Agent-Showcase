import { useMemo } from 'react'
import { Activity, BarChart3, Clock, Route, TrendingUp, Wrench } from 'lucide-react'
import { useObservatory } from '../../state/store'
import { ROUTE_META } from '../../runtime/router'
import { averageLatency, routeUsage, successRate, toolUsage } from '../../runtime/trace'
import { formatMs, statusTone, truncate } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Panel, PanelHeader } from '../ui/Panel'
import { StatTile } from '../ui/StatTile'
import { BarChart } from '../ui/BarChart'
import { EmptyState } from '../ui/EmptyState'

const TOOL_TONE = {
  calculator: 'aurora',
  project_status: 'signal',
  list_sandbox_files: 'pulse',
  read_sandbox_file: 'pulse',
  run_tests: 'flare',
}

export function TelemetryDashboard() {
  const { runs } = useObservatory()

  const metrics = useMemo(() => {
    const tools = toolUsage(runs)
    const routes = routeUsage(runs)
    return {
      tools,
      routes,
      success: successRate(runs),
      avgLatency: averageLatency(runs),
      totalToolCalls: Object.values(tools).reduce((acc, value) => acc + value, 0),
    }
  }, [runs])

  const toolData = Object.entries(metrics.tools)
    .map(([label, value]) => ({ label, value, tone: TOOL_TONE[label] || 'pulse' }))
    .sort((a, b) => b.value - a.value)

  const routeData = Object.entries(metrics.routes).map(([label, value]) => ({
    label,
    value,
    tone: ROUTE_META[label]?.accent || 'star',
  }))

  return (
    <div className="space-y-5">
      <Panel className="panel-pad">
        <PanelHeader
          kicker="Sessão local"
          title="Telemetry"
          icon={BarChart3}
          description="Métricas agregadas das execuções desta sessão. Persistidas apenas no seu navegador (localStorage) — nada sai da máquina."
        />
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile kicker="Execuções" value={runs.length} tone="aurora" icon={Activity} hint="nesta sessão" />
        <StatTile
          kicker="Taxa de sucesso"
          value={`${metrics.success}`}
          unit="%"
          tone="signal"
          icon={TrendingUp}
          hint="status SUCCESS"
        />
        <StatTile
          kicker="Latência média"
          value={formatMs(metrics.avgLatency)}
          tone="pulse"
          icon={Clock}
          hint="por execução"
        />
        <StatTile
          kicker="Tool calls"
          value={metrics.totalToolCalls}
          tone="flare"
          icon={Wrench}
          hint="chamadas validadas"
        />
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem telemetria ainda"
          description="Execute algumas requisições no Mission Control para popular as métricas agregadas."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel className="panel-pad">
              <PanelHeader kicker="Distribuição" title="Uso de ferramentas" icon={Wrench} />
              <div className="mt-4">
                <BarChart data={toolData} />
              </div>
            </Panel>
            <Panel className="panel-pad">
              <PanelHeader kicker="Distribuição" title="Rotas selecionadas" icon={Route} />
              <div className="mt-4">
                <BarChart data={routeData} />
              </div>
            </Panel>
          </div>

          <Panel className="overflow-hidden">
            <div className="border-b border-panel-edge/60 px-4 py-3">
              <p className="kicker">Execuções recentes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-panel-edge/60 font-mono text-[10.5px] uppercase tracking-[0.14em] text-star-faint">
                    <th className="px-4 py-2 font-normal">request</th>
                    <th className="px-4 py-2 font-normal">prompt</th>
                    <th className="px-4 py-2 font-normal">rota</th>
                    <th className="px-4 py-2 font-normal">tools</th>
                    <th className="px-4 py-2 font-normal">latência</th>
                    <th className="px-4 py-2 font-normal">status</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 12).map((run) => {
                    const meta = ROUTE_META[run.agent] || ROUTE_META.core
                    return (
                      <tr
                        key={run.requestId}
                        className="border-b border-panel-edge/40 last:border-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-2.5 font-mono text-[10.5px] text-star-faint">
                          {run.requestId}
                        </td>
                        <td className="max-w-[240px] px-4 py-2.5 text-[12px] text-star-muted">
                          {truncate(run.prompt, 70)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={meta.accent}>{meta.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-star">
                          {run.toolCalls.length}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] text-star-muted">
                          {formatMs(run.latencyMs)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={statusTone(run.status)} dot>
                            {run.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
