import { useMemo } from 'react'
import { ArrowDownRight } from 'lucide-react'

import { cx } from '../lib/cx'
import { LIMIT_DEFAULTS } from '../lib/desk'
import { barsFor, dailyFor } from '../shared/fixtures'
import { DATA, SESSION_DATE } from '../shared/market'
import { checkPlan } from '../shared/risk'
import type { TradePlan } from '../shared/risk'
import { setupsFor } from '../shared/setups'
import { money, price } from '../shared/sizing'
import { VerdictPill } from './Verdict'

/*
  A real card from the desk session: TSLA's opening-range setup, checked
  against the default limits with a 1R target so the gate refuses it. Every
  number is computed by the same module the app uses, not typed in by hand.
*/
export function TradeCard({ className }: { className?: string }) {
  const sample = useMemo(() => {
    const setup = setupsFor('TSLA', barsFor('TSLA'), dailyFor('TSLA')).find((s) => s.family === 'orb')
    if (!setup) return null
    const plan: TradePlan = {
      id: 'hero-sample',
      symbol: setup.symbol,
      direction: setup.direction,
      entryCents: setup.entryCents,
      stopCents: setup.stopCents,
      targetCents: setup.entryCents + setup.riskPerShareCents,
      riskPerShareCents: setup.riskPerShareCents,
      rMultiple: 1,
      setupId: setup.id,
      status: 'draft',
      provenance: 'seed',
    }
    const verdict = checkPlan({
      plan,
      limits: LIMIT_DEFAULTS,
      account: {
        equityCents: LIMIT_DEFAULTS.equityCents,
        dayPnlCents: 0,
        tradesToday: 0,
        riskUsedCents: 0,
        killSwitch: false,
        sessionDate: SESSION_DATE,
      },
      session: { state: 'open', nowEt: '10:12' },
      history: [],
    })
    return { setup, plan, verdict }
  }, [])

  if (!sample) return null
  const { setup, plan, verdict } = sample

  return (
    <div className={cx('glass w-[300px] max-w-full rounded-[26px] p-5 text-left', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-muted">Trade card</p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[22px] font-medium tracking-[-0.02em] text-fg">{setup.symbol}</span>
            <span className="flex items-center gap-1 text-[12px] text-leaf-text">
              <ArrowDownRight aria-hidden className="size-3.5 rotate-180" /> long
            </span>
          </p>
        </div>
        <VerdictPill verdict={verdict.verdict} className="h-7 px-2.5 text-[11.5px]" />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
        {[
          { label: 'Entry', value: price(plan.entryCents) },
          { label: 'Stop', value: price(plan.stopCents) },
          { label: 'Target', value: price(plan.targetCents) },
        ].map((m) => (
          <div key={m.label}>
            <dt className="text-[11.5px] text-faint">{m.label}</dt>
            <dd className="mt-0.5 font-mono text-[15px] text-fg">{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-ink/25 px-3 py-2">
        <span className="font-mono text-[11.5px] text-danger">{verdict.ruleId}</span>
        <span className="text-right text-[11.5px] leading-tight text-danger">
          {verdict.rewardRisk.toFixed(2)}R against your 1.50 minimum
        </span>
      </div>

      <p className="mt-3 text-[11.5px] leading-snug text-faint">
        {verdict.size ? `${verdict.size} shares, ${money(verdict.lossAtStopCents ?? 0)} at risk` : 'No size, no order.'}{' '}
        {DATA.real ? 'Delayed market prices.' : 'Sample session, fictional prices.'}
      </p>
    </div>
  )
}
