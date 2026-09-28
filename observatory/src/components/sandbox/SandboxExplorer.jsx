import { useState } from 'react'
import {
  FileJson,
  FileText,
  FolderTree,
  Lock,
  Quote,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { SANDBOX_FILES, SANDBOX_ROOT, listSandboxPaths } from '../../data/sandbox'
import { safeSandboxPath } from '../../runtime/tools'
import { cn } from '../../lib/cn'
import { Badge } from '../ui/Badge'
import { Panel, PanelHeader } from '../ui/Panel'

function fileIcon(name) {
  if (name.endsWith('.json')) return FileJson
  if (name.endsWith('.md')) return Quote
  return FileText
}

export function SandboxExplorer() {
  const files = listSandboxPaths()
  const [selected, setSelected] = useState(files[0])
  const [probe, setProbe] = useState('../etc/passwd')

  let probeResult
  try {
    probeResult = { allowed: true, resolved: safeSandboxPath(probe) }
  } catch (error) {
    probeResult = { allowed: false, resolved: error.message }
  }

  return (
    <div className="space-y-5">
      <Panel className="panel-pad">
        <PanelHeader
          kicker="Constrained I/O"
          title="Sandbox Explorer"
          icon={FolderTree}
          description="O agente pode listar e ler apenas arquivos de texto dentro de showcase/sandbox. Qualquer caminho que escape do diretório é rejeitado antes da leitura."
          actions={<Badge tone="signal" icon={Lock}>read-only</Badge>}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="p-3">
          <p className="kicker px-2 py-1">{SANDBOX_ROOT}</p>
          <ul className="mt-1 space-y-1">
            {files.map((file) => {
              const Icon = fileIcon(file)
              const active = file === selected
              return (
                <li key={file}>
                  <button
                    type="button"
                    onClick={() => setSelected(file)}
                    className={cn(
                      'focus-ring flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition',
                      active ? 'bg-gradient-to-r from-pulse/15 to-transparent' : 'hover:bg-white/5',
                    )}
                  >
                    <Icon size={15} className={active ? 'text-pulse-soft' : 'text-star-faint'} />
                    <span className="min-w-0">
                      <span className={cn('block truncate font-mono text-[12px]', active ? 'text-star' : 'text-star-muted')}>
                        {file}
                      </span>
                      <span className="block font-mono text-[10px] text-star-faint">
                        {SANDBOX_FILES[file].length} chars
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-3 rounded-xl border border-panel-edge/60 bg-void-deep/50 p-3">
            <p className="kicker mb-2 flex items-center gap-1.5">
              <ShieldCheck size={11} className="text-signal" />
              Teste de fronteira
            </p>
            <input
              value={probe}
              onChange={(event) => setProbe(event.target.value)}
              spellCheck={false}
              className="focus-ring w-full rounded-lg border border-panel-edge/70 bg-void px-2.5 py-1.5 font-mono text-[11.5px] text-star"
            />
            <p
              className={cn(
                'mt-2 flex items-start gap-1.5 font-mono text-[11px]',
                probeResult.allowed ? 'text-signal' : 'text-alert',
              )}
            >
              {probeResult.allowed ? (
                <ShieldCheck size={12} className="mt-0.5 shrink-0" />
              ) : (
                <ShieldAlert size={12} className="mt-0.5 shrink-0" />
              )}
              {probeResult.allowed ? `permitido → ${probeResult.resolved}` : probeResult.resolved}
            </p>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-panel-edge/60 px-4 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[11.5px] text-star-muted">
              <Lock size={12} className="text-star-faint" />
              {SANDBOX_ROOT}/{selected}
            </span>
            <Badge tone="star">utf-8</Badge>
          </div>
          <pre className="mono-scroll max-h-[520px] px-4 py-3.5 text-star-muted">
            {SANDBOX_FILES[selected]}
          </pre>
        </Panel>
      </div>
    </div>
  )
}
