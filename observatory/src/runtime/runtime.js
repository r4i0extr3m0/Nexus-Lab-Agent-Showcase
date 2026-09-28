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

export async function runAgentAsync(userInput, options = {}) {
  try {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userInput,
        request_id: options.requestId,
        provider: options.provider || 'ollama',
        max_tool_rounds: options.maxToolRounds || 3
      })
    })
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`)
    }
    
    const data = await res.json()
    return {
      answer: data.answer,
      trace: data.trace,
      error: data.error
    }
  } catch (err) {
    return {
      answer: `Falha de conexão com a API: ${err.message}`,
      trace: {
        requestId: options.requestId,
        agent: 'unknown',
        status: 'FAILED',
        rounds: []
      },
      error: err.message
    }
  }
}

