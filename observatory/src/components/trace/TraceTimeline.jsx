import { Activity, CheckCircle2, GitBranch, ListTree, Radio, Route, Terminal } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatMs } from '../../lib/format'
import { ROUTE_META, ROUTER_RULES, scoreRoutes } from '../../runtime/router'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { JsonBlock } from '../ui/JsonBlock'
import { ToolCallCard } from './ToolCallCard'

const TONE_RING = {
  aurora: 'border-aurora/40 bg-aurora/10 text-aurora-soft',
  pulse: 'border-pulse/40 bg-pulse/10 text-pulse-soft',
  signal: 'border-signal/40 bg-signal/10 text-signal',
  flare: 'border-flare/40 bg-flare/10 text-flare',
  alert: 'border-alert/40 bg-alert/10 text-alert',
  star: 'border-panel-edge bg-white/5 text-star-muted',
}

const TONE_BAR = {
  aurora: 'aurora',
  pulse: 'pulse',
  signal: 'signal',
  flare: 'flare',
  alert: 'alert',
  star: 'star',
}

function TimelineNode({ last, tone = 'star', icon: Icon, kicker, title, actions, children }) {
  return (
    <li className="relative pl-14">
      {!last ? (
        <span className="absolute left-[21px] top-11 h-[calc(100%-2.25rem)] w-px bg-gradient-to-b from-panel-edge via-panel-edge/60 to-transparent" />
      ) : null}
      <span
        className={cn(
          'absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-2xl border backdrop-blur',
          TONE_RING[tone] || TONE_RING.star,
        )}
      >
        {Icon ? <Icon size={17} strokeWidth={1.8} /> : null}
      </span>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h3 className="text-[13.5px] font-semibold tracking-tight text-star">{title}</h3>
        </div>
        {actions}
      </div>
      {children ? <div className="mt-3 space-y-3">{children}</div> : null}
    </li>
  )
}

export function TraceTimeline({ run }) {
  if (!run) return null
  const routeMeta = ROUTE_META[run.agent] || ROUTE_META.core
  const scores = scoreRoutes(run.prompt)
  const plan = run.plan || []
  const finalRound = [...run.rounds].reverse().find((round) => round.finalText)
  const finalText = finalRound?.finalText || run.answer

  const nodes = []
  nodes.push(
    <TimelineNode
      key="router"
      tone={routeMeta.accent}
      icon={Route}
      kicker="Etapa 01 · IntentRouter"
      title={`Rota detectada: ${routeMeta.label}`}
      actions={<Badge tone={routeMeta.accent}>{(run.confidence * 100).toFixed(0)}% confiança</Badge>}
    >
      <p className="text-[12.5px] text-star-muted">{routeMeta.blurb}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {Object.keys(ROUTER_RULES).map((name) => {
          const active = name === run.agent
          const meta = ROUTE_META[name]
          return (
            <div
              key={name}
              className={cn(
                'rounded-xl border px-3 py-2',
                active ? 'border-aurora/40 bg-aurora/5' : 'border-panel-edge/60 bg-white/5',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-star-muted">{meta.label}</span>
                <span className="font-mono text-[11px] text-star">{scores[name]}</span>
              </div>
              <ProgressBar
                value={Math.min(1, scores[name] / 3)}
                tone={TONE_BAR[meta.accent]}
                className="mt-2"
              />
            </div>
          )
        })}
      </div>
    </TimelineNode>,
  )

  if (plan.length > 0) {
    nodes.push(
      <TimelineNode
        key="plan"
        tone="pulse"
        icon={ListTree}
        kicker="Etapa 02 · Plano"
        title={`${plan.length} ferramenta(s) planejada(s)`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {plan.map((step, index) => (
            <span key={`${step.name}-${index}`} className="flex items-center gap-2">
              <span className="rounded-lg border border-pulse/35 bg-pulse/10 px-2.5 py-1 font-mono text-[11px] text-pulse-soft">
                {step.name}
              </span>
              {index < plan.length - 1 ? <span className="text-star-faint">→</span> : null}
            </span>
          ))}
        </div>
      </TimelineNode>,
    )
  }

  run.rounds.forEach((round, roundIndex) => {
    if (round.toolCalls.length === 0) return
    nodes.push(
      <TimelineNode
        key={`round-${round.index}`}
        tone="pulse"
        icon={Radio}
        kicker={`Etapa ${String(roundIndex + 3).padStart(2, '0')} · Rodada ${round.index}`}
        title={round.status === 'ERROR' ? 'Rodada com falha' : 'Rodada de ferramentas'}
        actions={
          <Badge tone={round.status === 'ERROR' ? 'alert' : 'pulse'}>
            {round.toolCalls.length} call(s)
          </Badge>
        }
      >
        {round.toolCalls.map((call) => (
          <ToolCallCard key={call.id} call={call} />
        ))}
      </TimelineNode>,
    )
  })

  nodes.push(
    <TimelineNode
      key="final"
      tone={run.status === 'SUCCESS' ? 'signal' : 'alert'}
      icon={CheckCircle2}
      kicker="Resposta final"
      title={run.status === 'SUCCESS' ? 'Execução concluída' : 'Execução encerrada com falha'}
      actions={<Badge tone={run.status === 'SUCCESS' ? 'signal' : 'alert'}>{formatMs(run.latencyMs)}</Badge>}
      last
    >
      <p className="rounded-xl border border-panel-edge/60 bg-void-deep/50 px-4 py-3 text-[13px] leading-relaxed text-star">
        {finalText}
      </p>
      <JsonBlock value={run} label="ExecutionTrace (bruto)" maxHeight={320} defaultOpen={false} />
    </TimelineNode>,
  )

  return (
    <div className="glass panel-pad">
      <div className="mb-5 flex items-center gap-2">
        <Activity size={15} className="text-pulse" />
        <p className="kicker">Trace de execução</p>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-star-faint">
          <GitBranch size={11} />
          {run.requestId}
        </span>
        <Terminal size={12} className="text-star-faint" />
      </div>
      <ol className="space-y-7">{nodes}</ol>
    </div>
  )
}
