import { match } from './router'

/*
  One table for every address the app answers to. `App.tsx` renders from it, the
  desk rail reads its links from it, and `routes.test.ts` proves that every link in
  `content.ts` lands on a route that exists. Before this file the same addresses
  lived in three arrays and nothing could check them against each other.
*/
export type Layout = 'site' | 'bare' | 'app'

export type RouteDef = {
  path: string
  /** Document title. Dynamic routes compute theirs from the params. */
  title: string
  layout: Layout
  /** Matched by pattern rather than looked up by path. */
  dynamic?: boolean
}

export const ROUTES: RouteDef[] = [
  { path: '/', title: '', layout: 'site' },
  { path: '/pricing', title: 'Pricing', layout: 'site' },
  { path: '/about', title: 'About', layout: 'site' },
  { path: '/styleguide', title: 'Style guide', layout: 'site' },
  { path: '/login', title: 'Log in', layout: 'bare' },
  { path: '/signup', title: 'Sign up', layout: 'bare' },
  { path: '/app', title: "Today's desk", layout: 'app' },
  { path: '/app/charts', title: 'Charts', layout: 'app' },
  { path: '/app/risk', title: 'Risk gate', layout: 'app' },
  { path: '/app/journal', title: 'Journal', layout: 'app' },
  { path: '/app/chat', title: 'Ninth', layout: 'app' },
  { path: '/app/setup/:symbol', title: 'Setup', layout: 'app', dynamic: true },
  { path: '/app/session/:symbol/:date', title: 'Session', layout: 'app', dynamic: true },
]

/** The routes a render map must cover. */
export const STATIC_ROUTES = ROUTES.filter((r) => !r.dynamic)

export type NavLink = { label: string; href: string }

/** The desk rail. Icons stay in `AppShell`; addresses and words come from here. */
export const DESK_NAV: NavLink[] = [
  { href: '/app', label: 'Desk' },
  { href: '/app/charts', label: 'Charts' },
  { href: '/app/risk', label: 'Gate' },
  { href: '/app/journal', label: 'Journal' },
  { href: '/app/chat', label: 'Ninth' },
]

export type RouteHit = { route: RouteDef; params: Record<string, string> }

/**
 * The route for a path: an exact match first, then the dynamic patterns in table
 * order. `/app/setup/TSLA` wins over a hypothetical `/app/:anything`.
 */
export function routeFor(path: string): RouteHit | null {
  for (const route of ROUTES) {
    if (!route.dynamic && route.path === path) return { route, params: {} }
  }
  for (const route of ROUTES) {
    if (!route.dynamic) continue
    const params = match(route.path, path)
    if (params) return { route, params }
  }
  return null
}

/** The `<title>` for a path, before the brand is appended. */
export function titleFor(path: string): string {
  const hit = routeFor(path)
  if (!hit) return path.startsWith('/app') ? 'Not found' : 'Page not found'
  if (!hit.route.dynamic) return hit.route.title
  const symbol = (hit.params.symbol ?? '').toUpperCase()
  return hit.route.path.includes('session') ? `${symbol} session` : `${symbol} setup`
}

/** A link targets the app only if its path (minus hash) is a route. */export function resolves(href: string): boolean {
  if (href.startsWith('#')) return true
  if (!href.startsWith('/')) return false
  return routeFor(href.split('#')[0] || '/') !== null
}
