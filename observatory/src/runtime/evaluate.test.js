import { describe, expect, it } from 'vitest'
import { evaluateSuite, summarizeEvaluation } from './evaluate'

describe('deterministic evaluation', () => {
  it('passes all ten curated routing cases', () => {
    const results = evaluateSuite()
    const failures = results.filter((result) => !result.passed)
    expect(failures).toEqual([])
    expect(results).toHaveLength(10)
  })

  it('summarises the suite', () => {
    const results = evaluateSuite({ withTrace: true })
    const summary = summarizeEvaluation(results)
    expect(summary.total).toBe(10)
    expect(summary.passed).toBe(10)
    expect(summary.failed).toBe(0)
    expect(summary.accuracy).toBe(100)
    expect(summary.avgLatency).toBeGreaterThanOrEqual(0)
  })
})
