import { bareTicker } from '../chartfeed'
import { INSTRUMENTS } from '../market'
import type { Args, ArgsSpec } from './types'

/*
  Argument validation, in front of every tool call. The model's arguments are
  untrusted input: a missing tolerance, a symbol the desk does not trade or a
  string where a price belongs is refused here, in words the model can repeat,
  rather than reaching a handler and becoming a number. Unknown extra keys are
  ignored — models add them — but nothing typed is coerced silently.
*/

export type ParsedArgs = { ok: true; args: Args } | { ok: false; why: string }

const DESK_SYMBOLS = new Set(INSTRUMENTS.map((instrument) => instrument.symbol))
const MAX_LIST = 10

export function parseArgs(spec: ArgsSpec, raw: unknown): ParsedArgs {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const out: Args = {}

  for (const [name, arg] of Object.entries(spec)) {
    const value = source[name]
    if (value === undefined || value === null || value === '') {
      if (arg.required) return { ok: false, why: `Missing ${name}: ${arg.desc}` }
      continue
    }

    if (arg.type === 'number' || arg.type === 'integer') {
      if (typeof value !== 'number' || !Number.isFinite(value)) return { ok: false, why: `${name} must be a finite number.` }
      if (arg.type === 'integer' && !Number.isInteger(value)) {
        return { ok: false, why: `${name} must be a whole number, not ${value}.` }
      }
      out[name] = value
      continue
    }

    if (arg.type === 'boolean') {
      if (typeof value !== 'boolean') return { ok: false, why: `${name} must be true or false.` }
      out[name] = value
      continue
    }

    if (arg.type === 'strings') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
        return { ok: false, why: `${name} must be a list of tickers.` }
      }
      const items = (value as string[]).map((item) => item.trim()).filter(Boolean)
      if (items.length === 0) return { ok: false, why: `${name} is empty: ${arg.desc}` }
      out[name] = items.slice(0, MAX_LIST)
      continue
    }

    if (typeof value !== 'string') return { ok: false, why: `${name} must be text.` }
    const text = value.trim()
    if (!text) {
      if (arg.required) return { ok: false, why: `Missing ${name}: ${arg.desc}` }
      continue
    }

    if (arg.type === 'symbol') {
      const symbol = bareTicker(text)
      if (!DESK_SYMBOLS.has(symbol)) {
        return { ok: false, why: `${symbol} is not one of the desk's instruments, so there is nothing to read for it.` }
      }
      out[name] = symbol
      continue
    }

    if (arg.values && !arg.values.includes(text)) {
      return { ok: false, why: `${name} must be one of: ${arg.values.join(', ')}.` }
    }
    out[name] = text
  }

  return { ok: true, args: out }
}

/* Typed reads for handlers. Validation above has already refused the wrong types. */

export const str = (args: Args, name: string): string | undefined =>
  typeof args[name] === 'string' ? (args[name] as string) : undefined

export const num = (args: Args, name: string): number | undefined =>
  typeof args[name] === 'number' && Number.isFinite(args[name]) ? (args[name] as number) : undefined

export const list = (args: Args, name: string): string[] =>
  Array.isArray(args[name]) ? (args[name] as string[]) : []
