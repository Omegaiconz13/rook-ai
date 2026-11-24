import { describe, expect, test } from 'bun:test'

import type { ModelCallInput } from './loop'
import { parametersFor, readSseChunk, StreamAssembler, toolSpecs, toChatRequest } from './provider'

const frame = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`

describe('parametersFor', () => {
  test('turns the tool spec into the schema the model is given', () => {
    const schema = parametersFor({
      entry: { type: 'number', required: true, desc: 'entry price in dollars' },
      verdict: { type: 'string', desc: 'only these verdicts', values: ['APPROVED', 'BLOCKED'] },
      symbols: { type: 'strings', desc: 'tickers' },
      setupId: { type: 'string', desc: 'a setup id' },
    })
    expect(schema).toEqual({
      type: 'object',
      properties: {
        entry: { type: 'number', description: 'entry price in dollars' },
        verdict: { type: 'string', enum: ['APPROVED', 'BLOCKED'], description: 'only these verdicts' },
        symbols: { type: 'array', items: { type: 'string' }, description: 'tickers' },
        setupId: { type: 'string', description: 'a setup id' },
      },
      required: ['entry'],
    })
  })
})

describe('toolSpecs', () => {
  test('describes only tools that exist, with their real arguments', () => {
    const specs = toolSpecs(['gate_check', 'no_such_tool', 'size_plan'])
    expect(specs.map((spec) => spec.function.name)).toEqual(['gate_check', 'size_plan'])
    const size = specs[1].function.parameters as { properties: Record<string, unknown>; required: string[] }
    expect(Object.keys(size.properties)).toEqual(['entry', 'stop', 'symbol'])
    expect(size.required).toEqual(['entry', 'stop'])
  })
})

describe('toChatRequest', () => {
  test('maps every message shape, keeps the system prompt first and asks for a stream', () => {
    const input: ModelCallInput = {
      system: 'SYS',
      tools: ['get_quote'],
      messages: [
        { role: 'user', text: 'hi' },
        { role: 'assistant', text: '', calls: [{ id: 'c1', name: 'get_quote', args: { symbol: 'TSLA' } }] },
        { role: 'tool', id: 'c1', name: 'get_quote', result: '{"ok":true}' },
      ],
    }
    const request = toChatRequest(input, 'test-model')

    expect(request.model).toBe('test-model')
    expect(request.stream).toBe(true)
    expect(request.temperature).toBe(0)
    expect(request.messages).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: null,
        tool_calls: [{ id: 'c1', type: 'function', function: { name: 'get_quote', arguments: '{"symbol":"TSLA"}' } }],
      },
      { role: 'tool', tool_call_id: 'c1', content: '{"ok":true}' },
    ])
    expect(request.tools.map((tool) => tool.function.name)).toEqual(['get_quote'])
  })

  test('an assistant turn with prose keeps its text', () => {
    const request = toChatRequest(
      { system: 'S', tools: [], messages: [{ role: 'assistant', text: 'thinking', calls: [] }] },
      'm',
    )
    expect(request.messages[1]).toEqual({ role: 'assistant', content: 'thinking' })
  })
})

describe('readSseChunk', () => {
  test('carries a half-read line to the next chunk', () => {
    const first = readSseChunk('', 'data: {"a":1}\nda')
    expect(first.payloads).toEqual([{ a: 1 }])
    expect(first.carry).toBe('da')

    const second = readSseChunk(first.carry, 'ta: {"b":2}\n\ndata: [DONE]\n')
    expect(second.payloads).toEqual([{ b: 2 }])
    expect(second.carry).toBe('')
  })

  test('skips comments, event lines, empty data and a broken frame', () => {
    const read = readSseChunk('', ': keep-alive\nevent: message\ndata:\ndata: not json\ndata: {"ok":1}\n')
    expect(read.payloads).toEqual([{ ok: 1 }])
  })

  test('leaves a frame split mid-JSON unparsed rather than throwing', () => {
    expect(() => readSseChunk('', 'data: {"choices":\n')).not.toThrow()
  })
})

describe('StreamAssembler', () => {
  test('concatenates text and rebuilds calls from their fragments', () => {
    const assembler = new StreamAssembler()
    assembler.push({ choices: [{ delta: { content: 'Approved ' } }] })
    assembler.push({ choices: [{ delta: { content: 'six shares.' } }] })
    assembler.push({
      choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'gate_check', arguments: '{"setu' } }] } }],
    })
    assembler.push({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'pId":"TSLA-reclaim"}' } }] } }] })
    assembler.push({ choices: [{ delta: {} }], usage: { prompt_tokens: 1200, completion_tokens: 40 } })

    const reply = assembler.reply()
    expect(reply.text).toBe('Approved six shares.')
    expect(reply.calls).toEqual([{ id: 'c1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } }])
    expect(reply.tokensIn).toBe(1200)
    expect(reply.tokensOut).toBe(40)
  })

  test('keeps several calls in index order even when they interleave', () => {
    const assembler = new StreamAssembler()
    assembler.push({ choices: [{ delta: { tool_calls: [{ index: 1, id: 'b', function: { name: 'list_levels', arguments: '{}' } }] } }] })
    assembler.push({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'a', function: { name: 'get_quote', arguments: '{"symbol":"AMD"}' } }] } }] })

    expect(assembler.reply().calls?.map((call) => call.name)).toEqual(['get_quote', 'list_levels'])
  })

  test('a half-written argument object reaches the registry empty, not as a crash', () => {
    const assembler = new StreamAssembler()
    assembler.push({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'c1', function: { name: 'gate_check', arguments: '{"se' } }] } }] })
    expect(assembler.reply().calls?.[0].args).toEqual({})
  })

  test('an empty stream is an empty reply, not an invented one', () => {
    expect(new StreamAssembler().reply()).toEqual({ text: undefined, calls: [], tokensIn: undefined, tokensOut: undefined })
  })

  test('a nameless tool draft is dropped', () => {
    const assembler = new StreamAssembler()
    assembler.push({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{}' } }] } }] })
    expect(assembler.reply().calls).toEqual([])
  })
})

describe('frames end to end', () => {
  test('a whole recorded stream assembles to one reply', () => {
    const raw = [
      frame({ choices: [{ delta: { role: 'assistant', content: '' } }] }),
      frame({ choices: [{ delta: { content: 'The gate blocked it: ' } }] }),
      frame({ choices: [{ delta: { content: 'R-09.' } }] }),
      frame({ choices: [{ delta: { tool_calls: [{ index: 0, id: 'call_1', function: { name: 'gate_check', arguments: '{"setupId":"TSLA-reclaim"}' } }] } }] }),
      frame({ choices: [{ delta: {}, finish_reason: 'tool_calls' }] }),
      'data: [DONE]\n\n',
    ].join('')

    const read = readSseChunk('', raw)
    const assembler = new StreamAssembler()
    for (const payload of read.payloads) assembler.push(payload)

    const reply = assembler.reply()
    expect(reply.text).toBe('The gate blocked it: R-09.')
    expect(reply.calls?.[0]).toEqual({ id: 'call_1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } })
  })
})
