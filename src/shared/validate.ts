/*
  Form rules shared by the browser and the Worker, so a message the page shows
  is exactly what the server would answer.
*/

export type Errors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) return 'Enter your email address.'
  if (s.length > 200 || !EMAIL.test(s)) return 'Enter a valid email, like you@school.edu.'
  return null
}

export function validateLogin(b: { email?: unknown; password?: unknown }): Errors {
  const e: Errors = {}
  const email = validateEmail(b.email)
  if (email) e.email = email
  if (typeof b.password !== 'string' || !b.password) e.password = 'Enter your password.'
  return e
}

export const LEVELS = ['New to trading', '1–2 years', '3–5 years', 'Full-time'] as const

export function validateSignup(b: { name?: unknown; email?: unknown; password?: unknown; level?: unknown; terms?: unknown }): Errors {
  const e: Errors = {}
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) e.name = 'Tell us what to call you.'
  else if (name.length > 80) e.name = 'Keep it under 80 characters.'
  const email = validateEmail(b.email)
  if (email) e.email = email
  const pw = typeof b.password === 'string' ? b.password : ''
  if (pw.length < 8) e.password = 'Use at least 8 characters.'
  else if (!/[0-9]/.test(pw) || !/[a-zA-Z]/.test(pw)) e.password = 'Mix letters and at least one number.'
  if (!LEVELS.includes(b.level as (typeof LEVELS)[number])) e.level = 'Choose your experience.'
  if (b.terms !== true) e.terms = 'Accept the terms to continue.'
  return e
}

export function validateContact(b: { name?: unknown; email?: unknown; message?: unknown }): Errors {
  const e: Errors = {}
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name) e.name = 'Enter your name.'
  const email = validateEmail(b.email)
  if (email) e.email = email
  const msg = typeof b.message === 'string' ? b.message.trim() : ''
  if (msg.length < 10) e.message = 'Write at least 10 characters.'
  else if (msg.length > 2000) e.message = 'Keep it under 2,000 characters.'
  return e
}

export function validateSymbol(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : ''
  if (!s) return 'Choose a symbol.'
  if (!/^[A-Z]{1,5}$/.test(s)) return 'Symbols are one to five letters, like TSLA.'
  return null
}

/** Prices arrive as dollars in the form and are stored as integer cents. */
export function validatePrice(v: unknown, label: string): string | null {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || n <= 0) return `${label} must be a price above zero.`
  return null
}
