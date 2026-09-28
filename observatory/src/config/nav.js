import {
  Activity,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Crosshair,
  FolderTree,
} from 'lucide-react'

export const NAV_ITEMS = [
  {
    id: 'mission',
    label: 'Mission Control',
    hint: 'Executar e observar agentes',
    icon: Crosshair,
  },
  {
    id: 'trace',
    label: 'Trace Timeline',
    hint: 'Rastro de execução detalhado',
    icon: Activity,
  },
  {
    id: 'tools',
    label: 'Tool Registry',
    hint: 'Contratos e validação',
    icon: Boxes,
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    hint: 'I/O somente-leitura',
    icon: FolderTree,
  },
  {
    id: 'eval',
    label: 'Evaluation',
    hint: 'Suite determinística de 10 casos',
    icon: ClipboardCheck,
  },
  {
    id: 'telemetry',
    label: 'Telemetry',
    hint: 'Métricas agregadas das sessões',
    icon: BarChart3,
  },
]

export const APP = {
  name: 'Nexus Observatory',
  tagline: 'Mission control para agentes de IA',
  runtime: 'Nexus-Lab Agent Runtime',
  version: '0.1.0',
}
