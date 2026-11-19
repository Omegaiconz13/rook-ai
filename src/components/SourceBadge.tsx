import { Database, Radio } from 'lucide-react'

import { DATA } from '../shared/market'
import { Badge } from './Badge'

export type Source = 'seed' | 'live' | 'fallback' | 'user'

const COPY: Record<Source, { label: string; tone: 'neutral' | 'leaf' | 'amber' }> = {
  // The seed badge names whatever is actually loaded: the yfinance snapshot or
  // the generated session that replaces it when the dataset is absent.
  seed: { label: DATA.badge, tone: DATA.real ? 'leaf' : 'neutral' },
  live: { label: 'LIVE · delayed', tone: 'leaf' },
  fallback: { label: 'SAMPLE · feed down', tone: 'amber' },
  user: { label: 'YOUR INPUT', tone: 'amber' },
}

/** Every number on a desk screen says where it came from. */
export function SourceBadge({ source = 'seed', className }: { source?: Source; className?: string }) {
  const { label, tone } = COPY[source]
  const Icon = source === 'live' ? Radio : Database
  return (
    <Badge tone={tone} icon={<Icon aria-hidden className="size-3.5" />} className={className}>
      {label}
    </Badge>
  )
}
