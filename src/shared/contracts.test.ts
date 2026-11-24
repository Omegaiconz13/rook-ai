import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

import { STATUS, errorText, fail, isFailure } from './contracts'

describe('contracts', () => {
  test('a refusal carries exactly what a caller needs', () => {
    expect(fail('Send a symbol like TSLA.')).toEqual({ ok: false, error: 'Send a symbol like TSLA.' })
    expect(fail('Check the highlighted fields.', { errors: { email: 'Not an address.' } })).toEqual({
      ok: false,
      error: 'Check the highlighted fields.',
      errors: { email: 'Not an address.' },
    })
    expect(fail('Upstream said 500.', { detail: 'rate limited' }).detail).toBe('rate limited')
  })

  test('isFailure only trusts a boolean false', () => {
    expect(isFailure({ ok: false, error: 'no' })).toBe(true)
    expect(isFailure({ ok: true, data: 1 })).toBe(false)
    expect(isFailure({ ok: 'false' })).toBe(false)
    expect(isFailure(null)).toBe(false)
    expect(isFailure('no')).toBe(false)
  })

  test('errorText always leaves a sentence to show', () => {
    expect(errorText(fail('No bars for TSLA.'))).toBe('No bars for TSLA.')
    expect(errorText({ ok: true, data: 1 })).toBe('The desk did not answer. Try again.')
    expect(errorText(new Error('boom'))).toBe('The desk did not answer. Try again.')
    expect(errorText(fail(''))).toBe('The desk did not answer. Try again.')
  })

  test('the status map is unique and every code is a real HTTP status', () => {
    const codes = Object.values(STATUS)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toBeGreaterThanOrEqual(200)
    for (const code of codes) expect(code).toBeLessThan(600)
  })

  /*
    The Worker is the only writer, so the guarantee is checked at the source: no
    bare status numbers and no hand-built failure objects, or the shape drifts again.
  */
  test('the Worker writes refusals through fail() and statuses through STATUS', () => {
    const source = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8')
    const lines = source.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    const codes = Object.values(STATUS).filter((c) => c >= 400)
    const bare = lines.filter((l) => codes.some((code) => new RegExp(`\\b${code}\\b`).test(l)))
    expect(bare).toEqual([])
    const handBuilt = lines.filter((l) => /\{\s*ok: false/.test(l))
    expect(handBuilt).toEqual([])
    // …and that it actually uses the helpers, so the test cannot pass on an empty file.
    expect(lines.filter((l) => l.includes('fail(')).length).toBeGreaterThan(10)
    expect(lines.filter((l) => l.includes('STATUS.')).length).toBeGreaterThan(10)
  })
})
