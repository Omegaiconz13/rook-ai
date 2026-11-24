import { TIMEFRAME_LABEL, timeframeFor } from '../chartfeed'
import { answerNinth, NINTH_NAME } from '../ninth'
import type { NinthContext } from '../ninth'
import type { Model, ModelMessage } from './loop'
import type { DeskSnapshot } from './types'

/*
  The no-model path, kept honest. When no provider key is configured — which is
  the default for the offline demo — Ninth still answers: every sentence is
  assembled from the desk's own numbers by `answerNinth`, with the refs that say
  what it read. This file is the adapter between the harness's snapshot and that
  mouth, and it implements the same `Model` interface the loop calls, so nothing
  downstream needs to know which one it has.
*/

export function ninthContextFrom(desk: DeskSnapshot): NinthContext {
  const timeframe = timeframeFor(desk.timeframe) ?? '5'
  return {
    symbol: desk.symbol,
    timeframe: TIMEFRAME_LABEL[timeframe],
    bars: desk.bars,
    levels: desk.levels,
    setups: desk.setups,
    journal: desk.journal,
    gate: desk.gate,
    today: desk.today,
  }
}

function lastQuestion(messages: ModelMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role === 'user') return message.text
  }
  return ''
}

/** The deterministic client: no key, no network, no tools — but the same refs. */
export function deterministicModel(desk: DeskSnapshot): Model {
  return {
    async call({ messages }) {
      const answer = answerNinth(lastQuestion(messages), ninthContextFrom(desk))
      return { text: answer.text, refs: answer.refs }
    },
  }
}

/** The footer the panel prints while this is the client in use. */
export const NO_MODEL_NOTE = `No model is connected, so ${NINTH_NAME} answers only from the desk.`
