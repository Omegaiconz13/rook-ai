import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { modelStatus, remoteModel } from './ninth-client'

const reply = (text: string, status = 200) => new Response(text, { status, headers: { 'content-type': 'application/json' } })

let realFetch: typeof fetch
beforeEach(() => {
  realFetch = globalThis.fetch
})
afterEach(() => {
  globalThis.fetch = realFetch
})

function stub(handler: () => Response | Promise<Response>) {
  globalThis.fetch = (async () => handler()) as unknown as typeof fetch
}

const input = {
  system: 'SYS',
  tools: ['get_quote'],
  messages: [{ role: 'user' as const, text: 'why was it blocked?' }],
}

describe('remoteModel', () => {
  test('rebuilds the reply from the streamed frames', async () => {
    stub(
      () =>
        new Response(
          [
            'data: {"choices":[{"delta":{"content":"Six shares "}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"approved."}}]}\n\n',
            'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"c1","function":{"name":"gate_check","arguments":"{\\"setupId\\":\\"TSLA-reclaim\\"}"}}]}}]}\n\n',
            'data: {"choices":[{"delta":{}}],"usage":{"prompt_tokens":900,"completion_tokens":30}}\n\n',
            'data: [DONE]\n\n',
          ].join(''),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
    )

    const result = await remoteModel().call(input)
    expect(result.text).toBe('Six shares approved.')
    expect(result.calls).toEqual([{ id: 'c1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } }])
    expect(result.tokensIn).toBe(900)
    expect(result.tokensOut).toBe(30)
  })

  test('throws the route’s own words when there is no model', async () => {
    stub(() => reply(JSON.stringify({ ok: false, error: 'No model is configured on this deployment.' }), 503))
    await expect(remoteModel().call(input)).rejects.toThrow('No model is configured')
  })

  test('a provider refusal is an error, never an empty answer', async () => {
    stub(() => reply(JSON.stringify({ ok: false, error: 'The provider answered 429.' }), 502))
    await expect(remoteModel().call(input)).rejects.toThrow('The provider answered 429.')
  })

  test('a body with no stream is an error', async () => {
    stub(() => new Response(null, { status: 200 }))
    await expect(remoteModel().call(input)).rejects.toThrow('no stream')
  })
})

describe('modelStatus', () => {
  test('reads the configured model', async () => {
    stub(() => reply(JSON.stringify({ ok: true, configured: true, model: 'test-model' })))
    expect(await modelStatus()).toEqual({ configured: true, model: 'test-model' })
  })

  test('an unreachable route is offline, not an error the panel shows', async () => {
    stub(() => reply('{}', 500))
    expect(await modelStatus()).toEqual({ configured: false, model: null })

    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await modelStatus()).toEqual({ configured: false, model: null })
  })
})
