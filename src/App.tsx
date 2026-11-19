import { lazy, Suspense, useEffect, useRef } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { ToastProvider } from './components/Toast'
import { BRAND } from './content'
import { match, scrollToHash, useLocation } from './lib/router'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Footer } from './sections/Footer'
import { Nav } from './sections/Nav'

// Inner pages load on demand so the landing page ships alone.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))
const Pricing = page(() => import('./pages/Pricing'), 'Pricing')
const About = page(() => import('./pages/About'), 'About')
const Login = page(() => import('./pages/Login'), 'Login')
const Signup = page(() => import('./pages/Signup'), 'Signup')
const Styleguide = page(() => import('./pages/Styleguide'), 'Styleguide')
const AppShell = lazy(() => import('./pages/app/AppShell').then((m) => ({ default: m.AppShell })))
const DeskPage = page(() => import('./pages/app/Desk'), 'DeskPage')
const RoomPage = page(() => import('./pages/app/Room'), 'RoomPage')
const SetupPage = page(() => import('./pages/app/Setup'), 'SetupPage')
const SessionPage = page(() => import('./pages/app/Session'), 'SessionPage')
const JournalPage = page(() => import('./pages/app/Journal'), 'JournalPage')
const RiskGatePage = page(() => import('./pages/app/RiskGate'), 'RiskGatePage')
const AskDeskPage = page(() => import('./pages/app/AskDesk'), 'AskDeskPage')

/*
  The route table. `layout` picks the frame: the marketing site (nav and
  footer), the bare auth screens, or the desk shell.
*/
type Route = { path: string; title: string; layout: 'site' | 'bare' | 'app'; render: () => ReactNode }

const routes: Route[] = [
  { path: '/', title: '', layout: 'site', render: () => <Home /> },
  { path: '/pricing', title: 'Pricing', layout: 'site', render: () => <Pricing /> },
  { path: '/about', title: 'About', layout: 'site', render: () => <About /> },
  { path: '/styleguide', title: 'Style guide', layout: 'site', render: () => <Styleguide /> },
  { path: '/login', title: 'Log in', layout: 'bare', render: () => <Login /> },
  { path: '/signup', title: 'Sign up', layout: 'bare', render: () => <Signup /> },
  { path: '/app', title: "Today's desk", layout: 'app', render: () => <DeskPage /> },
  { path: '/app/room', title: 'The room', layout: 'app', render: () => <RoomPage /> },
  { path: '/app/risk', title: 'Risk gate', layout: 'app', render: () => <RiskGatePage /> },
  { path: '/app/journal', title: 'Journal', layout: 'app', render: () => <JournalPage /> },
  { path: '/app/chat', title: 'Ask the desk', layout: 'app', render: () => <AskDeskPage /> },
]

const Blank = () => <div className="min-h-screen" aria-busy="true" />

export function App() {
  const { path, hash } = useLocation()
  const setupMatch = match('/app/setup/:symbol', path)
  const sessionMatch = match('/app/session/:symbol/:date', path)
  const hit =
    routes.find((r) => r.path === path) ??
    (setupMatch
      ? { path, title: `${setupMatch.symbol.toUpperCase()} setup`, layout: 'app' as const, render: () => <SetupPage /> }
      : sessionMatch
        ? { path, title: `${sessionMatch.symbol.toUpperCase()} session`, layout: 'app' as const, render: () => <SessionPage /> }
        : undefined)
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const title = hit ? hit.title : path.startsWith('/app') ? 'Not found' : 'Page not found'

  useEffect(() => {
    document.title = title ? `${title} | ${BRAND.name}` : `${BRAND.name}: ${BRAND.tagline}`
  }, [title])

  // On navigation: jump to the hash target (once the lazy page renders) or the
  // top, and move focus to <main> so screen readers announce the new page.
  useEffect(() => {
    const isFirst = first.current
    first.current = false
    let raf = 0
    let tries = 0
    const run = () => {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      if (hash && !target && tries++ < 120) {
        raf = requestAnimationFrame(run)
        return
      }
      scrollToHash(hash, !isFirst)
      if (!isFirst && !hash) (main.current ?? document.getElementById('main'))?.focus({ preventScroll: true })
    }
    run()
    return () => cancelAnimationFrame(raf)
  }, [path, hash])

  let body: ReactNode
  if (hit?.layout === 'app' || path.startsWith('/app')) {
    body = (
      <Suspense fallback={<Blank />}>
        <AppShell>
          <Suspense fallback={<Blank />}>{hit ? hit.render() : <NotFound />}</Suspense>
        </AppShell>
      </Suspense>
    )
  } else if (hit?.layout === 'bare') {
    body = <Suspense fallback={<Blank />}>{hit.render()}</Suspense>
  } else {
    body = (
      <>
        <Nav overlay={path === '/'} />
        <main id="main" ref={main} tabIndex={-1} className="outline-none">
          <Suspense fallback={<Blank />}>{hit ? hit.render() : <NotFound />}</Suspense>
        </main>
        <Footer />
      </>
    )
  }

  return <ToastProvider>{body}</ToastProvider>
}
