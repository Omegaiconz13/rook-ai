import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Maximize2, Minimize2, Play, X } from 'lucide-react'
import type { Vela } from '@luxalgo/vela'
import type { SidePanelHeader, WidgetContext } from '@luxalgo/vela/plugin'

import { cx } from '../lib/cx'
import { RUN_ID, SCRIPT_TITLE, ensurePineEngine, readScript, saveScript } from '../lib/pine'

type Status = 'idle' | 'running' | 'ran' | 'failed'

type Props = {
  /** The chart to run against, read at the moment of a Run (the shell rebinds it). */
  getChart: () => Vela | null
  /** The shell's header surface — the panel draws its own row, so it wires close and maximize. */
  header: SidePanelHeader
  /** The widget context: dock changes to follow, and the save a run has to ask for. */
  shell: WidgetContext
}

/**
 * A Pine editor, the way the reference terminal opens one: the code is the panel,
 * Run puts it on the chart, and the footer says what happened. The draft survives a
 * reload; so does the last run, through the chart document.
 */
export function ScriptPanel({ getChart, header, shell }: Props) {
  const [source, setSource] = useState(readScript)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('Draft kept in this browser.')
  const [took, setTook] = useState<number | null>(null)
  const [, reflow] = useState(0)
  const gutter = useRef<HTMLPreElement>(null)

  // Maximizing, closing (which restores it) and reopening all change the header's state.
  useEffect(() => shell.panels.onDidChange(() => reflow((tick) => tick + 1)), [shell])
  useEffect(() => saveScript(source), [source])

  // Read from the shell, never cached: closing a maximized panel restores it too.
  const maximized = header.maximized
  const lines = source.split('\n').length
  const numbers = Array.from({ length: lines }, (_, index) => index + 1).join('\n')

  function toggleMaximized() {
    header.setMaximized(!header.maximized)
    reflow((tick) => tick + 1)
  }

  async function run() {
    const chart = getChart()
    if (!chart) {
      setStatus('failed')
      setMessage('The chart is not live yet. Try again once the candles are drawn.')
      return
    }
    setStatus('running')
    setMessage('Compiling…')
    setTook(null)
    const started = performance.now()
    try {
      await ensurePineEngine(chart)
      // A re-run edits the script in place: `updateCode` compiles first and, when the
      // new code fails, puts the previous code back with its inputs — so a broken edit
      // never wipes a study that was working. A fresh run takes the same id, which is
      // also what a reload looks for to bring it back.
      const existing = chart.indicators().find((handle) => handle.id === RUN_ID)
      const result = existing
        ? await existing.updateCode(source)
        : await chart.runIndicator(source, { id: RUN_ID, language: 'pine' })
      if (!result.ok) {
        setStatus('failed')
        setMessage(result.error?.message ?? 'The script did not compile.')
        return
      }
      // A raw chart run is not a shell indicator add, so the document write it should
      // land in has to be asked for; the snapshot then reads the source off the handle.
      shell.stateChanged()
      setStatus('ran')
      setTook(Math.round(performance.now() - started))
      setMessage('Drawn on the chart.')
    } catch (error) {
      setStatus('failed')
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-panel">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[12.5px] font-medium text-soft">{SCRIPT_TITLE}</span>
        <button
          type="button"
          onClick={run}
          disabled={status === 'running'}
          className="tap-target flex items-center gap-1.5 rounded-full bg-leaf px-3 py-1 text-[12px] font-medium text-ink transition hover:bg-leaf-hover disabled:opacity-60"
        >
          {status === 'running' ? (
            <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
          ) : (
            <Play aria-hidden className="size-3.5" />
          )}
          Run
        </button>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMaximized}
            aria-label={maximized ? 'Restore script panel' : 'Maximize script panel'}
            aria-pressed={maximized}
            className="tap-target grid size-7 place-items-center rounded-full text-faint transition hover:bg-white/8 hover:text-fg"
          >
            {maximized ? (
              <Minimize2 aria-hidden className="size-4" />
            ) : (
              <Maximize2 aria-hidden className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => header.close()}
            aria-label="Close script panel"
            className="tap-target grid size-7 place-items-center rounded-full text-faint transition hover:bg-white/8 hover:text-fg"
          >
            <X aria-hidden className="size-4" />
          </button>
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden font-mono text-[12.5px] leading-[20px]">
        <pre
          ref={gutter}
          aria-hidden
          className="w-10 shrink-0 select-none overflow-hidden border-r border-line py-3 pr-2 text-right text-faint/60"
        >
          {numbers}
        </pre>
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          onScroll={(event) => {
            if (gutter.current) gutter.current.scrollTop = event.currentTarget.scrollTop
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return
            event.preventDefault()
            const field = event.currentTarget
            const { selectionStart, selectionEnd, value } = field
            setSource(`${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`)
            requestAnimationFrame(() => {
              field.selectionStart = selectionStart + 2
              field.selectionEnd = selectionStart + 2
            })
          }}
          spellCheck={false}
          aria-label="Pine script source"
          className="min-h-0 flex-1 resize-none bg-transparent px-3 py-3 text-soft caret-leaf"
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-3 py-1.5 text-[11.5px]">
        <span className={cx('truncate', status === 'failed' ? 'text-danger' : 'text-faint')}>{message}</span>
        <span className="flex shrink-0 items-center gap-2 text-faint">
          {took !== null && status === 'ran' && <span className="tabular-nums">{took} ms</span>}
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">Pine</span>
        </span>
      </div>
    </div>
  )
}
