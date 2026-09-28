import { Boxes, Calculator, FileText, FlaskConical, Info, List, ShieldCheck, Wrench } from 'lucide-react'
import { buildDefaultRegistry } from '../../runtime/registry'
import { Badge } from '../ui/Badge'
import { Panel, PanelHeader } from '../ui/Panel'
import { JsonBlock } from '../ui/JsonBlock'

const TOOL_ICON = {
  calculator: Calculator,
  project_status: Info,
  list_sandbox_files: List,
  read_sandbox_file: FileText,
  run_tests: FlaskConical,
}

const CATEGORY_TONE = {
  compute: 'aurora',
  io: 'pulse',
  introspection: 'signal',
  workflow: 'flare',
}

function ToolCard({ spec }) {
  const Icon = TOOL_ICON[spec.name] || Wrench
  const required = new Set(spec.parameters.required || [])
  const properties = Object.entries(spec.parameters.properties || {})

  return (
    <div className="glass-raised overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-panel-edge/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-panel-edge bg-white/5 text-pulse">
            <Icon size={16} strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-mono text-[13px] text-star">{spec.name}</p>
            <p className="mt-0.5 max-w-md text-[12px] leading-relaxed text-star-muted">
              {spec.description}
            </p>
          </div>
        </div>
        <Badge tone={CATEGORY_TONE[spec.category] || 'star'}>{spec.category}</Badge>
      </div>

      <div className="px-4 py-3">
        <p className="kicker mb-2">Parâmetros</p>
        {properties.length === 0 ? (
          <p className="font-mono text-[11.5px] text-star-faint">sem argumentos</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-panel-edge/60">
            <table className="w-full text-left font-mono text-[11.5px]">
              <thead className="bg-white/5 text-star-faint">
                <tr>
                  <th className="px-3 py-1.5 font-normal">nome</th>
                  <th className="px-3 py-1.5 font-normal">tipo</th>
                  <th className="px-3 py-1.5 font-normal">req</th>
                </tr>
              </thead>
              <tbody className="text-star-muted">
                {properties.map(([name, schema]) => (
                  <tr key={name} className="border-t border-panel-edge/50">
                    <td className="px-3 py-1.5 text-star">{name}</td>
                    <td className="px-3 py-1.5">{schema.type}</td>
                    <td className="px-3 py-1.5">
                      {required.has(name) ? <span className="text-flare">obrigatório</span> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <JsonBlock
            value={{ type: 'function', function: { name: spec.name, parameters: spec.parameters } }}
            label="schema"
            maxHeight={160}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  )
}

export function ToolRegistryPanel() {
  const registry = buildDefaultRegistry()
  const specs = registry.names().map((name) => registry.get(name))

  return (
    <div className="space-y-5">
      <Panel className="panel-pad">
        <PanelHeader
          kicker="Capability boundary"
          title="Tool Registry"
          icon={Boxes}
          description="As ferramentas são declarativas e validadas antes do dispatch. O modelo só recebe as capacidades registradas — não existe tool de shell arbitrário."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="signal" icon={ShieldCheck}>
            {specs.length} tools registradas
          </Badge>
          <Badge tone="aurora">required + unknown arg checks</Badge>
          <Badge tone="pulse">type validation</Badge>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {specs.map((spec) => (
          <ToolCard key={spec.name} spec={spec} />
        ))}
      </div>
    </div>
  )
}
