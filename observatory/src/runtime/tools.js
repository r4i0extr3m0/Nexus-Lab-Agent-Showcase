// Tool implementations — the capability boundary of the agent.
// Mirrors the handlers in showcase/nexus_agent.py: no eval(), no arbitrary I/O.

import { SANDBOX_ROOT, getSandboxFile, listSandboxPaths } from '../data/sandbox'

// ---------------------------------------------------------------------------
// calculator — a tiny arithmetic parser (AST-equivalent), never eval().
// ---------------------------------------------------------------------------

function tokenize(source) {
  const tokens = []
  let index = 0
  while (index < source.length) {
    const char = source[index]
    if (char === ' ' || char === '\t') {
      index += 1
      continue
    }
    if ('+-*/%()'.includes(char)) {
      tokens.push({ type: char, value: char })
      index += 1
      continue
    }
    if (/[0-9.]/.test(char)) {
      let literal = ''
      while (index < source.length && /[0-9.]/.test(source[index])) {
        literal += source[index]
        index += 1
      }
      if ((literal.match(/\./g) || []).length > 1) {
        throw new Error('invalid arithmetic expression')
      }
      tokens.push({ type: 'number', value: Number(literal) })
      continue
    }
    throw new Error('expression contains unsupported operations')
  }
  return tokens
}

function parseExpression(tokens) {
  let cursor = 0
  const peek = () => tokens[cursor]
  const consume = () => tokens[cursor++]

  function parseAdditive() {
    let node = parseMultiplicative()
    while (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = consume().type
      node = { op, left: node, right: parseMultiplicative() }
    }
    return node
  }

  function parseMultiplicative() {
    let node = parseUnary()
    while (peek() && (peek().type === '*' || peek().type === '/' || peek().type === '%')) {
      const op = consume().type
      node = { op, left: node, right: parseUnary() }
    }
    return node
  }

  function parseUnary() {
    if (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = consume().type
      return { op: op === '-' ? 'neg' : 'pos', operand: parseUnary() }
    }
    return parsePrimary()
  }

  function parsePrimary() {
    const token = peek()
    if (!token) throw new Error('invalid arithmetic expression')
    if (token.type === 'number') {
      consume()
      return { op: 'number', value: token.value }
    }
    if (token.type === '(') {
      consume()
      const node = parseAdditive()
      if (!peek() || peek().type !== ')') throw new Error('unbalanced parentheses')
      consume()
      return node
    }
    throw new Error('expression contains unsupported operations')
  }

  const tree = parseAdditive()
  if (cursor !== tokens.length) throw new Error('expression contains unsupported operations')
  return tree
}

function evaluate(node) {
  switch (node.op) {
    case 'number':
      return node.value
    case 'neg':
      return -evaluate(node.operand)
    case 'pos':
      return evaluate(node.operand)
    case '+':
      return evaluate(node.left) + evaluate(node.right)
    case '-':
      return evaluate(node.left) - evaluate(node.right)
    case '*':
    case '/':
    case '%': {
      const left = evaluate(node.left)
      const right = evaluate(node.right)
      if (Math.abs(left) > 1_000_000 || Math.abs(right) > 1_000_000) {
        throw new Error('arithmetic operands are too large')
      }
      if (node.op === '*') return left * right
      if (node.op === '/') {
        if (right === 0) throw new Error('division by zero')
        return left / right
      }
      if (right === 0) throw new Error('division by zero')
      return left % right
    }
    default:
      throw new Error('expression contains unsupported operations')
  }
}

export function calculator(expression) {
  if (!expression || expression.length > 100) {
    throw new Error('expression must contain 1-100 characters')
  }
  const tokens = tokenize(expression)
  if (tokens.length === 0) throw new Error('invalid arithmetic expression')
  const value = evaluate(parseExpression(tokens))
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error('expression did not produce a number')
  }
  return { expression, result: value }
}

// ---------------------------------------------------------------------------
// Read-only, path-traversal-safe sandbox access.
// ---------------------------------------------------------------------------

export function safeSandboxPath(relativePath) {
  if (!relativePath || relativePath.length > 200) {
    throw new Error('path must contain 1-200 characters')
  }
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
  const segments = normalized.split('/')
  if (segments.includes('..') || normalized.startsWith('/')) {
    throw new Error('sandbox path escapes the allowed directory')
  }
  return normalized
}

export function listSandboxFiles(maxItems = 20) {
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > 50) {
    throw new Error('max_items must be between 1 and 50')
  }
  const files = listSandboxPaths()
  return {
    root: SANDBOX_ROOT,
    files: files.slice(0, maxItems),
    truncated: files.length > maxItems,
  }
}

export function readSandboxFile(path, maxChars = 4000) {
  if (!Number.isInteger(maxChars) || maxChars < 1 || maxChars > 8000) {
    throw new Error('max_chars must be between 1 and 8000')
  }
  const safePath = safeSandboxPath(path)
  const content = getSandboxFile(safePath)
  if (content === undefined) {
    throw new Error(`sandbox file not found: ${path}`)
  }
  return {
    path: safePath,
    content: content.slice(0, maxChars),
    truncated: content.length > maxChars,
  }
}

// ---------------------------------------------------------------------------
// project_status — structured runtime introspection.
// ---------------------------------------------------------------------------

export function projectStatus() {
  return {
    project: 'Nexus Agent Showcase',
    architecture: 'router -> runtime -> tools -> trace',
    inference: 'Ollama local',
    max_tool_rounds: 3,
  }
}

// ---------------------------------------------------------------------------
// run_tests — the allowlisted test runner. The browser cannot spawn pytest, so
// the showcase's deterministic suite is replayed here.
// ---------------------------------------------------------------------------

export const TEST_SUITE_CASES = [
  'test_router_routes_testing_intent',
  'test_router_routes_tools_intent',
  'test_router_routes_project_intent',
  'test_router_defaults_to_core_with_low_confidence',
  'test_registry_rejects_unregistered_tool',
  'test_registry_rejects_missing_required_argument',
  'test_registry_rejects_unknown_argument',
  'test_registry_rejects_invalid_type',
  'test_calculator_evaluates_expression',
  'test_calculator_rejects_unsafe_expression',
  'test_sandbox_rejects_path_traversal',
  'test_runtime_stops_after_round_budget',
  'test_runtime_returns_final_response',
  'test_trace_records_request_metadata',
]

export function runTests() {
  const total = TEST_SUITE_CASES.length
  const lines = TEST_SUITE_CASES.map((name) => `showcase/tests/test_nexus_agent.py::${name} PASSED`)
  const output = ['============================= test session starts =============================', ...lines, `============================= ${total} passed in 0.42s =============================`].join('\n')
  return {
    command: 'python -m pytest showcase/tests -q',
    return_code: 0,
    passed: true,
    output,
    total,
  }
}
