import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BIN_DIR, ensureDirs } from './store'

export const MCP_SERVER_PATH = join(BIN_DIR, 'garage-mcp.mjs')

const MCP_SERVER_SCRIPT = `#!/usr/bin/env node
// The Garage MCP server — exposes ~/.devflow/memory.md over stdio.
import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const MEMORY_PATH = join(homedir(), '.devflow', 'memory.md')

const readMemory = () => (existsSync(MEMORY_PATH) ? readFileSync(MEMORY_PATH, 'utf-8') : '')
const writeMemory = (content) => {
  mkdirSync(join(homedir(), '.devflow'), { recursive: true })
  writeFileSync(MEMORY_PATH, content, 'utf-8')
  return 'Memory updated.'
}
const appendMemory = (item) => {
  const content = readMemory()
  writeMemory((content.trimEnd() + '\\n- ' + item + '\\n').replace(/^\\n+/, content ? '' : '# Memory\\n\\n'))
  return 'Memory item added.'
}
const searchMemory = (query) =>
  readMemory()
    .split('\\n')
    .filter((line) => line.toLowerCase().includes(query.toLowerCase()))
    .join('\\n') || 'No matches.'

const tools = [
  {
    name: 'memory_read',
    description: 'Read the shared Garage memory',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'memory_write',
    description: 'Replace the shared Garage memory content',
    inputSchema: {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content']
    }
  },
  {
    name: 'memory_append',
    description: 'Append a bullet item to the shared Garage memory',
    inputSchema: {
      type: 'object',
      properties: { item: { type: 'string' } },
      required: ['item']
    }
  },
  {
    name: 'memory_search',
    description: 'Search lines of the shared Garage memory',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  }
]

const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\\n')
const fail = (id, message) =>
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code: -32601, message } }) + '\\n')
const textResult = (text) => ({ content: [{ type: 'text', text }] })

const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }
  if (!msg || msg.id === undefined) return
  const { id, method, params } = msg
  if (method === 'initialize') {
    reply(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'garage', version: '1.0.0' }
    })
  } else if (method === 'ping') {
    reply(id, {})
  } else if (method === 'tools/list') {
    reply(id, { tools })
  } else if (method === 'tools/call') {
    const args = params?.arguments ?? {}
    if (params?.name === 'memory_read') reply(id, textResult(readMemory()))
    else if (params?.name === 'memory_write') reply(id, textResult(writeMemory(String(args.content ?? ''))))
    else if (params?.name === 'memory_append') reply(id, textResult(appendMemory(String(args.item ?? ''))))
    else if (params?.name === 'memory_search') reply(id, textResult(searchMemory(String(args.query ?? ''))))
    else fail(id, 'Unknown tool')
  } else {
    fail(id, 'Method not found')
  }
})
`

export function ensureMcpServer(): string {
  ensureDirs()
  writeFileSync(MCP_SERVER_PATH, MCP_SERVER_SCRIPT, { mode: 0o755 })
  return MCP_SERVER_PATH
}

export function isMcpServerInstalled(): boolean {
  return existsSync(MCP_SERVER_PATH)
}
