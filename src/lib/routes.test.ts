import { describe, expect, test } from 'bun:test'

import { FOOTER, NAV } from '../content'
import { DESK_NAV, ROUTES, STATIC_ROUTES, resolves, routeFor, titleFor } from './routes'

/*
  The route table exists so a link cannot point at a page nobody wrote. These tests
  are the reason it earns its keep: they read the same arrays the UI renders from.
*/

describe('route table', () => {
  test('every path is unique, absolute, and the home route comes first', () => {
    const paths = ROUTES.map((r) => r.path)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((p) => p.startsWith('/'))).toBe(true)
    // `Nav overlay` is keyed on the home path, so the table must not drift.
    expect(ROUTES[0].path).toBe('/')
  })

  test('the static and dynamic halves add up', () => {
    expect(STATIC_ROUTES.length + ROUTES.filter((r) => r.dynamic).length).toBe(ROUTES.length)
    expect(STATIC_ROUTES.every((r) => !r.path.includes(':'))).toBe(true)
    expect(ROUTES.filter((r) => r.dynamic).every((r) => r.path.includes(':'))).toBe(true)
  })

  test('static titles are unique, because they become the document title', () => {
    const titles = STATIC_ROUTES.filter((r) => r.path !== '/').map((r) => r.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  test('every link in the marketing nav resolves to a page', () => {
    for (const link of NAV) expect({ href: link.href, ok: resolves(link.href) }).toEqual({ href: link.href, ok: true })
  })

  test('every link in the footer resolves to a page', () => {
    const links = FOOTER.columns.flatMap((c) => c.links)
    expect(links.length).toBeGreaterThan(5)
    for (const link of links) expect({ href: link.href, ok: resolves(link.href) }).toEqual({ href: link.href, ok: true })
  })

  test('the desk rail points only at app routes', () => {
    expect(DESK_NAV.map((n) => n.href)).toEqual(['/app', '/app/charts', '/app/risk', '/app/journal', '/app/chat'])
    for (const item of DESK_NAV) {
      const route = STATIC_ROUTES.find((r) => r.path === item.href)
      expect(route?.layout).toBe('app')
    }
  })

  test('an unknown path has no route, and says so', () => {
    expect(routeFor('/nope')).toBeNull()
    expect(titleFor('/nope')).toBe('Page not found')
    expect(titleFor('/app/nope')).toBe('Not found')
  })

  test('dynamic routes match, decode and title themselves', () => {
    expect(routeFor('/app/setup/TSLA')?.params).toEqual({ symbol: 'TSLA' })
    expect(routeFor('/app/session/tsla/2026-11-24')?.params).toEqual({ symbol: 'tsla', date: '2026-11-24' })
    expect(titleFor('/app/setup/tsla')).toBe('TSLA setup')
    expect(titleFor('/app/session/tsla/2026-11-24')).toBe('TSLA session')
    // An exact route wins over a pattern with the same shape.
    expect(routeFor('/app/charts')?.route.path).toBe('/app/charts')
    expect(routeFor('/app/charts')?.params).toEqual({})
  })

  test('hashes and external links are handled without inventing routes', () => {
    expect(resolves('#main')).toBe(true)
    expect(resolves('/#features')).toBe(true)
    expect(resolves('/about#contact')).toBe(true)
    expect(resolves('#/not-a-hash-route')).toBe(true)
    expect(resolves('/missing')).toBe(false)
    expect(resolves('https://example.com')).toBe(false)
  })
})
