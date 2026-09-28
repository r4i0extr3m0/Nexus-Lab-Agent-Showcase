// Deterministic evaluation — mirrors showcase/evaluate.py (routing suite).
// The live tool-calling evaluation is intentionally separated from this so
// infrastructure correctness is never confused with model variance.

import { EVAL_CASES } from '../data/evalCases'
import { planToolCalls } from './providers'
import { route as classify } from './router'
import { runAgent } from './runtime'

export function evaluateSuite({ withTrace = false } = {}) {
  return EVAL_CASES.map((testCase) => {
    const { route, confidence } = classify(testCase.prompt)
    const plan = planToolCalls(testCase.prompt)
    const firstTool = plan.length > 0 ? plan[0].name : null
    const routeOk = route === testCase.expected_route
    const toolOk = firstTool === testCase.expected_tool

    let trace = null
    if (withTrace) {
      trace = runAgent(testCase.prompt, { requestId: `eval-${testCase.id}` }).trace
    }

    return {
      ...testCase,
      selectedRoute: route,
      confidence,
      firstTool,
      plan,
      routeOk,
      toolOk,
      passed: routeOk && toolOk,
      trace,
    }
  })
}

export function summarizeEvaluation(results) {
  const total = results.length
  const passed = results.filter((result) => result.passed).length
  const routeAccurate = results.filter((result) => result.routeOk).length
  const toolAccurate = results.filter((result) => result.toolOk).length
  const avgLatency =
    results.filter((r) => r.trace).reduce((acc, r) => acc + r.trace.latencyMs, 0) /
    (results.filter((r) => r.trace).length || 1)

  return {
    total,
    passed,
    failed: total - passed,
    routeAccurate,
    toolAccurate,
    accuracy: total ? Math.round((passed / total) * 100) : 0,
    avgLatency: Math.round(avgLatency * 100) / 100,
  }
}
