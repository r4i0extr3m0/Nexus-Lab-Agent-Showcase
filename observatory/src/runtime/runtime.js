// NexusAgentRuntime — the bounded agent loop.
// Mirrors NexusAgentRuntime in showcase/nexus_agent.py:
//   conversation state, tool-round budget, provider calls, tool dispatch,
//   error propagation and execution tracing. Inference stays behind the
//   ChatProvider contract.

import { buildDefaultRegistry } from './registry'
import { createDeterministicProvider } from './providers'
import { route as classify } from './router'
import { createTrace, finishTrace } from './trace'

export const DEFAULT_SYSTEM_PROMPT = (agent, confidence) =>
  'Você é o Nexus Agent Showcase. ' +
  'Use ferramentas quando necessário. ' +
  'Não invente resultados de ferramentas. ' +
  `Rota detectada: ${agent} (${confidence.toFixed(2)}).`

export class NexusAgentRuntime {
  constructor({ registry, maxToolRounds = 3 } = {}) {
    if (maxToolRounds < 1) throw new Error('max_tool_rounds must be >= 1')
    this.registry = registry || buildDefaultRegistry()
    this.maxToolRounds = maxToolRounds
  }

  run(userInput, { requestId, provider, maxToolRounds } = {}) {
    const budget = maxToolRounds || this.maxToolRounds
    const startedAt = performance.now()
    const { route, confidence } = classify(userInput)
    const activeProvider = provider || createDeterministicProvider(userInput)

    const trace = createTrace({
      requestId: requestId || `run-${Date.now().toString(36)}`,
      agent: route,
      confidence,
      provider: activeProvider.id || 'deterministic',
      prompt: userInput,
      maxToolRounds: budget,
    })
    trace.plan = activeProvider.plan || []

    const messages = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT(route, confidence) },
      { role: 'user', content: userInput },
    ]

    try {
      for (let roundIndex = 1; roundIndex <= budget; roundIndex += 1) {
        const round = { index: roundIndex, toolCalls: [], status: 'RUNNING', finalText: null }
        const payload = activeProvider.chat(messages, this.registry.schemas())
        const message = payload?.message
        if (!message || typeof message !== 'object') {
          throw new Error('provider returned an invalid message')
        }

        const toolCalls = message.tool_calls || []
        if (toolCalls.length === 0) {
          const finalText = String(message.content || '').trim()
          if (!finalText) throw new Error('provider returned an empty final response')
          round.status = 'FINAL'
          round.finalText = finalText
          trace.rounds.push(round)
          finishTrace(trace, 'SUCCESS', startedAt)
          return { answer: finalText, trace, error: null }
        }

        messages.push(message)
        for (const call of toolCalls) {
          const fn = call.function || {}
          const rawArgs = fn.arguments ?? {}
          let args = rawArgs
          try {
            args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs
          } catch {
            args = { __parse_error: String(rawArgs) }
          }

          const callStarted = performance.now()
          let result = null
          let error = null
          try {
            result = this.registry.execute(fn.name, args)
          } catch (execError) {
            error = execError instanceof Error ? execError.message : String(execError)
          }
          const durationMs = Math.round((performance.now() - callStarted) * 100) / 100

          const record = {
            round: roundIndex,
            id: call.id || `${roundIndex}-${fn.name}`,
            name: fn.name,
            arguments: args,
            result,
            error,
            status: error ? 'ERROR' : 'OK',
            durationMs,
          }
          trace.toolCalls.push(record)
          round.toolCalls.push(record)

          messages.push({
            role: 'tool',
            tool_name: fn.name,
            result,
            content: error ? `ERROR: ${error}` : JSON.stringify(result),
          })

          if (error) {
            round.status = 'ERROR'
            trace.rounds.push(round)
            finishTrace(trace, 'FAILED', startedAt)
            return {
              answer: `Falha na execução da ferramenta "${fn.name}": ${error}`,
              trace,
              error,
            }
          }
        }
        round.status = 'COMPLETE'
        trace.rounds.push(round)
      }

      throw new Error('maximum tool rounds exceeded')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      finishTrace(trace, 'FAILED', startedAt)
      if (!trace.rounds.length) {
        trace.rounds.push({ index: 1, toolCalls: [], status: 'ERROR', finalText: null })
      }
      return { answer: `Falha na execução: ${message}`, trace, error: message }
    }
  }

  toolSchemas() {
    return this.registry.schemas()
  }

  toolNames() {
    return this.registry.names()
  }
}

export function runAgent(userInput, options = {}) {
  const runtime = new NexusAgentRuntime({ maxToolRounds: options.maxToolRounds || 3 })
  return runtime.run(userInput, options)
}
