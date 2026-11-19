import { useMemo, useState } from 'react'
import { Dices, ShieldCheck, Users } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { BarChart } from '../../components/BarChart'
import { Button, ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { Input } from '../../components/Field'
import { Notice } from '../../components/Notice'
import { Segmented } from '../../components/Segmented'
import { SourceBadge } from '../../components/SourceBadge'
import { StatTile } from '../../components/StatTile'
import { useToast } from '../../components/Toast'
import { useSeed } from '../../lib/desk'
import { Link, match, useLocation } from '../../lib/router'
import { barsFor, dailyFor } from '../../shared/fixtures'
import { DATA, instrumentFor, SESSION_LABEL } from '../../shared/market'
import { DEFAULT_RUNS, DEFAULT_SEED, occurrencesFor, simulate } from '../../shared/simulate'
import type { SimResult } from '../../shared/simulate'
import { FAMILY_LABEL, planFromSetup, setupsFor } from '../../shared/setups'
import type { SetupFamily } from '../../shared/setups'
import { price } from '../../shared/sizing'
import { AppHeader } from './AppHeader'

function atTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function SetupPage() {
  const { path } = useLocation()
  const symbol = match('/app/setup/:symbol', path)?.symbol.toUpperCase() ?? ''
  const instrument = instrumentFor(symbol)
  const bars = useMemo(() => (instrument ? barsFor(symbol) : []), [symbol, instrument])
  const setups = useMemo(() => (instrument ? setupsFor(symbol, barsFor(symbol), dailyFor(symbol)) : []), [symbol, instrument])
  const [family, setFamily] = useState<SetupFamily | null>(null)
  const [seed, setSeed] = useSeed()
  const [result, setResult] = useState<SimResult | null>(null)
  const toast = useToast()

  const setup = setups.find((s) => s.family === family) ?? setups.find((s) => s.family === 'orb') ?? setups[0]
  const occurrences = useMemo(() => (instrument && setup ? occurrencesFor(symbol, setup.family) : []), [symbol, instrument, setup])

  if (!instrument || !setup) {
    return (
      <div className="grid gap-6 px-5 py-10 sm:px-8">
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title={instrument ? 'No setup in this session' : 'Unknown symbol'}
          body={
            instrument
              ? `${symbol} has no written setup in this session, so there is no chart to mark up.`
              : `${symbol || 'That symbol'} is not in the sample universe. The desk ships eight symbols.`
          }
          action={
            <ButtonLink href="/app" variant="paper">
              Back to the desk
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const run = () => {
    const next = simulate({ plan: planFromSetup(setup), seed, runs: DEFAULT_RUNS })
    setResult(next)
    toast(`Seed ${next.seed}: target first ${next.targetFirst}%`)
  }

  return (
    <>
      <AppHeader title={`${symbol} · ${instrument.name}`} lede={`${DATA.real ? 'Market session' : 'Sample session'} · ${SESSION_LABEL}. One written rule, its own levels, and the odds before the trade.`}>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Badge tone={setup.status === 'triggered' ? 'leaf' : 'neutral'}>{setup.status}</Badge>
        </div>
      </AppHeader>

      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
        {setups.length > 1 && (
          <div className="-mx-1 overflow-x-auto px-1">
            <Segmented
              label="Setup family"
              value={setup.family}
              onChange={(v) => {
                setFamily(v)
                setResult(null)
              }}
              options={setups.map((s) => ({ value: s.family, label: FAMILY_LABEL[s.family] }))}
            />
          </div>
        )}

        <BarChart
          bars={bars}
          rangeHigh={setup.rangeHighCents}
          rangeLow={setup.rangeLowCents}
          entry={setup.entryCents}
          stop={setup.stopCents}
          target={setup.targetCents}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="panel self-start rounded-[26px] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[17px] font-medium tracking-[-0.02em]">{FAMILY_LABEL[setup.family]}</h2>
              <Badge tone="neutral" className="h-6 px-2.5 text-[11.5px]">
                {setup.id}
              </Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Entry', value: price(setup.entryCents) },
                { label: 'Stop', value: price(setup.stopCents) },
                { label: 'Target (2R)', value: price(setup.targetCents) },
                { label: 'Risk / share', value: price(setup.riskPerShareCents) },
              ].map((m) => (
                <div key={m.label}>
                  <dt className="text-[12.5px] text-muted">{m.label}</dt>
                  <dd className="mt-1 font-mono text-[17px]">{m.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              {setup.family === 'orb'
                ? `Opening range ${price(setup.rangeLowCents)}–${price(setup.rangeHighCents)}. The stop is the range midpoint.`
                : setup.family === 'flag'
                  ? `The flag ran ${price(setup.rangeLowCents)}–${price(setup.rangeHighCents)}. The stop is the flag low.`
                  : setup.family === 'reclaim'
                    ? `The 20-day average was ${price(setup.rangeHighCents)} and the stop is the opening low at ${price(setup.rangeLowCents)}.`
                    : `The unfilled gap sat ${price(setup.rangeLowCents)}–${price(setup.rangeHighCents)}. The stop is the far side of the gap.`}{' '}
              The target is twice the risk, and the rule set those numbers before anything was known about the outcome.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/app/risk?setup=${setup.id}`} variant="glass" size="sm" icon={<ShieldCheck className="size-4" />}>
                Gate this
              </ButtonLink>
              <ButtonLink href={`/app/room?setup=${setup.id}`} variant="ghost" size="sm" icon={<Users className="size-4" />}>
                Run in the room
              </ButtonLink>
            </div>
          </section>

          <section aria-labelledby="tm-title" className="panel rounded-[26px] p-5">
            <h2 id="tm-title" className="text-[17px] font-medium tracking-[-0.02em]">Time Machine</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              10,000 replays of the rest of the session, drawn from the same part of the day on the last 30 sessions. Same seed,
              same answer.
            </p>

            <div className="mt-4 flex items-end gap-2">
              <Input
                label="Seed"
                type="number"
                min={0}
                max={4_294_967_295}
                step={1}
                value={seed}
                onChange={(e) => setSeed(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                className="w-[140px]"
              />
              <Button variant="paper" icon={<Dices className="size-4" />} onClick={run} className="mb-0">
                Run
              </Button>
            </div>

            {!result ? (
              <p className="mt-4 text-[13px] text-faint">
                Nothing simulated yet. The default seed {DEFAULT_SEED} is the one the worked example uses.
              </p>
            ) : (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <StatTile label="Target first" value={`${result.targetFirst}%`} />
                  <StatTile label="Stop first" value={`${result.stopFirst}%`} />
                  <StatTile label="Neither by close" value={`${result.neither}%`} />
                  <StatTile label="Average R" value={result.avgR.toFixed(2)} />
                </dl>

                <p className="mt-2 font-mono text-[11.5px] text-faint">
                  block bootstrap ({result.bootstrap.blockSize}-bar blocks): target {result.bootstrap.targetFirst}% · stop{' '}
                  {result.bootstrap.stopFirst}% · neither {result.bootstrap.neither}% · avg {result.bootstrap.avgR.toFixed(2)}R
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  The gap between the two lines is what treating every bar as independent buys you. Blocks keep streaks, so the
                  bootstrap column is the less flattering of the two.
                </p>

                <p className="mt-4 text-[13px] leading-relaxed text-soft">{result.verdictLine}</p>
                <p className="mt-2 font-mono text-[11.5px] text-faint">
                  seed {result.seed} · {result.runs.toLocaleString('en-US')} runs · {result.historicalOccurrences} occurrences (
                  {result.historicalWins}W/{result.historicalLosses}L/{result.historicalNeither}N)
                </p>

                <div className="mt-4 rounded-2xl border border-line bg-white/3 p-4">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-faint">Assumptions behind these numbers</p>
                  <ul className="mt-2 grid gap-1.5">
                    {result.assumptions.map((a) => (
                      <li key={a} className="flex gap-2 text-[12.5px] leading-relaxed text-muted">
                        <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-current opacity-40" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>

        {occurrences.length > 0 && (
          <section aria-labelledby="occ-title" className="panel rounded-[26px] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="occ-title" className="text-[17px] font-medium tracking-[-0.02em]">
                  The sessions behind the count
                </h2>
                <p className="mt-1 text-[13px] text-muted">
                  Every past trigger of {FAMILY_LABEL[setup.family].toLowerCase()} on {symbol}, resolved with the same stop-first
                  replay. Open one to see the bars it happened on.
                </p>
              </div>
              <Badge tone="neutral">{occurrences.length} sessions</Badge>
            </div>
            <ul className="mt-4 grid gap-2">
              {occurrences
                .slice()
                .reverse()
                .map((o) => (
                  <li key={o.date}>
                    <Link
                      href={`/app/session/${symbol}/${o.date}?family=${setup.family}`}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-2xl border border-line bg-white/3 px-4 py-2.5 transition-colors hover:bg-white/6"
                    >
                      <span className="font-mono text-[12.5px]">{o.date}</span>
                      <span className="font-mono text-[12px] text-faint">{atTime(o.at)} NY</span>
                      <span className="font-mono text-[12px] text-muted">
                        entry {price(o.entryCents)} · stop {price(o.stopCents)}
                      </span>
                      <Badge
                        tone={o.outcome === 'target' ? 'leaf' : o.outcome === 'stop' ? 'danger' : 'neutral'}
                        className="h-6 px-2.5 text-[11.5px]"
                      >
                        {o.outcome === 'open' ? `open ${o.rResult.toFixed(2)}R` : `${o.rResult > 0 ? '+' : ''}${o.rResult.toFixed(2)}R`}
                      </Badge>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <Notice tone="info">
          The Time Machine reports a range, not an edge. It cannot see news, halts or liquidity, and its sample is{' '}
          {DATA.real ? 'thirty real sessions, not a forecast' : 'generated, not real'}.
        </Notice>
        <Disclaimer />
      </div>
    </>
  )
}
