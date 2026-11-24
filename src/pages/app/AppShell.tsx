import { useState } from 'react'
import type { ReactNode } from 'react'
import { BookOpen, ChartCandlestick, LayoutDashboard, LogOut, MessageSquareText, Power, RotateCcw, ShieldCheck, UserRound } from 'lucide-react'

import { Avatar } from '../../components/Avatar'
import { Button, ButtonLink } from '../../components/Button'
import { Logo } from '../../components/Logo'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { NavDrawer, NavRail } from '../../components/ui/sidebar-nav'
import { cx } from '../../lib/cx'
import { accountFor, engageKillSwitch, resetDesk, useAccountState, useDeskSession, useLimits, useUser } from '../../lib/desk'
import { navigate } from '../../lib/router'
import { money } from '../../shared/sizing'
import { sessionLabel } from '../../shared/time'

export const APP_NAV = [
  { href: '/app', label: 'Desk', icon: LayoutDashboard },
  { href: '/app/charts', label: 'Charts', icon: ChartCandlestick },
  { href: '/app/risk', label: 'Gate', icon: ShieldCheck },
  { href: '/app/journal', label: 'Journal', icon: BookOpen },
  { href: '/app/chat', label: 'Ninth', icon: MessageSquareText },
]

/** Frame for the desk: an icon rail that opens on hover, or a drawer on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useUser()
  const [limits] = useLimits()
  const [stored, setStored] = useAccountState()
  const { session, simulated } = useDeskSession()
  const [account, setAccount] = useState(false)
  const [railOpen, setRailOpen] = useState(false)
  const toast = useToast()
  const accountState = accountFor(limits, stored)

  const toggleKill = () => {
    if (stored.killSwitch) {
      setStored((prev) => ({ ...prev, killSwitch: false }))
      toast('Kill switch reset')
      return
    }
    const cancelled = engageKillSwitch()
    toast(cancelled > 0 ? `Kill switch on. ${cancelled} ticket${cancelled === 1 ? '' : 's'} cancelled.` : 'Kill switch on. Nothing passes.')
  }

  return (
    <div
      className="min-h-svh bg-bg lg:grid"
      style={{ gridTemplateColumns: railOpen ? '264px 1fr' : '76px 1fr' }}
    >
      <NavRail items={APP_NAV} open={railOpen} onToggle={() => setRailOpen((v) => !v)} onSelect={() => setRailOpen(false)}>
        {(expanded) => (
          <>
            {expanded ? (
              <div className="glass mx-1 mt-8 rounded-[22px] p-4">
                <p className="text-[12.5px] uppercase tracking-[0.12em] text-faint">Session</p>
                <p className="mt-1.5 text-[14px] font-medium">{sessionLabel(session.state)}</p>
                <p className="mt-1 font-mono text-[12.5px] text-muted">
                  {session.nowEt} NY{simulated ? ' · demo clock' : ''}
                </p>
                <div className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
                  <p className="flex justify-between gap-2">
                    <span>Equity</span>
                    <span className="font-mono text-soft">{money(limits.equityCents)}</span>
                  </p>
                  <p className="mt-1 flex justify-between gap-2">
                    <span>Day P&amp;L</span>
                    <span className={cx('font-mono', accountState.dayPnlCents < 0 ? 'text-danger' : 'text-soft')}>{money(accountState.dayPnlCents)}</span>
                  </p>
                </div>
                <Button
                  variant={stored.killSwitch ? 'danger' : 'ghost'}
                  size="sm"
                  block
                  className="mt-3"
                  icon={<Power className="size-4" />}
                  onClick={toggleKill}
                >
                  {stored.killSwitch ? 'Kill switch on' : 'Kill switch off'}
                </Button>
              </div>
            ) : (
              <div className="mt-8 grid place-items-center">
                <button
                  type="button"
                  onClick={toggleKill}
                  aria-label={stored.killSwitch ? 'Kill switch on' : 'Kill switch off'}
                  title={stored.killSwitch ? 'Kill switch on' : 'Kill switch off'}
                  className={cx(
                    'btn size-10 !p-0',
                    stored.killSwitch ? 'btn-danger' : 'btn-ghost',
                  )}
                >
                  <Power className="size-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setAccount(true)}
              aria-label="Account"
              className={cx(
                'mt-auto flex min-h-14 items-center gap-3 rounded-2xl text-left transition-colors hover:bg-white/5',
                expanded ? 'px-3' : 'justify-center px-0',
              )}
            >
              {user ? (
                <Avatar name={user.name} size={36} />
              ) : (
                <span className="round grid size-9 shrink-0 place-items-center rounded-full bg-white/8">
                  <UserRound aria-hidden className="size-4.5 text-soft" />
                </span>
              )}
              {expanded && (
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{user?.name ?? 'Guest'}</span>
                  <span className="block truncate text-[12.5px] text-muted">{user?.email ?? 'Demo desk'}</span>
                </span>
              )}
            </button>
          </>
        )}
      </NavRail>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-line bg-bg/90 px-3 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <NavDrawer items={APP_NAV} />
          <Logo withName href="/" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={stored.killSwitch ? 'danger' : 'glass'}
            size="sm"
            className="h-10"
            icon={<Power className="size-4" />}
            onClick={toggleKill}
          >
            {stored.killSwitch ? 'On' : 'Off'}
          </Button>
          <button type="button" aria-label="Account" onClick={() => setAccount(true)} className="round grid size-11 place-items-center rounded-full">
            {user ? <Avatar name={user.name} size={36} /> : <UserRound aria-hidden className="size-5 text-soft" />}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="min-w-0 pb-10 outline-none">
        {children}
      </main>

      <AccountDialog
        open={account}
        onClose={() => setAccount(false)}
        signedIn={!!user}
        onSignOut={() => {
          setUser(null)
          setAccount(false)
          toast('Signed out. Your limits and journal stay in this browser.')
        }}
        onReset={() => {
          resetDesk()
          setAccount(false)
          toast('Demo data reset')
          navigate('/app')
        }}
      />
    </div>
  )
}

function AccountDialog({
  open,
  onClose,
  signedIn,
  onSignOut,
  onReset,
}: {
  open: boolean
  onClose: () => void
  signedIn: boolean
  onSignOut: () => void
  onReset: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <Modal
      open={open}
      onClose={() => {
        setConfirm(false)
        onClose()
      }}
      title="Account"
      description="Everything in this demo is stored in your browser."
    >
      <div className="grid gap-3">
        {signedIn ? (
          <Button variant="glass" size="lg" icon={<LogOut className="size-4" />} onClick={onSignOut}>
            Sign out
          </Button>
        ) : (
          <ButtonLink href="/signup" variant="leaf" size="lg" onClick={onClose}>
            Create a free account
          </ButtonLink>
        )}
        {confirm ? (
          <div className="grid gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4">
            <p className="text-[14px] text-soft">This removes your limits, account state, journal and memos from this browser.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={onReset}>
                Reset everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Keep my data
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="lg" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>
            Reset demo data
          </Button>
        )}
      </div>
    </Modal>
  )
}
