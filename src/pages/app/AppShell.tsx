import { useState } from 'react'
import type { ReactNode } from 'react'
import { BookOpen, LayoutDashboard, LogOut, MessageSquareText, Power, RotateCcw, ShieldCheck, UserRound, Users } from 'lucide-react'

import { Avatar } from '../../components/Avatar'
import { Button, ButtonLink } from '../../components/Button'
import { Logo } from '../../components/Logo'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import { accountFor, engageKillSwitch, resetDesk, useAccountState, useDeskSession, useLimits, useUser } from '../../lib/desk'
import { Link, navigate, useLocation } from '../../lib/router'
import { money } from '../../shared/sizing'
import { sessionLabel } from '../../shared/time'

export const APP_NAV = [
  { href: '/app', label: 'Desk', icon: LayoutDashboard },
  { href: '/app/room', label: 'Room', icon: Users },
  { href: '/app/risk', label: 'Gate', icon: ShieldCheck },
  { href: '/app/journal', label: 'Journal', icon: BookOpen },
  { href: '/app/chat', label: 'Ask', icon: MessageSquareText },
]

/** Frame for the desk: sidebar on desktop, top bar and tab bar on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation()
  const [user, setUser] = useUser()
  const [limits] = useLimits()
  const [stored, setStored] = useAccountState()
  const { session, simulated } = useDeskSession()
  const [account, setAccount] = useState(false)
  const toast = useToast()
  const accountState = accountFor(limits, stored)

  return (
    <div className="min-h-svh bg-bg lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-line bg-night px-4 py-6 lg:flex">
        <Logo withName href="/" className="px-3" />
        <nav aria-label="App" className="mt-8 grid gap-1">
          {APP_NAV.map((n) => {
            const on = path === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={cx(
                  'flex h-11 items-center gap-3 rounded-2xl px-3.5 text-[14.5px] transition-colors',
                  on ? 'bg-leaf-soft text-fg' : 'text-soft hover:bg-white/5 hover:text-fg',
                )}
              >
                <n.icon aria-hidden className={cx('size-4.5', on && 'text-leaf-text')} />
                {n.label}
              </Link>
            )
          })}
        </nav>

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
            onClick={() => {
              if (stored.killSwitch) {
                setStored((prev) => ({ ...prev, killSwitch: false }))
                toast('Kill switch reset')
              } else {
                const cancelled = engageKillSwitch()
                toast(cancelled > 0 ? `Kill switch on. ${cancelled} ticket${cancelled === 1 ? '' : 's'} cancelled.` : 'Kill switch on. Nothing passes.')
              }
            }}
          >
            {stored.killSwitch ? 'Kill switch on' : 'Kill switch off'}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setAccount(true)}
          className="mt-auto flex min-h-14 items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-white/5"
        >
          {user ? (
            <Avatar name={user.name} size={36} />
          ) : (
            <span className="round grid size-9 place-items-center rounded-full bg-white/8">
              <UserRound aria-hidden className="size-4.5 text-soft" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-medium">{user?.name ?? 'Guest'}</span>
            <span className="block truncate text-[12.5px] text-muted">{user?.email ?? 'Demo desk'}</span>
          </span>
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-xl lg:hidden">
        <Logo withName href="/" />
        <div className="flex items-center gap-2">
          <Button
            variant={stored.killSwitch ? 'danger' : 'glass'}
            size="sm"
            className="h-10"
            icon={<Power className="size-4" />}
            onClick={() => {
              if (stored.killSwitch) setStored((prev) => ({ ...prev, killSwitch: false }))
              else engageKillSwitch()
            }}
          >
            {stored.killSwitch ? 'On' : 'Off'}
          </Button>
          <button type="button" aria-label="Account" onClick={() => setAccount(true)} className="round grid size-10 place-items-center rounded-full">
            {user ? <Avatar name={user.name} size={36} /> : <UserRound aria-hidden className="size-5 text-soft" />}
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="min-w-0 pb-24 outline-none lg:pb-0">
        {children}
      </main>

      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-night/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
      >
        {APP_NAV.map((n) => {
          const on = path === n.href
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? 'page' : undefined}
              className={cx('flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[12px]', on ? 'text-leaf-text' : 'text-muted')}
            >
              <n.icon aria-hidden className="size-5" />
              {n.label}
            </Link>
          )
        })}
      </nav>

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
