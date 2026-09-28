// ToolRegistry — the capability boundary.
// Mirrors ToolRegistry in showcase/nexus_agent.py: discovery, schemas,
// required/unknown-argument checks, basic type checks and dispatch.
// A tool is never executable merely because its name came from the model.

import {
  calculator,
  listSandboxFiles,
  projectStatus,
  readSandboxFile,
  runTests,
} from './tools'

const TYPE_MAP = {
  string: (value) => typeof value === 'string',
  integer: (value) => Number.isInteger(value),
  number: (value) => typeof value === 'number' && Number.isFinite(value),
  boolean: (value) => typeof value === 'boolean',
  array: (value) => Array.isArray(value),
  object: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
}

export class ToolRegistry {
  constructor() {
    this.tools = new Map()
  }

  register(spec) {
    if (this.tools.has(spec.name)) {
      throw new Error(`tool already registered: ${spec.name}`)
    }
    this.tools.set(spec.name, spec)
    return this
  }

  schemas() {
    return [...this.tools.values()].map((spec) => ({
      type: 'function',
      function: {
        name: spec.name,
        description: spec.description,
        parameters: spec.parameters,
      },
    }))
  }

  names() {
    return [...this.tools.keys()].sort()
  }

  get(name) {
    return this.tools.get(name)
  }

  static validate(spec, args) {
    if (args === null || typeof args !== 'object' || Array.isArray(args)) {
      throw new Error(`tool arguments must be an object: ${spec.name}`)
    }

    const schema = spec.parameters
    const properties = schema.properties || {}
    const required = new Set(schema.required || [])

    const missing = [...required].filter((key) => !(key in args)).sort()
    if (missing.length > 0) {
      throw new Error(`missing required arguments for ${spec.name}: ${missing.join(', ')}`)
    }

    if (schema.additionalProperties === false) {
      const unknown = Object.keys(args)
        .filter((key) => !(key in properties))
        .sort()
      if (unknown.length > 0) {
        throw new Error(`unknown arguments for ${spec.name}: ${unknown.join(', ')}`)
      }
    }

    for (const [key, value] of Object.entries(args)) {
      const expected = properties[key]?.type
      const check = expected ? TYPE_MAP[expected] : null
      if (check && !check(value)) {
        throw new Error(
          `invalid type for ${spec.name}.${key}: expected ${expected}, got ${typeof value}`,
        )
      }
    }
  }

  execute(name, args) {
    const spec = this.tools.get(name)
    if (!spec) {
      throw new Error(`tool not registered: ${name}`)
    }
    ToolRegistry.validate(spec, args)
    return spec.handler(args)
  }
}

export function buildDefaultRegistry() {
  const registry = new ToolRegistry()

  registry
    .register({
      name: 'calculator',
      description: 'Calculate a small arithmetic expression.',
      category: 'compute',
      parameters: {
        type: 'object',
        properties: { expression: { type: 'string' } },
        required: ['expression'],
        additionalProperties: false,
      },
      handler: ({ expression }) => calculator(expression),
    })
    .register({
      name: 'project_status',
      description: 'Return structured status information for the Nexus Agent showcase.',
      category: 'introspection',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      handler: () => projectStatus(),
    })
    .register({
      name: 'list_sandbox_files',
      description: 'List files in the read-only showcase sandbox.',
      category: 'io',
      parameters: {
        type: 'object',
        properties: { max_items: { type: 'integer' } },
        required: [],
        additionalProperties: false,
      },
      handler: ({ max_items }) => listSandboxFiles(max_items ?? 20),
    })
    .register({
      name: 'read_sandbox_file',
      description: 'Read a UTF-8 text file from the read-only showcase sandbox.',
      category: 'io',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' }, max_chars: { type: 'integer' } },
        required: ['path'],
        additionalProperties: false,
      },
      handler: ({ path, max_chars }) => readSandboxFile(path, max_chars ?? 4000),
    })
    .register({
      name: 'run_tests',
      description: 'Run only the showcase test suite.',
      category: 'workflow',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      handler: () => runTests(),
    })

  return registry
}
