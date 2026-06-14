import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
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
    <div className="relative w-screen h-screen">
      <Canvas className="absolute inset-0" camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={2.5} color="#10b981" />
        <pointLight position={[-5, -5, 3]} intensity={1.5} color="#3b82f6" />
        <NoteCloud count={notes.length} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>

      <aside className="absolute top-6 left-6 right-6 max-w-md space-y-4 z-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight drop-shadow">__APP_NAME__</h1>
          <StatusBadge state={status}>
            {status === 'connected' && 'AD4M connected'}
            {status === 'pending' && 'Connecting…'}
            {status === 'error' && 'Connection error'}
          </StatusBadge>
        </div>
        {agentDid && (
          <div className="rounded-md bg-zinc-900/80 backdrop-blur border border-zinc-800 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">You are</p>
            <code className="text-emerald-400 text-sm break-all">{agentDid}</code>
          </div>
        )}
        {error && (
          <div className="rounded-md bg-rose-950/60 backdrop-blur border border-rose-900 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form
          onSubmit={onAdd}
          className="flex gap-2 rounded-md bg-zinc-900/80 backdrop-blur border border-zinc-800 p-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Spawn a note…"
            disabled={status !== 'connected'}
            className="flex-1 bg-transparent text-sm placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status !== 'connected' || submitting || !draft.trim()}
            className="rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-medium px-3 py-1 disabled:opacity-50"
          >
            +
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          {notes.length} note{notes.length === 1 ? '' : 's'} in the Scratch
          Perspective. Each spawns a sphere — live AD4M state shaping the scene.
        </p>
      </aside>
    </div>
  )
}

function NoteCloud({ count }: { count: number }) {
  const spheres = Array.from({ length: Math.max(count, 1) }, (_, i) => i)
  return (
    <>
      {spheres.map((i) => (
        <Float key={i} speed={1 + i * 0.1} rotationIntensity={0.4} floatIntensity={0.8}>
          <Sphere index={i} total={spheres.length} />
        </Float>
      ))}
    </>
  )
}

function Sphere({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2
  const radius = 2.5
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  const y = Math.sin(index * 0.7) * 0.5

  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<import('three').Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? '#10b981' : '#52525b'}
        emissive={hovered ? '#10b981' : '#000000'}
        emissiveIntensity={hovered ? 0.4 : 0}
        roughness={0.3}
        metalness={0.4}
      />
    </mesh>
  )
}

