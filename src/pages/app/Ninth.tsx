import { useState } from 'react'

import { Disclaimer } from '../../components/Disclaimer'
import { NinthPanel } from '../../components/NinthPanel'
import { navigate } from '../../lib/router'
import { INSTRUMENTS } from '../../shared/market'
import { AppHeader } from './AppHeader'

/**
 * Ninth as a page: the same panel the chart docks, pointed at a symbol you pick
 * instead of at the cell in front of you. It reads the written rules, the gate's
 * verdict and the journal for that symbol, and it draws nothing here because
 * there is no chart to draw on — Analyze only appears where one is bound.
 */
export function NinthPage() {
  const [symbol, setSymbol] = useState(INSTRUMENTS[0]?.symbol ?? 'TSLA')

  return (
    <>
      <AppHeader
        title="Ninth"
        lede="The desk's assistant, reading the written rules, the gate and the journal for one symbol. No model, no key, no network: every answer names what it read."
      >
        <div className="flex items-center gap-2">
          <label htmlFor="ninth-symbol" className="text-[12.5px] uppercase tracking-[0.12em] text-faint">
            Symbol
          </label>
          <select
            id="ninth-symbol"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            className="field h-11 w-[120px]"
          >
            {INSTRUMENTS.map((instrument) => (
              <option key={instrument.symbol} value={instrument.symbol}>
                {instrument.symbol}
              </option>
            ))}
          </select>
        </div>
      </AppHeader>

      <div className="grid gap-4 px-5 pb-8 sm:px-8 lg:px-10">
        <div className="panel h-[min(72svh,720px)] min-h-[420px] overflow-hidden rounded-[26px]">
          <NinthPanel getChart={() => null} symbol={symbol} header={{ close: () => navigate('/app/charts') }} />
        </div>
        <div className="grid gap-3">
          <p className="text-[13px] text-muted">
            Ask about the levels, the setups, the gate, the journal or the last bar. Open a chart when you want it to draw the
            setup as well as describe it.
          </p>
          <Disclaimer />
        </div>
      </div>
    </>
  )
}
