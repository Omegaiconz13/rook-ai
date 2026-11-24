import { describe, expect, test } from 'bun:test'

import app from './index'

/*
  The docs surface is what an agent reads first, so its contract is worth pinning:
  a real document gets `text/markdown`, a missing or unknown one gets 404 rather
  than the SPA fallback relabelled as markdown.
*/

const DOCS: Record<string, string> = {
  '/llms.txt': '# Rook\n\n> A paper trading desk.\n',
  '/docs/index.md': '# Rook — the desk\n',
  '/docs/rules.md': '# The gate\n\n| R-01 | Kill switch is off |\n',
  '/docs/journal.md': '# The journal\n',
  '/docs/ninth.md': '# Ninth — the harness\n',
  '/docs/skill.md': '# Skill: using the Rook desk\n',
}

/** A stand-in for the assets binding: real docs as markdown, anything else as the SPA shell. */
const ASSETS = {
  fetch: async (request: Request) => {
    const { pathname } = new URL(request.url)
    const body = DOCS[pathname]
    if (body) return new Response(body, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
    return new Response('<!doctype html><title>app</title>', { headers: { 'content-type': 'text/html; charset=utf-8' } })
  },
}

const env = { ASSETS } as never

const get = (path: string) => app.request(path, {}, env)

describe('docs surface', () => {
  test('llms.txt is markdown, points back to itself, and is cacheable', async () => {
    const response = await get('/llms.txt')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('link')).toBe('</llms.txt>; rel="llms"')
    expect(response.headers.get('cache-control')).toContain('max-age=300')
    expect(await response.text()).toContain('# Rook')
  })

  test.each(Object.keys(DOCS).filter((p) => p.startsWith('/docs/')))('%s is served as markdown', async (path) => {
    const response = await get(path)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(response.headers.get('link')).toContain('rel="llms"')
    expect((await response.text()).length).toBeGreaterThan(10)
  })

  test('an unknown slug is a 404 listing the real docs, not the app shell', async () => {
    const response = await get('/docs/pricing.md')
    expect(response.status).toBe(404)
    const payload = (await response.json()) as { ok: boolean; error: string }
    expect(payload.ok).toBe(false)
    expect(payload.error).toContain('/docs/rules.md')
    expect(payload.error).not.toContain('<html')
  })

  test('non-markdown and traversal-shaped paths are refused', async () => {
    for (const path of ['/docs/rules', '/docs/rules.txt', '/docs/..%2fsecret.md', '/docs/UPPER.md']) {
      const response = await get(path)
      expect(response.status).toBe(404)
    }
  })

  test('a doc missing from the build is a 404, never the SPA fallback', async () => {
    // `index` is on the allowlist but this asset map has no copy of it at the root.
    const missing = {
      fetch: async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
    }
    const response = await app.request('/docs/index.md', {}, { ASSETS: missing } as never)
    expect(response.status).toBe(404)
  })

  test('the api catch-all still wins over the docs routes', async () => {
    const response = await get('/api/docs/rules.md')
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
