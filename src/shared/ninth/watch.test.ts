import { describe, expect, test } from 'bun:test'

import { addWatch, checkWatches, parseWatch, removeWatches, watchHit, watchMessage, watchText } from './watch'
import type { Quote, Watch } from './watch'

const AT = '2026-11-19T14:35:00.000Z'
const nextId = () => 'w1'

function parsed(argument: string): Watch {
  const outcome = parseWatch(argument, AT, nextId)
  if (!outcome.watch) throw new Error(outcome.why)
  return outcome.watch
}

function refusal(argument: string): string {
  const outcome = parseWatch(argument, AT, nextId)
  if (outcome.watch) throw new Error('expected a refusal')
  return outcome.why as string
}

const quote = (over: Partial<Quote> = {}): Quote => ({
  symbol: 'TSLA',
  lastCents: 39_306,
  highCents: 39_320,
  lowCents: 39_280,
  ...over,
})

const watch = (over: Partial<Watch> = {}): Watch => ({ ...parsed('TSLA above 400'), ...over })

describe('parseWatch', () => {
  test('reads a side and a price in dollars', () => {
    const above = parsed('TSLA above 400')
    expect(above.symbol).toBe('TSLA')
    expect(above.kind).toBe('above')
    expect(above.priceCents).toBe(40_000)
    expect(above.firedAt).toBeNull()

    const below = parsed('tsla below 380.5')
    expect(below.symbol).toBe('TSLA')
    expect(below.kind).toBe('below')
    expect(below.priceCents).toBe(38_050)
  })

  test('treats a bare price as a touch on either side', () => {
    expect(parsed('NVDA 120').kind).toBe('at')
    expect(parsed('NVDA at 120').priceCents).toBe(12_000)
  })

  test('refuses a symbol the desk does not trade', () => {
    expect(refusal('IBM above 10')).toContain('IBM is not on the desk')
  })

  test('refuses a missing or unreadable price instead of guessing one', () => {
    expect(refusal('TSLA above')).toContain('Give a price')
    expect(refusal('TSLA above zero')).toContain('is not a price')
    expect(refusal('')).toContain('Say what to watch')
  })
})

describe('the stored list', () => {
  test('sets the same line twice once', () => {
    const first = parsed('TSLA above 400')
    expect(addWatch(addWatch([], first), { ...first, id: 'w2' })).toHaveLength(1)
    expect(addWatch([first], parsed('TSLA above 401'))).toHaveLength(2)
  })

  test('removes by symbol or by id, and reports a miss', () => {
    const list = [parsed('TSLA above 400'), { ...parsed('NVDA below 100'), id: 'w2' }]
    expect(removeWatches(list, 'tsla').removed).toBe(1)
    expect(removeWatches(list, 'w2').removed).toBe(1)
    expect(removeWatches(list, 'w2').watches.map((entry) => entry.symbol)).toEqual(['TSLA'])
    expect(removeWatches(list, 'AMD').removed).toBe(0)
  })
})

describe('checkWatches', () => {
  test('fires an above line once, and never again on a reload', () => {
    const first = checkWatches([watch()], [quote({ lastCents: 40_012 })], AT)
    expect(first.fired).toHaveLength(1)
    expect(first.watches[0].firedAt).toBe(AT)
    expect(first.watches[0].firedPriceCents).toBe(40_012)

    const again = checkWatches(first.watches, [quote({ lastCents: 40_500 })], '2026-11-20T14:35:00.000Z')
    expect(again.fired).toHaveLength(0)
    expect(again.watches[0].firedAt).toBe(AT)
  })

  test('leaves a line that has not been reached alone', () => {
    expect(checkWatches([watch()], [quote({ lastCents: 39_900 })], AT).fired).toHaveLength(0)
    expect(checkWatches([watch({ kind: 'below', priceCents: 38_000 })], [quote()], AT).fired).toHaveLength(0)
  })

  test('a touch needs the bar’s range, not its close', () => {
    expect(watchHit(watch({ kind: 'at', priceCents: 39_290 }), quote())).toBe(true)
    expect(watchHit(watch({ kind: 'at', priceCents: 39_500 }), quote())).toBe(false)
  })

  test('a symbol with no quote is left waiting', () => {
    expect(checkWatches([watch({ symbol: 'AMD' })], [quote()], AT).fired).toHaveLength(0)
  })
})

describe('what a watch says', () => {
  test('one message with the price, the line and what it did not do', () => {
    const message = watchMessage(watch({ kind: 'above' }), quote({ lastCents: 40_012 }))
    expect(message).toContain('TSLA is at 400.12')
    expect(message).toContain('400.00 line')
    expect(message).toContain('has not sized, journalled or placed anything')
  })

  test('lists every watch with its state and how to remove it', () => {
    expect(watchText([])).toContain('No watches')

    const text = watchText([
      watch(),
      watch({ id: 'w2', symbol: 'NVDA', kind: 'below', priceCents: 10_000, firedAt: AT, firedPriceCents: 9_998 }),
    ])
    expect(text).toContain('2 watches')
    expect(text).toContain('TSLA above 400.00 · waiting · w1')
    expect(text).toContain('NVDA below 100.00 · fired at 99.98 on 2026-11-19 · w2')
    expect(text).toContain('/watch clear')
  })
})
