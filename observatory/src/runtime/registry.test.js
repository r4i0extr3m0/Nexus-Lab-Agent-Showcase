import { describe, expect, it } from 'vitest'
import { ToolRegistry, buildDefaultRegistry } from './registry'

describe('ToolRegistry', () => {
  it('exposes the five showcase tools', () => {
    expect(buildDefaultRegistry().names()).toEqual([
      'calculator',
      'list_sandbox_files',
      'project_status',
      'read_sandbox_file',
      'run_tests',
    ])
  })

  it('rejects unregistered tools', () => {
    const registry = buildDefaultRegistry()
    expect(() => registry.execute('shell', {})).toThrow(/tool not registered/)
  })

  it('rejects missing required arguments', () => {
    const registry = buildDefaultRegistry()
    expect(() => registry.execute('calculator', {})).toThrow(/missing required arguments/)
  })

  it('rejects unknown arguments', () => {
    const registry = buildDefaultRegistry()
    expect(() => registry.execute('calculator', { expression: '1+1', extra: true })).toThrow(
      /unknown arguments/,
    )
  })

  it('rejects invalid argument types', () => {
    const registry = buildDefaultRegistry()
    expect(() => registry.execute('calculator', { expression: 5 })).toThrow(/invalid type/)
  })

  it('dispatches valid calls', () => {
    const registry = buildDefaultRegistry()
    expect(registry.execute('calculator', { expression: '18 * 7' }).result).toBe(126)
  })

  it('does not allow duplicate registration', () => {
    const registry = new ToolRegistry()
    registry.register({ name: 'noop', description: 'x', parameters: {}, handler: () => null })
    expect(() =>
      registry.register({ name: 'noop', description: 'x', parameters: {}, handler: () => null }),
    ).toThrow(/already registered/)
  })
})
