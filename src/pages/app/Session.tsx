import { useMemo } from 'react'
import { ArrowLeft, CalendarDays } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { BarChart } from '../../components/BarChart'
import { ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { Notice } from '../../components/Notice'
import { SourceBadge } from '../../components/SourceBadge'
import { Link, match, useLocation } from '../../lib/router'
import { pastSessionsFor } from '../../shared/fixtures'
import { instrumentFor } from '../../shared/market'
import type { Occurrence } from '../../shared/simulate'
import { occurrencesFor, sessionDate } from '../../shared/simulate'
import { FAMILY_LABEL, FAMILY_SHORT } from '../../shared/setups'
import type { SetupFamily } from '../../shared/setups'
import { price } from '../../shared/sizing'
import { AppHeader } from './AppHeader'

const FAMILIES = ['orb', 'flag', 'fvg', 'reclaim']

function atTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
}

function outcomeWord(o: Occurrence): string {
  if (o.outcome === 'target') return `Target first · +${o.rResult.toFixed(2)}R`
  if (o.outcome === 'stop') return `Stop first · ${o.rResult.toFixed(2)}R`
  return `Open at the close · ${o.rResult > 0 ? '+' : ''}${o.rResult.toFixed(2)}R`
}

export function SessionPage() {
  const { path, search } = useLocation()
  const params = match('/app/session/:symbol/:date', path)
  const symbol = params?.symbol.toUpperCase() ?? ''
  const date = params?.date ?? ''
  const wanted = new URLSearchParams(search).get('family') ?? 'orb'
  const family = (FAMILIES.includes(wanted) ? wanted : 'orb') as SetupFamily

  const { bars, occurrence } = useMemo(() => {
    const bars = pastSessionsFor(symbol).find((s) => s.length > 0 && sessionDate(s) === date) ?? []
    const occurrence = occurrencesFor(symbol, family).find((o) => o.date === date) ?? null
    return { bars, occurrence }
  }, [symbol, date, family])

  if (!instrumentFor(symbol) || !occurrence || bars.length === 0) {
    return (
      <>
        <AppHeader title={`${symbol || 'Session'} · ${date}`} lede="No stored session matches this link." />
        <div className="grid gap-7 px-5 py-8 sm:px-8 lg:px-10">
          <EmptyState
            icon={<CalendarDays className="size-6" />}
            title="No such session"
            body="The date is not one of the stored sessions for this symbol, or this rule never triggered on it."
            action={
              <ButtonLink href={symbol ? `/app/setup/${symbol}` : '/app'} variant="paper">
                Back to the desk
              </ButtonLink>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader
        title={`${symbol} · ${date}`}
        lede={`One past session behind the ${FAMILY_LABEL[family].toLowerCase()} count. The rule set these levels that morning, before the rest of the day existed.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Badge tone="neutral">{FAMILY_SHORT[family]}</Badge>
        </div>
      </AppHeader>

      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href={`/app/setup/${symbol}`}
          className="inline-flex w-fit items-center gap-2 text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to {symbol} setups
        </Link>

        <BarChart
          bars={bars}
          symbol={symbol}
          rangeHigh={occurrence.rangeHighCents}
          rangeLow={occurrence.rangeLowCents}
          entry={occurrence.entryCents}
          stop={occurrence.stopCents}
          target={occurrence.targetCents}
        />

        <section className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-medium tracking-[-0.02em]">What happened</h2>
            <Badge
              tone={occurrence.outcome === 'target' ? 'leaf' : occurrence.outcome === 'stop' ? 'danger' : 'neutral'}
              className="h-6 px-2.5 text-[11.5px]"
            >
              {outcomeWord(occurrence)}
            </Badge>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              { label: 'Trigger', value: `${atTime(occurrence.at)} NY` },
              { label: 'Entry', value: price(occurrence.entryCents) },
              { label: 'Stop', value: price(occurrence.stopCents) },
              { label: 'Target (2R)', value: price(occurrence.targetCents) },
            ].map((m) => (
              <div key={m.label}>
                <dt className="text-[12.5px] text-muted">{m.label}</dt>
                <dd className="mt-1 font-mono text-[16px]">{m.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            The rule is the same one on the setup page: {FAMILY_LABEL[family].toLowerCase()}. Nothing here was redrawn after the
            outcome — open the levels on the setup page and they match.
          </p>
        </section>

        <Notice tone="info">
          One session proves nothing. The count becomes a rate only when the sample is large, and the interval says how large is large
          enough. This is a replay of a past morning, not a forecast of the next one.
        </Notice>
        <Disclaimer />
      </div>
    </>
  )
}
