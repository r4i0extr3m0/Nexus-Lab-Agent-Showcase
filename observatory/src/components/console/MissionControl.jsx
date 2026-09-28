import { useState } from 'react'
import { Crosshair, Cpu, GitBranch, Layers, Route, ShieldCheck, TerminalSquare, Wrench } from 'lucide-react'
import { APP } from '../../config/nav'
import { useObservatory } from '../../state/store'
import { Badge } from '../ui/Badge'
import { PromptComposer } from './PromptComposer'
import { AgentResponse } from './AgentResponse'
import { RunHistory } from './RunHistory'
import { EmptyState } from '../ui/EmptyState'

function Hero() {
  return (
    <div className="glass relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-aurora/70 to-transparent" />
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-aurora/15 blur-3xl" />
      <p className="kicker flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse" />
        {APP.name} · Mission Control
      </p>
      <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]">
        <span className="gradient-text">Observe, trace e avalie</span> agentes de IA em tempo real.
      </h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-star-muted">
        O Observatory é o painel visual do runtime <span className="text-star">{APP.runtime}</span>.
        Cada requisição percorre roteamento de intenção, um loop de ferramentas limitado e um trace de
        execução completo — tudo inspecionável aqui.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="pulse" dot>
          router → runtime → tools → trace
        </Badge>
        <Badge tone="aurora">max 3 rounds</Badge>
        <Badge tone="signal">sandbox read-only</Badge>
        <Badge tone="star">deterministic · offline</Badge>
      </div>
    </div>
  )
}

function ArchitectureCard() {
  const steps = [
    { label: 'User request', icon: TerminalSquare, tone: 'star' },
    { label: 'IntentRouter', icon: Route, tone: 'aurora' },
    { label: 'NexusAgentRuntime', icon: Cpu, tone: 'pulse' },
    { label: 'ToolRegistry + validation', icon: Wrench, tone: 'pulse' },
    { label: 'ExecutionTrace', icon: GitBranch, tone: 'signal' },
  ]
  return (
    <div className="glass panel-pad">
      <p className="kicker mb-3 flex items-center gap-1.5">
        <Layers size={11} className="text-aurora-soft" />
        Fluxo de execução
      </p>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-panel-edge/70 bg-white/5 text-star-muted">
              <step.icon size={14} strokeWidth={1.8} />
            </span>
            <span className="font-mono text-[11.5px] text-star-muted">{step.label}</span>
            {index < steps.length - 1 ? (
              <span className="ml-auto font-mono text-[10px] text-star-faint">↓</span>
            ) : (
              <ShieldCheck size={12} className="ml-auto text-signal" />
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function MissionControl({ onOpenTrace }) {
  const {
    runs,
    activeRun,
    activeRunId,
    runPrompt,
    clearHistory,
    setActiveRunId,
    settings,
    updateSettings,
    isRunning,
  } = useObservatory()

  async function handleRun(prompt) {
    await runPrompt(prompt)
  }

  return (
    <div className="space-y-5">
      <Hero />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <PromptComposer
            onRun={handleRun}
            busy={isRunning}
            maxToolRounds={settings.maxToolRounds}
            onMaxRoundsChange={(value) => updateSettings({ maxToolRounds: value })}
          />
          {activeRun ? (
            <AgentResponse run={activeRun} onOpenTrace={onOpenTrace} />
          ) : (
            <EmptyState
              icon={Crosshair}
              title="Pronto para observar"
              description="Envie uma requisição para disparar o runtime determinístico e visualizar rota, ferramentas, rodadas e trace."
            />
          )}
        </div>
        <div className="space-y-5">
          <RunHistory
            runs={runs}
            activeRunId={activeRunId}
            onSelect={setActiveRunId}
            onClear={clearHistory}
            onOpenTrace={onOpenTrace}
          />
          <ArchitectureCard />
        </div>
      </div>
    </div>
  )
}
