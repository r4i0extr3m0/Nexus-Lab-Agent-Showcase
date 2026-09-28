// ExecutionTrace helpers. The runtime produces a plain, serialisable trace
// (mirroring ExecutionTrace in nexus_agent.py); these helpers derive the
// dashboard-friendly views without mutating it.

export function createTrace({ requestId, agent, confidence, provider, prompt, maxToolRounds }) {
  return {
    requestId,
    agent,
    confidence,
    provider,
    prompt,
    maxToolRounds,
    rounds: [],
    toolCalls: [],
    status: 'RUNNING',
    latencyMs: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  }
}

export function finishTrace(trace, status, startedAt) {
  trace.status = status
  trace.latencyMs = Math.round((performance.now() - startedAt) * 100) / 100
  trace.finishedAt = new Date().toISOString()
}

export function toolUsage(traces) {
  const counts = {}
  for (const trace of traces) {
    for (const call of trace.toolCalls) {
      counts[call.name] = (counts[call.name] || 0) + 1
    }
  }
  return counts
}

export function routeUsage(traces) {
  const counts = {}
  for (const trace of traces) {
    counts[trace.agent] = (counts[trace.agent] || 0) + 1
  }
  return counts
}

export function averageLatency(traces) {
  const finished = traces.filter((trace) => trace.status !== 'RUNNING')
  if (finished.length === 0) return 0
  const total = finished.reduce((acc, trace) => acc + trace.latencyMs, 0)
  return Math.round((total / finished.length) * 100) / 100
}

export function successRate(traces) {
  const finished = traces.filter((trace) => trace.status !== 'RUNNING')
  if (finished.length === 0) return 0
  const ok = finished.filter((trace) => trace.status === 'SUCCESS').length
  return Math.round((ok / finished.length) * 100)
}
