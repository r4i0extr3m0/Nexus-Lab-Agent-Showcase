import { describe, expect, it } from 'vitest'
import { NexusAgentRuntime } from './runtime'

describe('NexusAgentRuntime', () => {
  it('answers directly for core intents without tools', () => {
    const runtime = new NexusAgentRuntime()
    const { trace } = runtime.run('Explain what an AI agent is', { requestId: 'core-1' })
    expect(trace.agent).toBe('core')
    expect(trace.toolCalls).toHaveLength(0)
    expect(trace.status).toBe('SUCCESS')
  })

  it('executes a single tool and returns a final answer', () => {
    const runtime = new NexusAgentRuntime()
    const { answer, trace } = runtime.run('Calculate 18 * 7')
    expect(trace.toolCalls).toHaveLength(1)
    expect(trace.toolCalls[0].name).toBe('calculator')
    expect(answer).toContain('126')
    expect(trace.status).toBe('SUCCESS')
  })

  it('chains multiple tools across rounds', () => {
    const runtime = new NexusAgentRuntime()
    const { trace } = runtime.run('Read project_notes.txt and calculate 18 * 7')
    const toolRounds = trace.rounds.filter((round) => round.toolCalls.length > 0)
    expect(toolRounds).toHaveLength(2)
    expect(trace.toolCalls.map((call) => call.name)).toEqual([
      'read_sandbox_file',
      'calculator',
    ])
    expect(trace.status).toBe('SUCCESS')
  })

  it('records execution metadata on the trace', () => {
    const runtime = new NexusAgentRuntime()
    const { trace } = runtime.run('List the files in the sandbox', { requestId: 'meta-1' })
    expect(trace.requestId).toBe('meta-1')
    expect(trace.maxToolRounds).toBe(3)
    expect(trace.latencyMs).toBeGreaterThanOrEqual(0)
    expect(trace.startedAt).toBeTruthy()
    expect(trace.finishedAt).toBeTruthy()
  })

  it('fails explicitly when the round budget is exhausted', () => {
    const alwaysTool = {
      id: 'fake',
      plan: [],
      chat: () => ({
        message: {
          role: 'assistant',
          tool_calls: [
            { id: 'c1', function: { name: 'calculator', arguments: { expression: '1 + 1' } } },
          ],
        },
      }),
    }
    const runtime = new NexusAgentRuntime({ maxToolRounds: 2 })
    const { error, trace } = runtime.run('loop forever', { provider: alwaysTool })
    expect(error).toMatch(/maximum tool rounds exceeded/)
    expect(trace.status).toBe('FAILED')
    expect(trace.rounds).toHaveLength(2)
  })

  it('surfaces tool execution failures', () => {
    const brokenTool = {
      id: 'fake',
      plan: [],
      chat: () => ({
        message: {
          role: 'assistant',
          tool_calls: [
            { id: 'c1', function: { name: 'calculator', arguments: { expression: '1 / 0' } } },
          ],
        },
      }),
    }
    const runtime = new NexusAgentRuntime()
    const { error, trace } = runtime.run('divide by zero', { provider: brokenTool })
    expect(error).toMatch(/division by zero/)
    expect(trace.status).toBe('FAILED')
    expect(trace.toolCalls[0].status).toBe('ERROR')
  })

  it('rejects an invalid max_tool_rounds configuration', () => {
    expect(() => new NexusAgentRuntime({ maxToolRounds: 0 })).toThrow()
  })
})
