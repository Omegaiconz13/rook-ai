import { lazy, Suspense, useEffect, useRef } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { ToastProvider } from './components/Toast'
import { BRAND } from './content'
import { scrollToHash, useLocation } from './lib/router'
import { routeFor, titleFor } from './lib/routes'
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
const ChartsPage = page(() => import('./pages/app/Charts'), 'ChartsPage')
const SetupPage = page(() => import('./pages/app/Setup'), 'SetupPage')
const SessionPage = page(() => import('./pages/app/Session'), 'SessionPage')
const JournalPage = page(() => import('./pages/app/Journal'), 'JournalPage')
const RiskGatePage = page(() => import('./pages/app/RiskGate'), 'RiskGatePage')
const NinthPage = page(() => import('./pages/app/Ninth'), 'NinthPage')

/*
  What each path renders. The addresses themselves live in `lib/routes.ts`, so the
  desk rail, the document title and the tests all read one table instead of three.
*/
const PAGES: Record<string, () => ReactNode> = {
  '/': () => <Home />,
  '/pricing': () => <Pricing />,
  '/about': () => <About />,
  '/styleguide': () => <Styleguide />,
  '/login': () => <Login />,
  '/signup': () => <Signup />,
  '/app': () => <DeskPage />,
  '/app/charts': () => <ChartsPage />,
  '/app/risk': () => <RiskGatePage />,
  '/app/journal': () => <JournalPage />,
  '/app/chat': () => <NinthPage />,
  '/app/setup/:symbol': () => <SetupPage />,
  '/app/session/:symbol/:date': () => <SessionPage />,
}

/* A lazy route's fallback: announced, and visibly a page still arriving. */
const Blank = () => (
  <div role="status" className="grid min-h-[60svh] place-items-center px-6">
    <span className="sr-only">Loading…</span>
    <span aria-hidden className="skeleton h-1.5 w-40 rounded-full" />
  </div>
)

export function App() {
  const { path, hash } = useLocation()
  const hit = routeFor(path)
  const page = hit ? PAGES[hit.route.path] : undefined
  const view = page ? page() : <NotFound />
  const layout = hit?.route.layout
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const title = titleFor(path)

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
  if (layout === 'app' || path.startsWith('/app')) {
    body = (
      <Suspense fallback={<Blank />}>
        <AppShell>
          <Suspense fallback={<Blank />}>{view}</Suspense>
        </AppShell>
      </Suspense>
    )
  } else if (layout === 'bare') {
    body = <Suspense fallback={<Blank />}>{view}</Suspense>
  } else {
    body = (
      <>
        <Nav overlay={path === '/'} />
        <main id="main" ref={main} tabIndex={-1} className="outline-none">
          <Suspense fallback={<Blank />}>{view}</Suspense>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <ToastProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {body}
    </ToastProvider>
  )
}
