import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import app from './index'

/*
  The route is the only place a key exists. These tests stub `fetch`, so the whole
  route runs — validation, request building, the upstream call, the streamed
  response — with no network and no real key.
*/

const ASSETS = { fetch: async () => new Response('asset') }
type Env = { ASSETS: typeof ASSETS; MODEL_API_KEY?: string; MODEL_BASE_URL?: string; MODEL_NAME?: string }

const env = (over: Partial<Env> = {}) => ({ ASSETS, ...over }) as never

const turn = { system: 'SYS', messages: [{ role: 'user', text: 'why was it blocked?' }], tools: ['gate_check'] }

function post(body: unknown, over: Partial<Env> = {}, headers: Record<string, string> = {}) {
  return app.request(
    '/api/ninth/turn',
    { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) },
    env(over),
  )
}

let realFetch: typeof fetch
let sent: { url: string; init: RequestInit } | null = null

beforeEach(() => {
  realFetch = globalThis.fetch
  sent = null
})

afterEach(() => {
  globalThis.fetch = realFetch
})

function stub(handler: (url: string, init: RequestInit) => Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    sent = { url, init }
    return handler(url, init)
  }) as typeof fetch
}

describe('/api/ninth/model', () => {
  test('says it has no model when no key is set', async () => {
    const response = await app.request('/api/ninth/model', {}, env())
    expect(await response.json()).toEqual({ ok: true, configured: false, model: null })
  })

  test('names the configured model, and never the key', async () => {
    const response = await app.request('/api/ninth/model', {}, env({ MODEL_API_KEY: 'test-key', MODEL_NAME: 'test-model' }))
    const body = (await response.json()) as Record<string, unknown>
    expect(body).toEqual({ ok: true, configured: true, model: 'test-model' })
    expect(JSON.stringify(body)).not.toContain('test-key')
  })
})

describe('/api/ninth/turn without a key', () => {
  test('refuses with 503 and says the panel keeps answering from the desk', async () => {
    const response = await post(turn)
    expect(response.status).toBe(503)
    const body = (await response.json()) as { error?: string }
    expect(body.error).toContain('No model is configured')
  })

  test('refuses another origin before it even looks for a key', async () => {
    const response = await post(turn, { MODEL_API_KEY: 'test-key' }, { origin: 'https://example.com' })
    expect(response.status).toBe(403)
  })

  test('accepts the same origin', async () => {
    stub(async () => new Response('data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }))
    const response = await post(turn, { MODEL_API_KEY: 'test-key' }, { origin: 'http://localhost' })
    expect(response.status).toBe(200)
  })
})

describe('/api/ninth/turn with a key', () => {
  test('refuses a body that is not JSON', async () => {
    const response = await app.request(
      '/api/ninth/turn',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'not json' },
      env({ MODEL_API_KEY: 'test-key' }),
    )
    expect(response.status).toBe(400)
  })

  test('refuses a turn with no messages or tools', async () => {
    const response = await post({ system: 'SYS' }, { MODEL_API_KEY: 'test-key' })
    expect(response.status).toBe(422)
  })

  test('refuses a prompt larger than the route accepts', async () => {
    const response = await post({ ...turn, system: 'x'.repeat(40_001) }, { MODEL_API_KEY: 'test-key' })
    expect(response.status).toBe(413)
  })

  test('sends the key upstream and streams the answer back', async () => {
    stub(async () => new Response('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }))
    const response = await post(turn, { MODEL_API_KEY: 'test-key', MODEL_NAME: 'test-model', MODEL_BASE_URL: 'https://provider.test/v1/' })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/event-stream')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toContain('"content":"hi"')

    const request = sent as { url: string; init: RequestInit }
    expect(request.url).toBe('https://provider.test/v1/chat/completions')
    expect((request.init.headers as Record<string, string>).authorization).toBe('Bearer test-key')

    const body = JSON.parse(String(request.init.body)) as {
      model: string
      messages: { role: string; content: string }[]
      tools: { function: { name: string } }[]
    }
    expect(body.model).toBe('test-model')
    expect(body.messages[0]).toEqual({ role: 'system', content: 'SYS' })
    expect(body.tools[0].function.name).toBe('gate_check')
  })

  test('reports a provider refusal instead of an empty answer', async () => {
    stub(async () => new Response('rate limited', { status: 429 }))
    const response = await post(turn, { MODEL_API_KEY: 'test-key' })
    expect(response.status).toBe(502)
    const body = (await response.json()) as { error?: string; detail?: string }
    expect(body.error).toBe('The provider answered 429.')
    expect(body.detail).toBe('rate limited')
  })

  test('reports an unreachable provider', async () => {
    stub(async () => {
      throw new Error('connection refused')
    })
    const response = await post(turn, { MODEL_API_KEY: 'test-key' })
    expect(response.status).toBe(502)
    expect(((await response.json()) as { error?: string }).error).toContain('could not be reached')
  })
})
