import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { PerspectiveProxy } from '@coasys/ad4m'

import { client, ensureConnection } from './ad4m/client'
import { createNote, ensureScratchPerspective, listNotes, Note } from './ad4m/models'
import { StatusBadge } from './components/StatusBadge'

type Status = 'pending' | 'connected' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('pending')
  const [error, setError] = useState<string | null>(null)
  const [agentDid, setAgentDid] = useState<string | null>(null)
  const [perspective, setPerspective] = useState<PerspectiveProxy | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        await ensureConnection()
        const me = await client().agent.me()
        const persp = await ensureScratchPerspective()
        const initial = await listNotes(persp)
        if (cancelled) return
        setAgentDid(me.did)
        setPerspective(persp)
        setNotes(initial)
        setStatus('connected')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : String(err))
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !perspective || submitting) return
    setSubmitting(true)
    try {
      await createNote(perspective, body)
      setDraft('')
      setNotes(await listNotes(perspective))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <header className="mb-10 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">__APP_NAME__</h1>
          <StatusBadge state={status}>
            {status === 'connected' && 'AD4M connected'}
            {status === 'pending' && 'Connecting…'}
            {status === 'error' && 'Connection error'}
          </StatusBadge>
        </div>
        <p className="text-sm text-zinc-400">
          A working AD4M demo: connect, ensure a Perspective, define a model,
          write notes as link triples — all from the same client.
        </p>
        {agentDid && (
          <div className="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">You are</p>
            <code className="text-emerald-400 text-sm break-all">{agentDid}</code>
          </div>
        )}
        {error && (
          <div className="rounded-md bg-rose-950/40 border border-rose-900 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
      </header>
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-medium">Notes</h2>
          <span className="text-sm text-zinc-500">{notes.length}</span>
        </div>
        <form onSubmit={onAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note…"
            disabled={status !== 'connected'}
            className="flex-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status !== 'connected' || submitting || !draft.trim()}
            className="rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
        {notes.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
            No notes yet. Add one above to see it persist into the Perspective.
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((note, idx) => (
              <li key={`${note.createdAt}-${idx}`} className="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
                <p className="text-sm">{note.body}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatTimestamp(note.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
