import type { Model } from '../shared/ninth/loop'
import { readSseChunk, StreamAssembler } from '../shared/ninth/provider'

/*
  The model client. It posts one model call to the Worker, which holds the key,
  and rebuilds the reply from the streamed frames. The loop above it cannot tell
  this client from the deterministic one — that is the point of the interface.

  With no key on the Worker the route answers 503 and this throws; the panel then
  keeps the offline client and says no model is connected.
*/

export const MODEL_ENDPOINT = '/api/ninth/model'
export const TURN_ENDPOINT = '/api/ninth/turn'

export type ModelStatus = { configured: boolean; model: string | null }

/** Ask the Worker whether it has a key. Never throws: offline is a normal answer. */
export async function modelStatus(): Promise<ModelStatus> {
  try {
    const response = await fetch(MODEL_ENDPOINT, { headers: { accept: 'application/json' } })
    if (!response.ok) return { configured: false, model: null }
    const body = (await response.json()) as { configured?: unknown; model?: unknown }
    return { configured: body.configured === true, model: typeof body.model === 'string' ? body.model : null }
  } catch {
    return { configured: false, model: null }
  }
}

export function remoteModel(endpoint = TURN_ENDPOINT): Model {
  return {
    async call(input) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { error?: unknown } | null
        const why = typeof detail?.error === 'string' ? detail.error : `the model endpoint answered ${response.status}`
        throw new Error(why)
      }
      if (!response.body) throw new Error('the model endpoint returned no stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const assembler = new StreamAssembler()
      let carry = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const read = readSseChunk(carry, decoder.decode(value, { stream: true }))
        carry = read.carry
        for (const payload of read.payloads) assembler.push(payload)
      }
      // A last frame with no trailing newline still belongs to the reply.
      if (carry.trim()) for (const payload of readSseChunk(carry, '\n').payloads) assembler.push(payload)

      return assembler.reply()
    },
  }
}
