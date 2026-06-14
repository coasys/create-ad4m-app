<script setup lang="ts">
import { computed } from 'vue'

type State = 'pending' | 'connected' | 'error'
const props = defineProps<{ state: State }>()

const STYLES: Record<State, string> = {
  pending: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  connected: 'bg-emerald-950 border-emerald-700 text-emerald-300',
  error: 'bg-rose-950 border-rose-700 text-rose-300'
}
const DOT: Record<State, string> = {
  pending: 'bg-zinc-400 animate-pulse',
  connected: 'bg-emerald-400',
  error: 'bg-rose-400'
}
const styleClass = computed(() => STYLES[props.state])
const dotClass = computed(() => DOT[props.state])
</script>

<template>
  <div
    :class="`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${styleClass}`"
  >
    <span :class="`w-1.5 h-1.5 rounded-full ${dotClass}`" />
    <span><slot /></span>
  </div>
</template>
