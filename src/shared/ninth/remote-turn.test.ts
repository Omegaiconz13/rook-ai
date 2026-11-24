import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

import { remoteModel } from '../../lib/ninth-client'
import app from '../../worker/index'
import { runTurn } from './loop'
import { testContext } from './testctx'

/*
  The whole model path, with no key and no network: a fake provider on loopback
  speaks OpenAI-compatible SSE, the Worker route proxies it, the browser client
  rebuilds the reply, and the real loop dispatches the real `get_quote` against
  the real fixtures. The only thing this cannot prove is the provider itself.

  The provider is scripted like a model: first call asks for a quote, second call
  writes the answer — so a passing test means the tool result actually travelled
  back upstream, not just that frames parse.
*/

type Sent = { model: string; messages: { role: string; content: string | null }[]; tools: { function: { name: string } }[] }

const upstream: Sent[] = []
let server: ReturnType<typeof Bun.serve>
let base = ''
let realFetch: typeof fetch

function frames(list: unknown[]): Response {
  const body = list.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join('') + 'data: [DONE]\n\n'
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } })
}

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const body = (await request.json()) as Sent
      upstream.push(body)
      const hasToolResult = body.messages.some((message) => message.role === 'tool')

      return hasToolResult
        ? frames([
            { choices: [{ delta: { content: 'TSLA last traded at ' } }] },
            { choices: [{ delta: { content: '379.42 on the 5-minute chart.' } }] },
            { choices: [{ delta: {} }], usage: { prompt_tokens: 800, completion_tokens: 12 } },
          ])
        : frames([
            {
              choices: [
                {
                  delta: {
                    tool_calls: [{ index: 0, id: 'c1', function: { name: 'get_quote', arguments: '{"symbol":"TSLA"}' } }],
                  },
                },
              ],
            },
            { choices: [{ delta: {} }], usage: { prompt_tokens: 500, completion_tokens: 20 } },
          ])
    },
  })

  base = `http://127.0.0.1:${server.port}/v1`
  realFetch = globalThis.fetch

  // The browser's fetch reaches the Worker without a socket; everything else
  // (the route's call to the provider) is a real fetch to loopback.
  const env = {
    ASSETS: { fetch: async () => new Response('') },
    MODEL_API_KEY: 'test-key',
    MODEL_BASE_URL: base,
    MODEL_NAME: 'fake-model',
  }
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url === '/api/ninth/turn') return app.request(url, init, env as never)
    return realFetch(input, init)
  }) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = realFetch
  server.stop(true)
})

describe('a model turn, end to end', () => {
  test('the model calls a tool, the loop runs it, and the answer comes back', async () => {
    const result = await runTurn({
      question: 'what is the last price of TSLA?',
      ctx: testContext(),
      model: remoteModel(),
    })

    expect(result.text).toBe('TSLA last traded at 379.42 on the 5-minute chart.')
    expect(result.steps).toBe(2)
    expect(result.stopped).toBe('done')
    expect(result.skills.length).toBeGreaterThan(0)
    expect(result.refs).toContain('chart:TSLA:5')
    expect(result.tokensIn).toBe(1300)
    expect(result.tokensOut).toBe(32)

    const tool = result.audit.find((row) => row.kind === 'tool')
    expect(tool?.tool).toBe('get_quote')
    expect(tool?.status).toBe('ok')
    expect(tool?.tier).toBe(1)
  })

  test('the tool’s real result reached the provider, which is why it could answer', () => {
    expect(upstream).toHaveLength(2)

    const [first, second] = upstream
    expect(first.model).toBe('fake-model')
    expect(first.messages[0].role).toBe('system')
    expect(first.messages[0].content).toContain('get_quote')

    const sent = second.messages[second.messages.length - 1]
    expect(sent.role).toBe('tool')
    expect(String(sent.content)).toContain('379.42')
    expect(second.tools.map((tool) => tool.function.name)).toContain('get_quote')
  })
})
