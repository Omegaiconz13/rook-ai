import { Fragment, useMemo, useState } from 'react'
import { MessageSquareText, Play } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { Button, ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { Notice } from '../../components/Notice'
import { MemoCard, SeatCard } from '../../components/SeatCard'
import { SourceBadge } from '../../components/SourceBadge'
import { GateVerdictCard } from '../../components/Verdict'
import { useToast } from '../../components/Toast'
import { useLocation } from '../../lib/router'
import { accountFor, appendMemo, useAccountState, useConfirmed, useDeskSession, useLimits } from '../../lib/desk'
import type { RoomResult } from '../../shared/packet'
import { runRoom } from '../../shared/packet'
import type { TradePlan } from '../../shared/risk'
import { deskSetups, FAMILY_LABEL, planFromSetup, setupById } from '../../shared/setups'
import { price } from '../../shared/sizing'
import { AppHeader } from './AppHeader'

function initialPlan(search: string): { plan: TradePlan; family: string } {
  const id = new URLSearchParams(search).get('setup')
  const wanted = id ? setupById(id) : setupById('TSLA-orb') ?? deskSetups()[0]
  if (!wanted) throw new Error('This session has no setups.')
  return { plan: planFromSetup(wanted), family: FAMILY_LABEL[wanted.family] }
}

export function RoomPage() {
  const { search } = useLocation()
  const [limits] = useLimits()
  const [stored] = useAccountState()
  const [confirmed] = useConfirmed()
  const { session, simulated } = useDeskSession()
  const [result, setResult] = useState<RoomResult | null>(null)
  const sample = useMemo(() => initialPlan(search), [search])
  const toast = useToast()

  const run = () => {
    const next = runRoom({
      plan: sample.plan,
      limits,
      account: accountFor(limits, stored),
      session,
      history: confirmed.filter((h) => h.sessionDate === '2026-11-19'),
    })
    setResult(next)
    appendMemo(next)
    toast(next.memo.decision === 'TAKE' ? `Memo: TAKE, ${next.memo.rubricScore}/5` : `Memo: PASS, ${next.memo.rubricScore}/5`)
  }

  const gateAfter = result?.memo.notes.findIndex((n) => n.role === 'trader') ?? -1

  return (
    <>
      <AppHeader title="The room" lede="Eight seats, one packet, one memo. The gate sits between the trader and the decider and cannot be argued round.">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Badge tone={simulated ? 'amber' : 'leaf'}>{simulated ? 'demo clock 10:12 NY' : `session open · ${session.nowEt} NY`}</Badge>
        </div>
      </AppHeader>

      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <section className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12.5px] uppercase tracking-[0.12em] text-faint">Packet under review</p>
              <p className="mt-1.5 text-[20px] font-medium tracking-[-0.02em]">
                {sample.plan.symbol} · {sample.family}
              </p>
              <p className="mt-1 font-mono text-[12.5px] text-muted">
                entry {price(sample.plan.entryCents)} · stop {price(sample.plan.stopCents)} · target {price(sample.plan.targetCents)} ·{' '}
                {sample.plan.rMultiple.toFixed(2)}R
              </p>
            </div>
            <Button variant="paper" icon={<Play className="size-4" />} onClick={run}>
              {result ? 'Run again' : 'Run the room'}
            </Button>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            The seats run in a fixed order on the same packet. Notes are scripted from the numbers, not generated, so the same packet
            always produces the same memo.
          </p>
        </section>

        {!result ? (
          <Notice tone="info">
            Nothing has run yet. Press “Run the room” to produce eight seat notes, the gate's verdict and a decision memo. The memo is
            saved in this browser so the ask panel can cite it.
          </Notice>
        ) : (
          <>
            <ol className="grid gap-3">
              {result.memo.notes.map((note, i) => (
                <Fragment key={note.role}>
                  <SeatCard note={note} index={i} />
                  {i === gateAfter && (
                    <li className="list-none">
                      <div className="flex items-center gap-2 px-1 py-1 text-[12px] uppercase tracking-[0.12em] text-faint">
                        <span className="h-px flex-1 bg-line" />
                        Risk gate · code, not a seat
                        <span className="h-px flex-1 bg-line" />
                      </div>
                      <GateVerdictCard verdict={result.memo.gate} />
                    </li>
                  )}
                </Fragment>
              ))}
            </ol>

            <MemoCard
              score={result.memo.rubricScore}
              decision={result.memo.decision}
              counterCase={result.memo.counterCase}
              factors={result.memo.factors}
            >
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ButtonLink href="/app/chat" variant="tint" size="sm" icon={<MessageSquareText className="size-4" />}>
                  Ask the desk about this memo
                </ButtonLink>
                <p className="text-[12.5px] text-faint">
                  {result.memo.decision === 'TAKE'
                    ? 'A passing memo is not an order. Paper tickets arrive with the journal screen.'
                    : result.memo.gate.ruleId
                      ? `No ticket exists for a PASS. The refusal is journaled at ${result.memo.gate.ruleId}.`
                      : 'No ticket exists for a PASS: a blocking seat stopped it before any size was approved.'}
                </p>
              </div>
            </MemoCard>
          </>
        )}

        <Disclaimer />
      </div>
    </>
  )
}
