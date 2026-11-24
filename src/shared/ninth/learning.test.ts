import { describe, expect, test } from 'bun:test'

import {
  creditLearning,
  isProven,
  learningProof,
  learningRate,
  learningUses,
  reviewTurn,
  sameQuestion,
  wilsonLowerBound,
} from './learning'
import type { TurnSummary } from './learning'
import type { Learning } from './memory'

const learning = (over: Partial<Learning> = {}): Learning => ({
  id: 'l1',
  trigger: 'the gate blocks',
  sequence: ['gate_check'],
  guidance: 'quote the rule id',
  success: 1,
  failure: 0,
  lastUsed: null,
  ...over,
})

const turn = (over: Partial<TurnSummary> = {}): TurnSummary => ({
  traceId: 'trace-1',
  toolCalls: 3,
  gateConsulted: true,
  refs: 2,
  blocked: 0,
  stopped: 'done',
  reasked: false,
  ...over,
})

describe('the Wilson bound', () => {
  test('is zero with no uses', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0)
  })

  test('keeps most of a perfect record and less of a mixed one', () => {
    expect(wilsonLowerBound(10, 0)).toBeCloseTo(0.722, 3)
    expect(wilsonLowerBound(9, 1)).toBeCloseTo(0.596, 3)
    expect(wilsonLowerBound(8, 2)).toBeCloseTo(0.49, 2)
    expect(wilsonLowerBound(20, 5)).toBeCloseTo(0.609, 3)
  })

  test('rises with the sample, for the same rate', () => {
    expect(wilsonLowerBound(18, 2)).toBeGreaterThan(wilsonLowerBound(9, 1))
  })
})

describe('graduation', () => {
  test('needs ten uses and a lower bound over 0.55', () => {
    expect(isProven(learning({ success: 9, failure: 1 }))).toBe(true)
    expect(isProven(learning({ success: 8, failure: 2 }))).toBe(false)
    expect(isProven(learning({ success: 5, failure: 0 }))).toBe(false)
    expect(isProven(learning({ success: 20, failure: 5 }))).toBe(true)
  })

  test('labels an unproven learning with its sample, never a bare percentage', () => {
    expect(learningProof(learning({ success: 2, failure: 1 }))).toBe('unproven: 3 uses')
    expect(learningProof(learning({ success: 9, failure: 1 }))).toBe('proven: 10 uses, lower bound 0.60')
    expect(learningProof(learning({ success: 8, failure: 2 }))).toBe('unproven: 10 uses, lower bound 0.49')
    expect(learningProof(learning({ success: 1, failure: 0 }))).toBe('unproven: 1 use')
  })

  test('counts uses and rate from both columns', () => {
    const row = learning({ success: 3, failure: 1 })
    expect(learningUses(row)).toBe(4)
    expect(learningRate(row)).toBe(0.75)
    expect(learningRate(learning({ success: 0, failure: 0 }))).toBe(0)
  })

  test('credits an outcome and stamps the use', () => {
    const credited = creditLearning(learning({ success: 1, failure: 2 }), 'failure', '2026-11-19T15:00:00.000Z')
    expect(credited).toMatchObject({ success: 1, failure: 3, lastUsed: '2026-11-19T15:00:00.000Z' })
    expect(creditLearning(learning({ success: 1 }), 'success', '2026-11-19T15:00:00.000Z').success).toBe(2)
  })
})

describe('the review', () => {
  test('gives a complete turn the full ten and makes it a candidate', () => {
    const review = reviewTurn(turn())
    expect(review.score).toBe(10)
    expect(review.candidate).toBe(true)
    expect(review.reasons).toEqual(['tools:3', 'gate', 'refs:2', 'done', 'no-blocks', 'no-repeat'])
  })

  test('does not make a turn a candidate without three tool calls, however it scored', () => {
    const review = reviewTurn(turn({ toolCalls: 2 }))
    expect(review.score).toBe(9)
    expect(review.candidate).toBe(false)
  })

  test('scores a turn that never opened the gate below the threshold', () => {
    const review = reviewTurn(turn({ gateConsulted: false, refs: 0 }))
    expect(review.score).toBe(6)
    expect(review.candidate).toBe(false)
  })

  test('takes a point for a stop, a block, and a repeat', () => {
    expect(reviewTurn(turn({ stopped: 'pending' })).score).toBe(9)
    expect(reviewTurn(turn({ blocked: 1 })).score).toBe(9)
    expect(reviewTurn(turn({ reasked: true })).score).toBe(9)
  })

  test('never scores above ten', () => {
    expect(reviewTurn(turn({ toolCalls: 40, refs: 40 })).score).toBe(10)
  })

  test('treats case and spacing as the same question', () => {
    expect(sameQuestion('Why was it blocked?', 'why was it  blocked?')).toBe(true)
    expect(sameQuestion('why blocked', 'why size')).toBe(false)
  })
})
