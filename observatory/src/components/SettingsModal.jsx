import { Cpu, Info, Lock, Settings, ShieldCheck, Trash2, X } from 'lucide-react'
import { APP } from '../config/nav'
import { useObservatory } from '../state/store'
import { cn } from '../lib/cn'
import { Badge } from './ui/Badge'

export function SettingsModal({ open, onClose }) {
  const { settings, updateSettings, clearHistory, runs } = useObservatory()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-void/80 p-4 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />
      <div className="glass-raised relative z-10 w-full max-w-lg animate-fade-rise overflow-hidden">
        <div className="flex items-center justify-between border-b border-panel-edge/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-panel-edge bg-white/5 text-aurora-soft">
              <Settings size={16} />
            </span>
            <div>
              <p className="kicker">Configuração</p>
              <h2 className="text-[14px] font-semibold text-star">Ajustes da sessão</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-8 w-8 place-items-center rounded-lg border border-panel-edge/70 bg-white/5 text-star-faint hover:text-star"
            aria-label="Fechar ajustes"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="kicker mb-2">Budget de ferramentas</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((round) => (
                <button
                  key={round}
                  type="button"
                  onClick={() => updateSettings({ maxToolRounds: round })}
                  className={cn(
                    'focus-ring flex-1 rounded-xl border px-3 py-2.5 font-mono text-[12px] transition',
                    settings.maxToolRounds === round
                      ? 'border-aurora/50 bg-aurora/15 text-star'
                      : 'border-panel-edge/70 bg-white/5 text-star-muted hover:border-panel-edge',
                  )}
                >
                  {round} {round === 1 ? 'round' : 'rounds'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-star-muted">
              Limite máximo de rodadas do loop agêntico antes de falhar explicitamente.
            </p>
          </div>

          <div className="rounded-xl border border-panel-edge/60 bg-void-deep/50 p-4">
            <p className="kicker mb-3 flex items-center gap-1.5">
              <Info size={11} className="text-pulse" />
              Ambiente
            </p>
            <ul className="space-y-2 font-mono text-[11.5px] text-star-muted">
              <li className="flex items-center gap-2">
                <Cpu size={12} className="text-aurora-soft" />
                {APP.runtime}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-signal" />
                provedor determinístico · sem GPU/API key
              </li>
              <li className="flex items-center gap-2">
                <Lock size={12} className="text-pulse" />
                histórico local · localStorage
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-alert/30 bg-alert/5 p-4">
            <div>
              <p className="text-[12.5px] font-medium text-star">Limpar histórico</p>
              <p className="text-[11.5px] text-star-muted">{runs.length} execuções armazenadas</p>
            </div>
            <button
              type="button"
              onClick={clearHistory}
              disabled={runs.length === 0}
              className="focus-ring flex items-center gap-1.5 rounded-xl border border-alert/40 bg-alert/10 px-3 py-2 text-[11.5px] text-alert transition hover:bg-alert/20 disabled:opacity-40"
            >
              <Trash2 size={13} />
              Limpar
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Badge tone="star">v{APP.version}</Badge>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-xl border border-aurora/40 bg-gradient-to-r from-aurora/30 to-pulse/20 px-4 py-2 text-[12.5px] text-star"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
