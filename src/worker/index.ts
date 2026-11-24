import { Hono } from 'hono'

import { barsFor, SESSION_DATE } from '../shared/fixtures'
import { DATA, INSTRUMENTS } from '../shared/market'
import { headlinesFor } from '../shared/news'
import { checkPlan } from '../shared/risk'
import type { Account, RiskLimits, SessionInfo, TradePlan } from '../shared/risk'
import { simulate } from '../shared/simulate'
import { deskSetups } from '../shared/setups'
import { etNow, sessionStateAt } from '../shared/time'
import { toChatRequest } from '../shared/ninth/provider'
import type { ModelCallInput } from '../shared/ninth/loop'
import { validateContact, validateEmail, validateLogin, validateSignup } from '../shared/validate'

/*
  The Worker in front of the static site. It serves the bundled session (the
  yfinance snapshot, or the generated one if the dataset is missing) and runs the
  same risk gate the browser runs, so a verdict can be checked from outside the
  page. Nothing is stored server-side: limits, the account and the journal live in
  the browser.
*/
type Env = {
  ASSETS: Fetcher
  /** Set as a Worker secret by the operator; absent in the offline demo. */
  MODEL_API_KEY?: string
  /** Any OpenAI-compatible base URL, e.g. a local Ollama at http://127.0.0.1:11434/v1. */
  MODEL_BASE_URL?: string
  MODEL_NAME?: string
}

/** What the adapter expects when no operator says otherwise. */
const MODEL_DEFAULT_BASE = 'https://api.openai.com/v1'
const MODEL_DEFAULT_NAME = 'gpt-4.1-mini'
/** Caps on what a browser may ask us to send upstream, since the route is public. */
const MAX_SYSTEM_CHARS = 40_000
const MAX_MESSAGES = 40
const MAX_TOOLS = 40

const app = new Hono<{ Bindings: Env }>()

async function body<T>(c: { req: { json: <J>() => Promise<J> } }): Promise<Partial<T> | null> {
  try {
    const v = await c.req.json<unknown>()
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Partial<T>) : null
  } catch {
    return null
  }
}

/** Where the bars came from. `provenance: 'seed'` means bundled, not a live feed. */
const SOURCE = DATA.real ? 'yfinance' : 'fixture'

const invalidJson = { ok: false, error: 'Send a JSON object.' }
const fields = { ok: false, error: 'Check the highlighted fields.' }

/**
 * A model call costs money, so the route refuses another site's page. Requests
 * with no Origin (curl, a test) are let through: this is not an auth boundary,
 * only a stop on a stranger's tab spending the key.
 */
function fromSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

app.get('/api/health', (c) => {
  const { time } = etNow()
  return c.json({ ok: true, mode: SOURCE, session: sessionStateAt(), nowEt: time, date: SESSION_DATE, fetchedAt: DATA.fetchedAt })
})

app.get('/api/market/universe', (c) =>
  c.json({ ok: true, data: INSTRUMENTS.map((i) => ({ ...i, provenance: 'seed' })), source: SOURCE }),
)

app.get('/api/market/bars', (c) => {
  const symbol = (c.req.query('symbol') ?? '').toUpperCase()
  if (!/^[A-Z]{1,5}$/.test(symbol)) return c.json({ ok: false, error: 'Send a symbol like TSLA.' }, 422)
  const bars = barsFor(symbol)
  if (bars.length === 0) return c.json({ ok: false, error: `No bars for ${symbol}.` }, 404)
  return c.json({
    ok: true,
    data: { symbol, interval: '5m', sessionDate: SESSION_DATE, bars },
    source: SOURCE,
    fetchedAt: DATA.fetchedAt,
    fallback: false,
  })
})

app.get('/api/desk/scan', (c) =>
  c.json({ ok: true, data: deskSetups(), source: SOURCE, fetchedAt: DATA.fetchedAt }),
)

app.post('/api/risk/check', async (c) => {
  const b = await body<{ plan: TradePlan; limits: RiskLimits; account: Account; session: SessionInfo; history: { symbol: string; sessionDate: string }[] }>(c)
  if (!b) return c.json(invalidJson, 400)
  const { plan, limits, account, session } = b
  if (!plan || !limits || !account || !session) return c.json(fields, 422)
  const numbers = [plan.entryCents, plan.stopCents, plan.targetCents, limits.equityCents, limits.riskPerTradePct]
  if (numbers.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    return c.json({ ok: false, error: 'Plan and limits need numeric prices.', errors: { plan: 'Prices must be numbers in cents.' } }, 422)
  }
  if (!['pre', 'open', 'close', 'closed'].includes(session.state)) {
    return c.json({ ok: false, error: 'Unknown session state.', errors: { session: 'Use pre, open, close or closed.' } }, 422)
  }
  const verdict = checkPlan({
    plan,
    limits,
    account,
    session,
    history: Array.isArray(b.history) ? b.history : [],
  })
  return c.json({ ok: true, data: { ...verdict, checkedAt: new Date().toISOString() } })
})

app.post('/api/simulate', async (c) => {
  const b = await body<{ plan: TradePlan; seed?: number; runs?: number }>(c)
  if (!b) return c.json(invalidJson, 400)
  if (!b.plan || typeof b.plan.entryCents !== 'number' || typeof b.plan.stopCents !== 'number') {
    return c.json({ ok: false, error: 'Send a plan with numeric entry and stop.', errors: { plan: 'Prices must be numbers in cents.' } }, 422)
  }
  if (b.plan.entryCents <= b.plan.stopCents) {
    return c.json({ ok: false, error: 'Stop must sit below the entry for a long.', errors: { plan: 'Check the stop.' } }, 422)
  }
  return c.json({ ok: true, data: simulate({ plan: b.plan, seed: b.seed, runs: b.runs }) })
})

app.get('/api/news', (c) => {
  const symbols = (c.req.query('symbols') ?? 'TSLA')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20)
  const items = symbols.flatMap((s) => headlinesFor(s))
  if (items.length === 0) return c.json({ ok: true, data: [], source: 'fixture' })
  return c.json({ ok: true, data: items, source: 'fixture' })
})

app.post('/api/signup', async (c) => {
  const b = await body<Record<string, unknown>>(c)
  if (!b) return c.json(invalidJson, 400)
  const errors = validateSignup(b)
  if (Object.keys(errors).length) return c.json({ ...fields, errors }, 422)
  return c.json({ ok: true, user: { name: String(b.name).trim(), email: String(b.email).trim().toLowerCase(), level: b.level } })
})

// Demo sign-in: validates the shape only. Replace with your auth provider.
app.post('/api/login', async (c) => {
  const b = await body<Record<string, unknown>>(c)
  if (!b) return c.json(invalidJson, 400)
  const errors = validateLogin(b)
  if (Object.keys(errors).length) return c.json({ ...fields, errors }, 422)
  const email = String(b.email).trim().toLowerCase()
  const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  return c.json({ ok: true, user: { name, email, level: '1–2 years' } })
})

app.post('/api/subscribe', async (c) => {
  const b = await body<{ email: string }>(c)
  if (!b) return c.json(invalidJson, 400)
  const error = validateEmail(b.email)
  if (error) return c.json({ ok: false, error, errors: { email: error } }, 422)
  return c.json({ ok: true })
})

app.post('/api/contact', async (c) => {
  const b = await body<Record<string, unknown>>(c)
  if (!b) return c.json(invalidJson, 400)
  const errors = validateContact(b)
  if (Object.keys(errors).length) return c.json({ ...fields, errors }, 422)
  return c.json({ ok: true })
})

/*
  Ninth's model turns. The browser owns the loop, the tools and the gate; this
  route owns the key and the socket, and does nothing else. With no key it says
  so, and the panel keeps answering from the desk.
*/

app.get('/api/ninth/model', (c) =>
  c.json({
    ok: true,
    configured: Boolean(c.env.MODEL_API_KEY),
    model: c.env.MODEL_API_KEY ? (c.env.MODEL_NAME ?? MODEL_DEFAULT_NAME) : null,
  }),
)

app.post('/api/ninth/turn', async (c) => {
  if (!fromSameOrigin(c.req.raw)) return c.json({ ok: false, error: 'Cross-origin model calls are refused.' }, 403)

  const key = c.env.MODEL_API_KEY
  if (!key) {
    return c.json({ ok: false, error: 'No model is configured on this deployment, so Ninth answers from the desk.' }, 503)
  }

  const b = await body<{ system: string; messages: ModelCallInput['messages']; tools: string[] }>(c)
  if (!b) return c.json(invalidJson, 400)
  if (typeof b.system !== 'string' || !Array.isArray(b.messages) || !Array.isArray(b.tools)) {
    return c.json({ ok: false, error: 'A turn needs a system prompt, messages and tools.' }, 422)
  }
  if (b.system.length > MAX_SYSTEM_CHARS || b.messages.length > MAX_MESSAGES || b.tools.length > MAX_TOOLS) {
    return c.json({ ok: false, error: 'That turn is larger than this route accepts.' }, 413)
  }

  const base = (c.env.MODEL_BASE_URL ?? MODEL_DEFAULT_BASE).replace(/\/+$/, '')
  let upstream: Response
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(
        toChatRequest(
          { system: b.system, messages: b.messages, tools: b.tools.filter((name) => typeof name === 'string') },
          c.env.MODEL_NAME ?? MODEL_DEFAULT_NAME,
        ),
      ),
    })
  } catch {
    return c.json({ ok: false, error: 'The model provider could not be reached.' }, 502)
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    return c.json({ ok: false, error: `The provider answered ${upstream.status}.`, detail: detail.slice(0, 300) }, 502)
  }

  return new Response(upstream.body, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store' },
  })
})

app.all('/api/*', (c) => c.json({ ok: false, error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
