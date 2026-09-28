import { useState } from 'react'
import { APP, NAV_ITEMS } from './config/nav'
import { useObservatory } from './state/store'
import { Starfield } from './components/layout/Starfield'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { SettingsModal } from './components/SettingsModal'
import { MissionControl } from './components/console/MissionControl'
import { TraceView } from './components/trace/TraceView'
import { ToolRegistryPanel } from './components/tools/ToolRegistryPanel'
import { SandboxExplorer } from './components/sandbox/SandboxExplorer'
import { EvaluationDashboard } from './components/eval/EvaluationDashboard'
import { TelemetryDashboard } from './components/telemetry/TelemetryDashboard'

export default function App() {
  const { runs, setActiveRunId } = useObservatory()
  const [activeView, setActiveView] = useState('mission')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const view = NAV_ITEMS.find((item) => item.id === activeView) || NAV_ITEMS[0]

  function openTrace(requestId) {
    setActiveRunId(requestId)
    setActiveView('trace')
    setMobileNavOpen(false)
  }

  function renderView() {
    switch (activeView) {
      case 'trace':
        return <TraceView onGoToMission={() => setActiveView('mission')} />
      case 'tools':
        return <ToolRegistryPanel />
      case 'sandbox':
        return <SandboxExplorer />
      case 'eval':
        return <EvaluationDashboard />
      case 'telemetry':
        return <TelemetryDashboard />
      case 'mission':
      default:
        return <MissionControl onOpenTrace={openTrace} />
    }
  }

  return (
    <div className="relative flex min-h-screen">
      <Starfield />

      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          onOpenSettings={() => setSettingsOpen(true)}
          runsCount={runs.length}
        />
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar navegação"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 cursor-default bg-void/80 backdrop-blur-sm"
          />
          <div className="absolute left-0 top-0 h-full animate-fade-rise">
            <Sidebar
              activeView={activeView}
              onNavigate={(id) => {
                setActiveView(id)
                setMobileNavOpen(false)
              }}
              onOpenSettings={() => {
                setSettingsOpen(true)
                setMobileNavOpen(false)
              }}
              runsCount={runs.length}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          view={view}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          runsCount={runs.length}
        />
        <main className="flex-1 px-4 py-5 sm:px-6">{renderView()}</main>
        <footer className="border-t border-panel-edge/50 px-6 py-4">
          <p className="text-center font-mono text-[10.5px] text-star-faint">
            {APP.name} · v{APP.version} — painel visual do {APP.runtime}. Projeto de portfólio para
            a vaga de Dev Júnior (Agentes de IA) · IAM Exponencial · Vinhais, São Luís/MA.
          </p>
        </footer>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
