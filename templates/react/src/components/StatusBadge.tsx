import type { ReactNode } from 'react'

interface StatusBadgeProps {
  state: 'pending' | 'connected' | 'error'
  children: ReactNode
}

const STYLES: Record<StatusBadgeProps['state'], string> = {
  pending: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  connected: 'bg-emerald-950 border-emerald-700 text-emerald-300',
  error: 'bg-rose-950 border-rose-700 text-rose-300'
}

const DOT: Record<StatusBadgeProps['state'], string> = {
  pending: 'bg-zinc-400 animate-pulse',
  connected: 'bg-emerald-400',
  error: 'bg-rose-400'
}

export function StatusBadge({ state, children }: StatusBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${STYLES[state]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[state]}`} />
      <span>{children}</span>
    </div>
  )
}
