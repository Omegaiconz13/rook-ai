import { DATA } from './shared/market'

/*
  Every string on the marketing pages. One file, so a brand change is one edit.
  Working name: Rook. Nothing here is financial advice, and no number is a
  performance claim.
*/

export const BRAND = {
  name: 'Rook',
  tagline: 'the AI trading desk',
  email: 'hello@rookdesk.app',
}

export const DISCLAIMER = `Educational only. Not financial advice. Trading involves risk, including loss of principal. ${DATA.real ? `Prices are ${DATA.provider} data, delayed, fetched at build time with yfinance.` : 'Sample data is fictional.'} Nothing on this site or in the demo places an order.`

export const IMAGES = {
  hero: '/images/hero.jpg',
  watchlist: '/images/feature-watchlist.jpg',
  memo: '/images/feature-memo.jpg',
  about: '/images/hero.jpg',
  cta: '/images/hero.jpg',
}

export const NAV = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export const HERO = {
  titleTop: 'Rook',
  titleBottom: 'Trading Desk',
  lede: 'A supervised desk for one trade at a time: Ninth reads the chart, the rules and the journal, plain code holds the risk line, and it can say no.',
  cta: 'Open the desk',
  caption: `Fifteen rules on every plan. No signup, no keys: the demo is one labelled ${DATA.real ? 'session of delayed market data' : 'sample session'}.`,
}

export const FEATURES = {
  eyebrow: 'Features',
  title: 'Between a chart and an order, a great deal should happen',
  lede: 'The desk does the reading and the recording. The gate does the arithmetic, and it never negotiates.',
  items: [
    {
      image: 'watchlist' as const,
      title: 'A watchlist that comes from your rules',
      body: 'Opening-range breakouts, bull flags, gap retests and 20-day reclaims on 5-minute bars, each with the entry, stop and 2R target the rule implies.',
    },
    {
      image: 'rules' as const,
      title: 'A risk gate written in code',
      body: 'Position size, daily loss, distance to the floor, trade count and reward:risk. Same inputs, same answer, every single time — no model in the loop.',
    },
    {
      image: 'memo' as const,
      title: 'A verdict, not a mood',
      body: 'What the scan found, what the gate answered and why, on one page with the numbers that produced it instead of a mood.',
    },
  ],
  extras: [
    { icon: 'message' as const, title: 'Grounded answers', body: 'Every answer names the data it read: the rule, the bar or the gate.' },
    { icon: 'lock' as const, title: 'Paper by default', body: 'No broker connection, no live orders, no keys in the browser.' },
    { icon: 'languages' as const, title: 'Public data only', body: 'The demo runs offline on one labelled session, fetched once at build time. No keys, no requests at load.' },
    { icon: 'timer' as const, title: 'Flat by 15:55', body: 'The gate refuses new entries after your cut-off, every day.' },
  ],
}

export const STEPS = {
  eyebrow: 'How it works',
  title: 'Three steps between a setup and a decision you can defend',
  items: [
    { n: '01', title: 'Open the desk', body: 'See the session, the setups your rules found and the risk budget you have left. All of it labelled with where the numbers came from.' },
    { n: '02', title: 'Send it to the gate', body: 'Edit your limits once. Every plan is checked against them: size, daily loss, trade cap and reward:risk, in a fixed order.' },
    { n: '03', title: 'Take the verdict, not the mood', body: 'A blocked trade is journaled with the rule that stopped it. A passing trade gets a size and the limit that set it before any ticket exists.' },
  ],
  demo: [
    { role: 'Ninth', verdict: 'info' as const, text: 'TSLA 5m: the opening-range rule triggered at 362.18; stop 357.66, target 371.22, both from the rule.' },
    { role: 'Gate', verdict: 'block' as const, text: 'Reward:risk is 1.00 against your 1.50 minimum. No size. No order.' },
  ],
}

export const STATS = [
  { value: 4, suffix: '', label: 'written setups in the scan', decimals: 0 },
  { value: 15, suffix: '', label: 'rules checked before any order', decimals: 0 },
  { value: 6, suffix: '', label: 'screens that need no API key', decimals: 0 },
  { value: 100, suffix: '%', label: 'paper-only execution', decimals: 0 },
]

export const TESTIMONIALS = [
  { quote: 'The gate blocked three trades my first week. Two of them I would have taken at 1R and regretted by lunch.', name: 'Mara O.', role: 'Futures, two years in' },
  { quote: 'I stopped arguing with myself about size. The number is the number, and I can see which limit set it.', name: 'Jonas W.', role: 'Equities, prop account' },
  { quote: 'The memo is the part I keep. It says what the case against the trade was, in writing, before I enter.', name: 'Priya S.', role: 'Swing and intraday' },
]

export type Plan = {
  id: 'free' | 'plus' | 'team'
  name: string
  monthly: number
  yearly: number
  blurb: string
  cta: string
  featured?: boolean
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    blurb: 'For trying the desk on the fetched session.',
    cta: 'Open the desk',
    features: ['Delayed session, offline', 'All 15 risk rules', 'Journal in your browser', 'One desk layout'],
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 24,
    yearly: 19,
    blurb: 'For one trader running a daily routine.',
    cta: 'Start 7-day trial',
    featured: true,
    features: ['Live delayed data feed', 'Saved limits and presets', 'Time Machine simulation', 'Weekly review and CSV export', 'Unlimited journal history'],
  },
  {
    id: 'team',
    name: 'Desk',
    monthly: 59,
    yearly: 49,
    blurb: 'For a small trading room.',
    cta: 'Talk to us',
    features: ['Everything in Plus', 'Up to 5 traders', 'Shared rulebook and limits', 'Blocked-trade review', 'Audit trail export'],
  },
]

export const COMPARE: { label: string; values: [string | boolean, string | boolean, string | boolean] }[] = [
  { label: 'Delayed session, offline', values: [true, true, true] },
  { label: 'Live delayed data', values: [false, true, true] },
  { label: 'All 15 risk rules', values: [true, true, true] },
  { label: 'Memo with counter-case', values: [true, true, true] },
  { label: 'Time Machine simulation', values: [false, true, true] },
  { label: 'Saved limit presets', values: [false, true, true] },
  { label: 'Journal export', values: [false, true, true] },
  { label: 'Shared rulebook', values: [false, false, true] },
  { label: 'Audit trail export', values: [false, false, true] },
  { label: 'Paper trading only', values: [true, true, true] },
]

export const FAQ = [
  {
    q: 'Does it tell me what to trade?',
    a: 'No. It checks your own written setup against your own written rules and shows what the rule implies. The desk never publishes a signal.',
  },
  {
    q: 'Why is the risk gate not an AI?',
    a: 'Language models can be persuaded and can get arithmetic wrong. A limit has to give the same answer every time, so the gate is plain code you can read and test.',
  },
  {
    q: 'Where does the data come from?',
    a: `The demo ships one session of ${DATA.provider} bars, fetched once with yfinance at build time, and labels every price with the provider and the fetch time. Nothing is requested when the page loads, and there are no keys in the browser.`,
  },
  {
    q: 'Can it place an order?',
    a: 'Not in this version. Paper tickets only, and a kill switch on every screen that can create one. Live brokerage connections are a separate feature with their own review.',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. It is an educational process tool. Trading involves risk, including loss of principal, and past results never guarantee anything.',
  },
]

export const ABOUT = {
  eyebrow: 'About Rook',
  title: 'We built the desk we wanted on the mornings we traded badly',
  lede: 'Rook started as a spreadsheet of rules and a stubborn refusal to size a trade by feel. The team structure is copied from trading firms; the discipline is written down so it cannot be talked out of.',
  values: [
    { title: 'Rules before opinions', body: 'Every level comes from a written rule, and every refusal cites the rule that caused it.' },
    { title: 'Code holds the line', body: 'The risk manager is not a personality. It is arithmetic, tested, and it does not care how good the story is.' },
    { title: 'Paper until the routine is clean', body: 'No live execution, no keys in the browser, no promises about returns.' },
  ],
  numbers: [
    { value: '2026', label: 'founded' },
    { value: '4', label: 'written setups' },
    { value: '15', label: 'rules in the gate' },
  ],
  contactTitle: 'Say hello',
  contactLede: 'Questions about the method, the gate or the data sources. We answer within two working days.',
}

export const CTA = {
  title: 'Check one trade before the bell',
  lede: 'The demo runs on delayed market prices with real arithmetic. No card, no keys, no order.',
  primary: 'Open the desk',
  newsletterTitle: 'One process note a fortnight',
  newsletterLede: 'Short, useful pieces on rules, sizing and reviewing your own decisions. Unsubscribe whenever you like.',
}

export const FOOTER = {
  blurb: 'A supervised AI trading desk: Ninth reads, code decides, and paper comes before live.',
  columns: [
    { title: 'Product', links: [{ label: 'Features', href: '/#features' }, { label: 'How it works', href: '/#how-it-works' }, { label: 'Pricing', href: '/pricing' }, { label: 'Open the desk', href: '/app' }] },
    { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/about#contact' }, { label: 'Style guide', href: '/styleguide' }] },
    { title: 'Account', links: [{ label: 'Log in', href: '/login' }, { label: 'Sign up', href: '/signup' }] },
  ],
  legal: '© 2026 Rook. Educational only. Not financial advice.',
}

export const AUTH = {
  loginTitle: 'Welcome back',
  loginLede: 'Your limits and journal are waiting in this browser.',
  signupTitle: 'Create your account',
  signupLede: 'Free on the delayed session. Upgrade when you want a live feed.',
  aside: 'The desk remembers every refusal, not just the trades you took. That is the part that compounds.',
}
