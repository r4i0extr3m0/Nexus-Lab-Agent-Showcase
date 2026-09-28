import { AlertTriangle, ArrowUpRight, Clock, Layers, Sparkles, Wrench } from 'lucide-react'
import { ROUTE_META } from '../../runtime/router'
import { cn } from '../../lib/cn'
import { formatClock, formatMs, statusTone } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { Gauge } from '../ui/Gauge'
import { RouteBadge } from './RouteBadge'

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-panel-edge/60 bg-white/5 px-3 py-2">
      {Icon ? <Icon size={13} className="text-star-faint" /> : null}
      <div>
        <p className="kicker">{label}</p>
        <p className="font-mono text-[12px] text-star">{value}</p>
      </div>
    </div>
  )
}

export function AgentResponse({ run, onOpenTrace }) {
  if (!run) return null
  const routeMeta = ROUTE_META[run.agent] || ROUTE_META.core
  const toolCount = run.toolCalls.length
  const toolRounds = run.rounds.filter((round) => round.toolCalls.length > 0).length

  return (
    <div className="glass animate-fade-rise overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-panel-edge/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <Gauge value={run.confidence} size={64} thickness={5} tone={routeMeta.accent} label="conf" />
          <div>
            <p className="kicker flex items-center gap-1.5">
              <Sparkles size={11} className="text-pulse" />
              Resposta do agente
            </p>
            <p className="mt-1 max-w-xl text-[13px] font-medium text-star">{run.prompt}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RouteBadge route={run.agent} confidence={run.confidence} />
              <Badge tone={statusTone(run.status)} dot>
                {run.status}
              </Badge>
              <span className="font-mono text-[10.5px] text-star-faint">{run.requestId}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenTrace?.(run.requestId)}
          className="focus-ring flex items-center gap-1.5 rounded-xl border border-panel-edge/70 bg-white/5 px-3 py-2 text-[11.5px] text-star-muted transition hover:border-aurora/40 hover:text-star"
        >
          <ArrowUpRight size={13} />
          Abrir trace
        </button>
      </div>

      <div className="px-5 py-4">
        {run.error ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-alert/40 bg-alert/10 px-3.5 py-3 text-[12.5px] text-alert">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{run.answer}</span>
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed text-star">{run.answer}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Metric label="Rodadas" value={`${toolRounds}/${run.maxToolRounds}`} icon={Layers} />
          <Metric label="Ferramentas" value={toolCount} icon={Wrench} />
          <Metric label="Latência" value={formatMs(run.latencyMs)} icon={Clock} />
          <Metric label="Terminado" value={formatClock(run.finishedAt)} icon={Clock} />
        </div>

        {toolCount > 0 ? (
          <div className="mt-4">
            <p className="kicker mb-2">Cadeia de ferramentas</p>
            <div className="flex flex-wrap items-center gap-2">
              {run.toolCalls.map((call, index) => (
                <span key={call.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[11px]',
                      call.status === 'OK'
                        ? 'border-signal/35 bg-signal/10 text-signal'
                        : 'border-alert/40 bg-alert/10 text-alert',
                    )}
                  >
                    <span className="text-star-faint">R{call.round}</span>
                    {call.name}
                  </span>
                  {index < run.toolCalls.length - 1 ? (
                    <span className="h-px w-4 bg-panel-edge" />
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
