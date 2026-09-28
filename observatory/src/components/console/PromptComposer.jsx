import { useState } from 'react'
import { CornerDownLeft, Play, Wand2 } from 'lucide-react'
import { SUGGESTED_PROMPTS } from '../../data/evalCases'
import { cn } from '../../lib/cn'

export function PromptComposer({ onRun, busy, maxToolRounds, onMaxRoundsChange }) {
  const [value, setValue] = useState('')

  function submit() {
    const prompt = value.trim()
    if (!prompt || busy) return
    onRun(prompt)
    setValue('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="glass scan-edge overflow-hidden">
      <div className="flex items-center justify-between border-b border-panel-edge/60 px-4 py-2.5">
        <p className="kicker flex items-center gap-1.5">
          <Wand2 size={11} className="text-aurora-soft" />
          Enviar requisição ao runtime
        </p>
        <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-star-faint">
          budget
          <select
            value={maxToolRounds}
            onChange={(event) => onMaxRoundsChange(Number(event.target.value))}
            className="focus-ring rounded-md border border-panel-edge/70 bg-void-deep px-2 py-1 font-mono text-[11px] text-star"
          >
            {[1, 2, 3, 4].map((round) => (
              <option key={round} value={round}>
                {round} rounds
              </option>
            ))}
          </select>
        </label>
      </div>

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Ex.: Leia o project_notes.txt e calcule 18 * 7."
        className="focus-ring w-full resize-none bg-transparent px-4 py-3.5 text-[13.5px] leading-relaxed text-star placeholder:text-star-faint"
      />

      <div className="flex flex-wrap items-center gap-2 border-t border-panel-edge/60 px-4 py-3">
        {SUGGESTED_PROMPTS.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setValue(suggestion)}
            className="focus-ring rounded-full border border-panel-edge/70 bg-white/5 px-3 py-1 text-[11px] text-star-muted transition hover:border-aurora/40 hover:text-star"
          >
            {suggestion}
          </button>
        ))}
        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          className={cn(
            'focus-ring ml-auto flex items-center gap-2 rounded-xl border px-4 py-2 text-[12.5px] font-medium transition',
            busy || !value.trim()
              ? 'cursor-not-allowed border-panel-edge/60 bg-white/5 text-star-faint'
              : 'border-aurora/40 bg-gradient-to-r from-aurora/30 to-pulse/20 text-star hover:from-aurora/40 hover:to-pulse/30',
          )}
        >
          <Play size={14} />
          Executar
          <span className="hidden items-center gap-1 font-mono text-[10px] text-star-faint sm:flex">
            <CornerDownLeft size={10} />
            ⌘↵
          </span>
        </button>
      </div>
    </div>
  )
}
