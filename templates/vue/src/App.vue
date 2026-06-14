<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import type { PerspectiveProxy } from '@coasys/ad4m'

import { client, ensureConnection } from './ad4m/client'
import { createNote, ensureScratchPerspective, listNotes, Note } from './ad4m/models'
import StatusBadge from './components/StatusBadge.vue'

type Status = 'pending' | 'connected' | 'error'

const status = ref<Status>('pending')
const error = ref<string | null>(null)
const agentDid = ref<string | null>(null)
// shallowRef avoids Vue's deep reactive proxy wrapping the PerspectiveProxy
// — necessary because PerspectiveProxy uses TypeScript `#private` fields,
// which the deep Proxy can't impersonate without breaking type identity.
const perspective = shallowRef<PerspectiveProxy | null>(null)
const notes = shallowRef<Note[]>([])
const draft = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    await ensureConnection()
    const me = await client().agent.me()
    const persp = await ensureScratchPerspective()
    agentDid.value = me.did
    perspective.value = persp
    notes.value = await listNotes(persp)
    status.value = 'connected'
  } catch (err) {
    status.value = 'error'
    error.value = err instanceof Error ? err.message : String(err)
  }
})

async function onAdd(event: Event) {
  event.preventDefault()
  const body = draft.value.trim()
  const persp = perspective.value
  if (!body || !persp || submitting.value) return
  submitting.value = true
  try {
    await createNote(persp, body)
    draft.value = ''
    notes.value = await listNotes(persp)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    submitting.value = false
  }
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <main class="min-h-screen px-6 py-10 max-w-2xl mx-auto">
    <header class="mb-10 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-3xl font-semibold tracking-tight">__APP_NAME__</h1>
        <StatusBadge :state="status">
          <span v-if="status === 'connected'">AD4M connected</span>
          <span v-else-if="status === 'pending'">Connecting…</span>
          <span v-else>Connection error</span>
        </StatusBadge>
      </div>
      <p class="text-sm text-zinc-400">
        A working AD4M demo: connect, ensure a Perspective, define a model, write
        notes as link triples — all from the same client.
      </p>
      <div
        v-if="agentDid"
        class="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3"
      >
        <p class="text-xs uppercase tracking-wide text-zinc-500 mb-1">You are</p>
        <code class="text-emerald-400 text-sm break-all">{{ agentDid }}</code>
      </div>
      <div
        v-if="error"
        class="rounded-md bg-rose-950/40 border border-rose-900 px-4 py-3 text-sm text-rose-300"
      >
        {{ error }}
      </div>
    </header>

    <section>
      <div class="flex items-baseline justify-between mb-4">
        <h2 class="text-xl font-medium">Notes</h2>
        <span class="text-sm text-zinc-500">{{ notes.length }}</span>
      </div>

      <form class="flex gap-2 mb-6" @submit="onAdd">
        <input
          v-model="draft"
          type="text"
          placeholder="Write a note…"
          :disabled="status !== 'connected'"
          class="flex-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
        />
        <button
          type="submit"
          :disabled="status !== 'connected' || submitting || !draft.trim()"
          class="rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 text-sm font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Adding…' : 'Add' }}
        </button>
      </form>

      <div
        v-if="notes.length === 0"
        class="rounded-md border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500"
      >
        No notes yet. Add one above to see it persist into the Perspective.
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="(note, idx) in notes"
          :key="`${note.createdAt}-${idx}`"
          class="rounded-md bg-zinc-900 border border-zinc-800 px-4 py-3"
        >
          <p class="text-sm">{{ note.body }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ formatTimestamp(note.createdAt) }}</p>
        </li>
      </ul>
    </section>
  </main>
</template>
