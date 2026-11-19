import { ShieldCheck, ShieldX } from 'lucide-react'

import { cx } from '../lib/cx'
import { RULES } from '../shared/risk'
import type { GateVerdict } from '../shared/risk'
import { DECIDING_LABEL, money } from '../shared/sizing'

export function VerdictPill({ verdict, className }: { verdict: 'approved' | 'blocked'; className?: string }) {
  const blocked = verdict === 'blocked'
  const Icon = blocked ? ShieldX : ShieldCheck
  return (
    <span
      className={cx(
        'inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold tracking-[0.02em]',
        blocked ? 'border-danger/30 bg-danger-soft text-danger' : 'border-leaf/30 bg-leaf-soft text-leaf-text',
        className,
      )}
    >
      <Icon aria-hidden className="size-4" />
      {blocked ? 'BLOCKED' : 'APPROVED'}
    </span>
  )
}

/** The gate's answer, with the numbers it used and the rule that decided it. */
export function GateVerdictCard({ verdict, className }: { verdict: GateVerdict; className?: string }) {
  const blocked = verdict.verdict === 'blocked'
  const failing = RULES.findIndex((r) => r.id === verdict.ruleId)

  return (
    <section
      aria-label="Risk gate verdict"
      className={cx('rounded-[26px] border p-6', blocked ? 'border-danger/25 bg-danger-soft/40' : 'border-leaf/25 bg-leaf-soft/40', className)}
    >
      <div className="flex flex-wrap items-center gap-3">
        <VerdictPill verdict={verdict.verdict} />
        {verdict.ruleId && <span className="font-mono text-[12.5px] text-danger">{verdict.ruleId}</span>}
      </div>
      <p className={cx('mt-4 text-[16px] leading-snug', blocked ? 'text-danger' : 'text-leaf-text')}>{verdict.reason}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Shares', value: verdict.size ?? '—' },
          { label: 'Max loss', value: verdict.lossAtStopCents === null ? '—' : money(verdict.lossAtStopCents) },
          { label: 'Reward:risk', value: verdict.rewardRisk.toFixed(2) },
          { label: 'Set by', value: verdict.decidingLimit ? DECIDING_LABEL[verdict.decidingLimit] : '—' },
        ].map((m) => (
          <div key={m.label}>
            <dt className="text-[12.5px] text-muted">{m.label}</dt>
            <dd className="mt-1 font-mono text-[17px] text-fg">{m.value}</dd>
          </div>
        ))}
      </dl>

      <ol className="mt-6 grid gap-1.5 border-t border-line pt-4 text-[13px]">
        {RULES.map((r, i) => {
          const failed = blocked && i === failing
          const skipped = blocked && failing >= 0 && i > failing
          return (
            <li key={r.id} className={cx('flex items-center gap-2.5', failed ? 'text-danger' : skipped ? 'text-faint' : 'text-soft')}>
              <span className={cx('inline-block size-1.5 rounded-full', failed ? 'bg-danger' : skipped ? 'bg-white/20' : 'bg-leaf')} />
              <span className="font-mono text-[11.5px] text-faint">{r.id}</span>
              <span>{r.label}</span>
              {skipped && <span className="ml-auto text-[11.5px]">not reached</span>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
