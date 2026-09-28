import {
  Calculator,
  CheckCircle2,
  FileText,
  FlaskConical,
  Info,
  List,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatMs } from '../../lib/format'
import { JsonBlock } from '../ui/JsonBlock'

const TOOL_ICON = {
  calculator: Calculator,
  project_status: Info,
  list_sandbox_files: List,
  read_sandbox_file: FileText,
  run_tests: FlaskConical,
}

function ResultView({ call }) {
  const { result } = call
  if (!result) return null

  if (call.name === 'run_tests') {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-star-faint">{result.command}</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-signal">
            <CheckCircle2 size={12} /> {result.total}/{result.total} passed
          </span>
        </div>
        <JsonBlock value={result.output} label="pytest output" maxHeight={180} defaultOpen={false} />
      </div>
    )
  }

  if (call.name === 'read_sandbox_file') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-mono text-[11px] text-star-faint">
          <span className="rounded-md border border-panel-edge/70 bg-white/5 px-2 py-0.5 text-star-muted">
            {result.path}
          </span>
          <span>{result.content.length} chars</span>
          {result.truncated ? <span className="text-flare">truncated</span> : null}
        </div>
        <JsonBlock value={result.content} label="conteúdo" maxHeight={160} defaultOpen={false} />
      </div>
    )
  }

  if (call.name === 'list_sandbox_files') {
    return (
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-star-faint">{result.root}</p>
        <div className="flex flex-wrap gap-1.5">
          {result.files.map((file) => (
            <span
              key={file}
              className="rounded-md border border-panel-edge/70 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-star-muted"
            >
              {file}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (call.name === 'calculator') {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-star-faint">{result.expression} =</span>
        <span className="font-mono text-lg font-semibold text-pulse-soft">{result.result}</span>
      </div>
    )
  }

  return <JsonBlock value={result} label="resultado" maxHeight={180} />
}

export function ToolCallCard({ call }) {
  const Icon = TOOL_ICON[call.name] || FlaskConical
  const ok = call.status === 'OK'

  return (
    <div className="glass-raised overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-edge/60 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-panel-edge bg-white/5 text-pulse">
            <Icon size={14} strokeWidth={1.8} />
          </span>
          <span className="font-mono text-[12.5px] text-star">{call.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-star-faint">
            round {call.round}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] text-star-faint">{formatMs(call.durationMs)}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.14em]',
              ok ? 'text-signal' : 'text-alert',
            )}
          >
            {ok ? <ShieldCheck size={12} /> : <XCircle size={12} />}
            {ok ? 'validado' : 'falha'}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3.5">
        <JsonBlock value={call.arguments} label="argumentos" maxHeight={140} defaultOpen={false} />
        {call.error ? (
          <p className="rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 font-mono text-[11.5px] text-alert">
            {call.error}
          </p>
        ) : (
          <ResultView call={call} />
        )}
      </div>
    </div>
  )
}
