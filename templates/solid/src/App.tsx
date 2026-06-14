import { createSignal, For, onMount, Show } from 'solid-js'
import type { PerspectiveProxy } from '@coasys/ad4m'

import { ensureConnection, client } from './ad4m/client'
import { createNote, ensureScratchPerspective, listNotes, Note } from './ad4m/models'
import { StatusBadge } from './components/StatusBadge'

type Status = 'pending' | 'connected' | 'error'

export default function App() {
  const [status, setStatus] = createSignal<Status>('pending')
  const [error, setError] = createSignal<string | null>(null)
  const [agentDid, setAgentDid] = createSignal<string | null>(null)
  const [perspective, setPerspective] = createSignal<PerspectiveProxy | null>(null)
  const [notes, setNotes] = createSignal<Note[]>([])
  const [draft, setDraft] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  onMount(async () => {
    try {
      await ensureConnection()
      const me = await client().agent.me()
      setAgentDid(me.did)
      const persp = await ensureScratchPerspective()
      setPerspective(persp)
      setNotes(await listNotes(persp))
      setStatus('connected')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  })

  async function onAdd(event: SubmitEvent) {
    event.preventDefault()
    const body = draft().trim()
    const persp = perspective()
    if (!body || !persp || submitting()) return
    setSubmitting(true)
    try {
      await createNote(persp, body)
      setDraft('')
      setNotes(await listNotes(persp))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main class="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <header class="mb-10 space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-3xl font-semibold tracking-tight">__APP_NAME__</h1>
          <StatusBadge state={status()}>
            <span>
              {status() === 'connected' && 'AD4M connected'}
              {status() === 'pending' && 'Connecting…'}
              {status() === 'error' && 'Connection error'}
            </span>
          </StatusBadge>
        </div>
        <p class="text-sm text-zinc-400">
          A working AD4M demo: connect, ensure a Perspective, define a
          model, write notes as link triples — all from the same client.
        </p>
        <Show when={agentDid()}>
          <div class="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
            <p class="text-xs uppercase tracking-wide text-zinc-500 mb-1">
              You are
            </p>
            <code class="text-emerald-400 text-sm break-all">{agentDid()}</code>
          </div>
        </Show>
        <Show when={error()}>
          <div class="rounded-md bg-rose-950/40 border border-rose-900 px-4 py-3 text-sm text-rose-300">
            {error()}
          </div>
        </Show>
      </header>

      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-xl font-medium">Notes</h2>
          <span class="text-sm text-zinc-500">{notes().length}</span>
        </div>

        <form onSubmit={onAdd} class="flex gap-2 mb-6">
          <input
            type="text"
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            placeholder="Write a note…"
            disabled={status() !== 'connected'}
            class="flex-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status() !== 'connected' || submitting() || !draft().trim()}
            class="rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting() ? 'Adding…' : 'Add'}
          </button>
        </form>

        <Show
          when={notes().length > 0}
          fallback={
            <div class="rounded-md border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
              No notes yet. Add one above to see it persist into the Perspective.
            </div>
          }
        >
          <ul class="space-y-2">
            <For each={notes()}>
              {(note) => (
                <li class="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3">
                  <p class="text-sm">{note.body}</p>
                  <p class="mt-1 text-xs text-zinc-500">
                    {formatTimestamp(note.createdAt)}
                  </p>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <footer class="mt-10 pt-6 border-t border-zinc-900 text-xs text-zinc-500 space-y-1">
          <p>
            Notes are stored as link triples in the <code>Scratch</code>{' '}
            Perspective via the <code>Note</code> Ad4mModel.
          </p>
          <p>
            Edit <code>src/ad4m/models.ts</code> to evolve the schema, or{' '}
            <code>src/App.tsx</code> to redesign the surface.
          </p>
        </footer>
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
