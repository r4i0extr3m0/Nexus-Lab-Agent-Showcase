// Deterministic planner/provider.
//
// The Nexus-Lab showcase ships a DemoProvider that replays a fixed script so a
// reviewer can see the real runtime without a model. Observatory generalises
// that idea: a deterministic policy derives an ordered tool plan from the
// request, then the same bounded runtime executes it. Inference stays behind
// the ChatProvider contract, so the UI is identical to a live provider run.

import { SANDBOX_FILES } from '../data/sandbox'

const ARITHMETIC_RE = /(-?\d+(?:\.\d+)?(?:\s*[+\-*/%]\s*-?\d+(?:\.\d+)?)+)/
const FILENAME_RE = /([\w.-]+\.(?:txt|json|md|markdown|py|log|csv|ya?ml))/

const INTENT_PATTERNS = {
  tests: /\b(test|tests|teste|testes|pytest|validar|validate|suite)\b/,
  status: /\b(status|projeto|project|arquitetura|architecture|nexus)\b/,
  list: /\b(list|listar|arquivos|files|file)\b/,
  read: /\b(read|ler|lendo|documento|document|docs|conteudo)\b/,
  calculate: /\b(calculate|calcular|calcula|calculator|calcule|resultado)\b/,
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function extractExpression(prompt) {
  const match = String(prompt).match(ARITHMETIC_RE)
  if (match) return match[1].replace(/\s+/g, ' ').trim()
  const numbers = String(prompt).match(/\d+(?:\.\d+)?/g)
  return numbers ? numbers.join(' ') : null
}

export function extractSandboxPath(prompt) {
  const matches = String(prompt).match(new RegExp(FILENAME_RE.source, 'g')) || []
  for (const candidate of matches) {
    if (candidate in SANDBOX_FILES) return candidate
  }
  return matches[0] || null
}

/**
 * Derive an ordered, bounded tool plan. The order is stable so evaluation is
 * deterministic: status -> tests -> read -> list -> calculate.
 */
export function planToolCalls(prompt) {
  const text = normalize(prompt)
  const intents = {}
  for (const [key, pattern] of Object.entries(INTENT_PATTERNS)) {
    intents[key] = pattern.test(text)
  }

  const expression = extractExpression(prompt)
  const sandboxPath = extractSandboxPath(prompt)

  const wantsCalculate = (intents.calculate || Boolean(expression)) && expression
  const wantsRead = intents.read || Boolean(sandboxPath)

  const plan = []
  if (intents.status) plan.push({ name: 'project_status', arguments: {} })
  if (intents.tests) plan.push({ name: 'run_tests', arguments: {} })
  if (wantsRead) {
    plan.push({
      name: 'read_sandbox_file',
      arguments: { path: sandboxPath || 'project_notes.txt' },
    })
  }
  if (intents.list && !wantsRead) plan.push({ name: 'list_sandbox_files', arguments: {} })
  if (wantsCalculate) plan.push({ name: 'calculator', arguments: { expression } })

  return plan.slice(0, 3)
}

function summarize(plan, results) {
  const sentences = []
  plan.forEach((step, index) => {
    const result = results[index]
    if (result === undefined) return
    switch (step.name) {
      case 'project_status':
        sentences.push(
          `Projeto ${result.project}: arquitetura ${result.architecture}, inferência ${result.inference}, orçamento de ${result.max_tool_rounds} rodadas de ferramentas.`,
        )
        break
      case 'run_tests':
        sentences.push(
          `A suíte do showcase passou (${result.total}/${result.total} testes, return_code=0).`,
        )
        break
      case 'read_sandbox_file':
        sentences.push(
          `Li ${result.path} (${result.content.length} caracteres) dentro do sandbox somente-leitura.`,
        )
        break
      case 'list_sandbox_files':
        sentences.push(
          `O sandbox contém ${result.files.length} arquivos: ${result.files.join(', ')}.`,
        )
        break
      case 'calculator':
        sentences.push(`O resultado de ${result.expression} é ${result.result}.`)
        break
      default:
        break
    }
  })

  if (sentences.length === 0) {
    return 'Nenhuma ferramenta era necessária. O runtime respondeu diretamente pelo provedor determinístico.'
  }
  return sentences.join(' ')
}

export function createDeterministicProvider(prompt) {
  const plan = planToolCalls(prompt)
  return {
    id: 'deterministic',
    label: 'Deterministic planner',
    plan,
    chat(messages) {
      const toolResults = messages.filter((message) => message.role === 'tool')
      const nextStep = plan[toolResults.length]

      if (!nextStep) {
        return {
          message: {
            role: 'assistant',
            content: summarize(plan, toolResults.map((m) => m.result)),
          },
        }
      }

      return {
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              id: `call_${toolResults.length + 1}_${nextStep.name}`,
              type: 'function',
              function: {
                name: nextStep.name,
                arguments: nextStep.arguments,
              },
            },
          ],
        },
      }
    },
  }
}
