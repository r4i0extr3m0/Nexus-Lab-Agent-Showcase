// IntentRouter — deterministic, lightweight routing.
// Mirrors IntentRouter in showcase/nexus_agent.py. The router is intentionally
// not an LLM classifier: it demonstrates the architectural separation between
// routing and execution.

export const ROUTER_RULES = {
  testing: ['teste', 'testes', 'test', 'tests', 'pytest', 'validar', 'validate', 'suite'],
  tools: [
    'ferramenta',
    'ferramentas',
    'tool',
    'tools',
    'executar',
    'execute',
    'rodar',
    'run',
    'calcular',
    'calculate',
    'calculator',
    'arquivo',
    'arquivos',
    'file',
    'files',
    'ler',
    'read',
    'listar',
    'list',
    'sandbox',
    'documento',
    'document',
    'docs',
  ],
  project: ['projeto', 'project', 'arquitetura', 'architecture', 'nexus', 'status'],
}

export const ROUTE_META = {
  testing: { label: 'Testing', accent: 'signal', blurb: 'Validação e execução de testes.' },
  tools: { label: 'Tools', accent: 'pulse', blurb: 'Ferramentas registradas e I/O do sandbox.' },
  project: { label: 'Project', accent: 'aurora', blurb: 'Status e arquitetura do runtime.' },
  core: { label: 'Core', accent: 'star', blurb: 'Resposta direta, sem ferramentas.' },
}

export function scoreRoutes(text) {
  const normalized = String(text || '').toLowerCase()
  const scores = {}
  for (const [name, terms] of Object.entries(ROUTER_RULES)) {
    scores[name] = terms.reduce((acc, term) => acc + (normalized.includes(term) ? 1 : 0), 0)
  }
  return scores
}

// Python's max(scores, key=scores.get) returns the first key with the highest
// score in insertion order (testing, tools, project). Replicated exactly.
export function route(text) {
  const scores = scoreRoutes(text)
  let best = 'core'
  let bestScore = -1
  for (const name of Object.keys(ROUTER_RULES)) {
    if (scores[name] > bestScore) {
      bestScore = scores[name]
      best = name
    }
  }
  if (bestScore === 0) {
    return { route: 'core', confidence: 0.5, scores }
  }
  return { route: best, confidence: Math.min(1, 0.5 + bestScore * 0.15), scores }
}
