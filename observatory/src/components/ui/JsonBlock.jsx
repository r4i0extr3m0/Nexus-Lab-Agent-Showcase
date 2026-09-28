import { useState } from 'react'
import { Check, ChevronDown, Copy } from 'lucide-react'
import { cn } from '../../lib/cn'
import { prettyJson } from '../../lib/format'

export function JsonBlock({ value, label, maxHeight = 240, className, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const text = typeof value === 'string' ? value : prettyJson(value)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-panel-edge/70 bg-void-deep/70', className)}>
      <div className="flex items-center justify-between border-b border-panel-edge/60 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((value_) => !value_)}
          className="focus-ring flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-star-faint hover:text-star-muted"
        >
          <ChevronDown size={12} className={cn('transition', open ? '' : '-rotate-90')} />
          {label || 'JSON'}
        </button>
        <button
          type="button"
          onClick={copy}
          className="focus-ring flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-star-faint hover:text-pulse"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'ok' : 'copy'}
        </button>
      </div>
      {open ? (
        <pre
          className="mono-scroll px-3 py-2.5 text-star-muted"
          style={{ maxHeight }}
        >
          {text}
        </pre>
      ) : null}
    </div>
  )
}
