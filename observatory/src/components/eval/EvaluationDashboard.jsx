import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Play,
  RotateCcw,
  Route,
  Target,
  Wrench,
  XCircle,
} from 'lucide-react'
import { evaluateSuite, summarizeEvaluation } from '../../runtime/evaluate'
import { cn } from '../../lib/cn'
import { formatMs } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Panel, PanelHeader } from '../ui/Panel'
import { Gauge } from '../ui/Gauge'
import { StatTile } from '../ui/StatTile'
import { EmptyState } from '../ui/EmptyState'

function Cell({ value, ok }) {
  return (
    <span
      className={cn(
        'font-mono text-[11px]',
        value === null ? 'text-star-faint' : ok ? 'text-signal' : 'text-alert',
      )}
    >
      {value === null ? '—' : value}
    </span>
  )
}

export function EvaluationDashboard() {
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)

  const summary = useMemo(() => (results ? summarizeEvaluation(results) : null), [results])

  function runEvaluation(withTrace) {
    setRunning(true)
    window.setTimeout(() => {
      setResults(evaluateSuite({ withTrace }))
      setRunning(false)
    }, 420)
  }

  return (
    <div className="space-y-5">
      <Panel className="panel-pad">
        <PanelHeader
          kicker="Routing suite · 10 casos"
          title="Evaluation"
          icon={ClipboardCheck}
          description="Avaliação determinística espelhando showcase/evaluate.py. Verifica se a rota selecionada e a primeira ferramenta planejada batem com o esperado. Modelo não é necessário."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runEvaluation(false)}
                disabled={running}
                className="focus-ring flex items-center gap-1.5 rounded-xl border border-panel-edge/70 bg-white/5 px-3 py-2 text-[11.5px] text-star-muted transition hover:border-aurora/40 hover:text-star"
              >
                <RotateCcw size={13} />
                Roteamento
              </button>
              <button
                type="button"
                onClick={() => runEvaluation(true)}
                disabled={running}
                className={cn(
                  'focus-ring flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition',
                  'border-aurora/40 bg-gradient-to-r from-aurora/30 to-pulse/20 text-star hover:from-aurora/40 hover:to-pulse/30',
                )}
              >
                <Play size={13} />
                {running ? 'Executando…' : 'Rodar com traces'}
              </button>
            </div>
          }
        />
      </Panel>

      {!results ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Nenhuma avaliação executada"
          description="Rode a suíte determinística para validar roteamento e tool-calling dos 10 casos curados."
          action={
            <button
              type="button"
              onClick={() => runEvaluation(true)}
              className="focus-ring rounded-xl border border-aurora/40 bg-aurora/15 px-4 py-2 text-[12.5px] text-star"
            >
              Rodar avaliação completa
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Panel className="flex flex-col items-center justify-center gap-3 p-5">
              <Gauge
                value={summary.accuracy / 100}
                size={140}
                thickness={10}
                tone={summary.accuracy === 100 ? 'signal' : 'aurora'}
                label="acurácia"
              />
              <p className="text-center text-[12px] text-star-muted">
                {summary.passed} de {summary.total} casos aprovados
              </p>
              {summary.failed > 0 ? (
                <Badge tone="alert">{summary.failed} falha(s)</Badge>
              ) : (
                <Badge tone="signal" icon={CheckCircle2}>
                  100% determinístico
                </Badge>
              )}
            </Panel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <StatTile
                kicker="Rota correta"
                value={`${summary.routeAccurate}/${summary.total}`}
                tone="aurora"
                icon={Route}
                hint="IntentRouter"
              />
              <StatTile
                kicker="Tool correta"
                value={`${summary.toolAccurate}/${summary.total}`}
                tone="pulse"
                icon={Wrench}
                hint="primeira ferramenta"
              />
              <StatTile
                kicker="Latência média"
                value={formatMs(summary.avgLatency)}
                tone="signal"
                icon={Clock}
                hint="por trace completo"
              />
              <StatTile
                kicker="Casos"
                value={summary.total}
                tone="flare"
                icon={Target}
                hint="eval_cases.json"
              />
            </div>
          </div>

          <Panel className="overflow-hidden">
            <div className="border-b border-panel-edge/60 px-4 py-3">
              <p className="kicker">Resultados por caso</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-panel-edge/60 font-mono text-[10.5px] uppercase tracking-[0.14em] text-star-faint">
                    <th className="px-4 py-2 font-normal">caso</th>
                    <th className="px-4 py-2 font-normal">prompt</th>
                    <th className="px-4 py-2 font-normal">rota esp. / obtida</th>
                    <th className="px-4 py-2 font-normal">tool esp. / obtida</th>
                    <th className="px-4 py-2 font-normal">resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-panel-edge/40 last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-2.5 font-mono text-[11.5px] text-star">{result.id}</td>
                      <td className="max-w-[280px] px-4 py-2.5 text-[12px] text-star-muted">
                        {result.prompt}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-star-faint">
                            {result.expected_route}
                          </span>
                          <span className="text-star-faint">/</span>
                          <Cell value={result.selectedRoute} ok={result.routeOk} />
                          {result.routeOk ? (
                            <CheckCircle2 size={12} className="text-signal" />
                          ) : (
                            <XCircle size={12} className="text-alert" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-star-faint">
                            {result.expected_tool ?? '—'}
                          </span>
                          <span className="text-star-faint">/</span>
                          <Cell value={result.firstTool} ok={result.toolOk} />
                          {result.toolOk ? (
                            <CheckCircle2 size={12} className="text-signal" />
                          ) : (
                            <XCircle size={12} className="text-alert" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={result.passed ? 'signal' : 'alert'} dot>
                          {result.passed ? 'pass' : 'fail'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
