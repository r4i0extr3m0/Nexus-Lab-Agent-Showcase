import { describe, expect, it } from 'vitest'
import { route } from './router'

describe('IntentRouter', () => {
  it('routes testing intents', () => {
    expect(route('Run the test suite').route).toBe('testing')
  })

  it('routes tool intents', () => {
    expect(route('Calculate 18 * 7').route).toBe('tools')
    expect(route('List the files in the sandbox').route).toBe('tools')
  })

  it('routes project intents', () => {
    expect(route('Show the project architecture').route).toBe('project')
  })

  it('defaults to core with low confidence when nothing matches', () => {
    const result = route('Explain what an AI agent is')
    expect(result.route).toBe('core')
    expect(result.confidence).toBe(0.5)
  })

  it('produces confidence inside [0, 1]', () => {
    for (const prompt of ['test', 'tool sandbox read file', 'project status nexus']) {
      const { confidence } = route(prompt)
      expect(confidence).toBeGreaterThanOrEqual(0)
      expect(confidence).toBeLessThanOrEqual(1)
    }
  })
})
