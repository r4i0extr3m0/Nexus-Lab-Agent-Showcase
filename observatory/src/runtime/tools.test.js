import { describe, expect, it } from 'vitest'
import {
  calculator,
  listSandboxFiles,
  readSandboxFile,
  runTests,
  safeSandboxPath,
} from './tools'

describe('calculator', () => {
  it('evaluates arithmetic without eval()', () => {
    expect(calculator('18 * 7').result).toBe(126)
    expect(calculator('144 / 12').result).toBe(12)
    expect(calculator('(2 + 3) * 4').result).toBe(20)
    expect(calculator('-5 + 2').result).toBe(-3)
  })

  it('rejects division by zero', () => {
    expect(() => calculator('1 / 0')).toThrow(/division by zero/)
  })

  it('rejects unsupported operations', () => {
    expect(() => calculator('2 ** 10')).toThrow(/unsupported/)
    expect(() => calculator('__import__("os")')).toThrow()
  })

  it('rejects oversized expressions', () => {
    expect(() => calculator('1'.repeat(101))).toThrow(/1-100 characters/)
  })
})

describe('sandbox tools', () => {
  it('lists sandbox files', () => {
    const result = listSandboxFiles()
    expect(result.root).toBe('showcase/sandbox')
    expect(result.files.length).toBe(3)
  })

  it('reads sandbox files', () => {
    const result = readSandboxFile('project_notes.txt')
    expect(result.content).toContain('Nexus Agent Showcase')
  })

  it('rejects path traversal', () => {
    expect(() => safeSandboxPath('../secret.txt')).toThrow(/escapes the allowed directory/)
    expect(() => readSandboxFile('/etc/passwd')).toThrow()
  })

  it('rejects unknown sandbox files', () => {
    expect(() => readSandboxFile('missing.txt')).toThrow(/not found/)
  })

  it('validates max_items bounds', () => {
    expect(() => listSandboxFiles(0)).toThrow(/max_items/)
    expect(() => listSandboxFiles(999)).toThrow(/max_items/)
  })
})

describe('run_tests', () => {
  it('returns a passing allowlisted command', () => {
    const result = runTests()
    expect(result.command).toBe('python -m pytest showcase/tests -q')
    expect(result.passed).toBe(true)
    expect(result.return_code).toBe(0)
  })
})
