import type { ModelCallInput, ModelMessage, ModelReply, ModelToolCall } from './loop'
import { toolByName } from './registry'
import type { ArgsSpec } from './types'

/*
  The provider adapter, as plain functions. It speaks the OpenAI-compatible
  chat-completions shape, which is the one thing nearly every provider (and a
  local Ollama) agrees on, so the desk is not married to a vendor.

  Nothing here fetches: request building and stream parsing are pure, which is
  what lets them be tested against recorded frames instead of a live key. The
  Worker owns the key and the socket; the browser owns the loop.
*/

export type ToolSpec = {
  type: 'function'
  function: { name: string; description: string; parameters: Record<string, unknown> }
}

export type ChatRequest = {
  model: string
  stream: true
  temperature: number
  messages: Record<string, unknown>[]
  tools: ToolSpec[]
}

/** JSON Schema for one tool's arguments, built from the spec the args parser enforces. */
export function parametersFor(args: ArgsSpec): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const [name, spec] of Object.entries(args)) {
    const base: Record<string, unknown> = { description: spec.desc }
    if (spec.type === 'number' || spec.type === 'integer') {
      properties[name] = { type: spec.type, ...base }
    } else if (spec.type === 'strings') {
      properties[name] = { type: 'array', items: { type: 'string' }, ...base }
    } else {
      properties[name] = { type: 'string', ...base }
      if (spec.values) properties[name] = { type: 'string', enum: [...spec.values], ...base }
    }
    if (spec.required) required.push(name)
  }

  return { type: 'object', properties, required }
}

/** The specs for the tools this turn may call; names that do not exist are dropped. */
export function toolSpecs(names: string[]): ToolSpec[] {
  const specs: ToolSpec[] = []
  for (const name of names) {
    const entry = toolByName(name)
    if (!entry) continue
    specs.push({
      type: 'function',
      function: { name: entry.name, description: entry.description, parameters: parametersFor(entry.args) },
    })
  }
  return specs
}

/** One of our messages as the provider wants it. Ours is the narrower shape. */
export function toChatMessage(message: ModelMessage): Record<string, unknown> {
  if (message.role === 'user') return { role: 'user', content: message.text }
  if (message.role === 'tool') return { role: 'tool', tool_call_id: message.id, content: message.result }
  return {
    role: 'assistant',
    content: message.text || null,
    ...(message.calls.length > 0
      ? {
          tool_calls: message.calls.map((call) => ({
            id: call.id,
            type: 'function',
            function: { name: call.name, arguments: JSON.stringify(call.args ?? {}) },
          })),
        }
      : {}),
  }
}

export function toChatRequest(input: ModelCallInput, model: string): ChatRequest {
  return {
    model,
    stream: true,
    // The desk wants the same answer twice for the same question, not a vivid one.
    temperature: 0,
    messages: [{ role: 'system', content: input.system }, ...input.messages.map(toChatMessage)],
    tools: toolSpecs(input.tools),
  }
}

/**
 * Split an SSE stream into parsed frames. Bytes arrive in arbitrary slices, so
 * the tail of an unfinished line is carried to the next read. Comments, `event:`
 * lines and `[DONE]` carry nothing to assemble, and one malformed frame is
 * skipped rather than thrown: a broken chunk must not abort a turn that already
 * had a good first half.
 */
export function readSseChunk(carry: string, chunk: string): { carry: string; payloads: unknown[] } {
  const lines = (carry + chunk).split('\n')
  const rest = lines.pop() ?? ''
  const payloads: unknown[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(':') || trimmed.startsWith('event:')) continue
    if (!trimmed.startsWith('data:')) continue
    const data = trimmed.slice(5).trim()
    if (!data || data === '[DONE]') continue
    try {
      payloads.push(JSON.parse(data))
    } catch {
      /* a broken frame is skipped, not fatal */
    }
  }

  return { carry: rest, payloads }
}

type StreamChunk = {
  choices?: { delta?: { content?: string | null; tool_calls?: StreamToolCall[] } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

type StreamToolCall = { index?: number; id?: string; function?: { name?: string; arguments?: string } }

function parseArgs(text: string): unknown {
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch {
    // The registry validates arguments anyway; a half-written call reaches it as
    // an empty object and comes back as a tool-shaped error the model can read.
    return {}
  }
}

/**
 * Rebuild one reply from a stream of deltas: text concatenated, tool calls
 * gathered by index with their argument fragments joined, usage taken from
 * whichever frame carried it.
 */
export class StreamAssembler {
  private text = ''
  private calls = new Map<number, { id: string; name: string; args: string }>()
  private tokensIn: number | undefined
  private tokensOut: number | undefined

  push(payload: unknown): void {
    if (!payload || typeof payload !== 'object') return
    const chunk = payload as StreamChunk
    const delta = chunk.choices?.[0]?.delta
    if (typeof delta?.content === 'string') this.text += delta.content

    for (const part of delta?.tool_calls ?? []) {
      const index = typeof part.index === 'number' ? part.index : 0
      const call = this.calls.get(index) ?? { id: '', name: '', args: '' }
      if (part.id) call.id = part.id
      // Providers send the name whole, in one frame; arguments arrive in pieces.
      if (part.function?.name && !call.name) call.name = part.function.name
      if (part.function?.arguments) call.args += part.function.arguments
      this.calls.set(index, call)
    }

    if (chunk.usage) {
      if (typeof chunk.usage.prompt_tokens === 'number') this.tokensIn = chunk.usage.prompt_tokens
      if (typeof chunk.usage.completion_tokens === 'number') this.tokensOut = chunk.usage.completion_tokens
    }
  }

  reply(): ModelReply {
    const calls: ModelToolCall[] = [...this.calls.entries()]
      .sort((a, b) => a[0] - b[0])
      .filter(([, call]) => call.name !== '')
      .map(([index, call]) => ({ id: call.id || `call-${index}`, name: call.name, args: parseArgs(call.args) }))

    return { text: this.text || undefined, calls, tokensIn: this.tokensIn, tokensOut: this.tokensOut }
  }
}
