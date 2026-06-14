/**
 * Sample Ad4mModel: `Note`.
 *
 * Demonstrates the SDNA model pattern — properties declared with
 * `@Property` are persisted as link triples in the underlying
 * Perspective, with their values stored via the `literal:`
 * Expression Language (note: `literal:` — no slashes; the
 * `literal://` form was removed and now throws).
 *
 * Adding a property here automatically extends the SDNA contract:
 * the runtime adds the corresponding SHACL shape and the field is
 * queryable through the same Perspective.
 */

import { Ad4mModel, Model, Property } from '@coasys/ad4m'
import type { PerspectiveProxy } from '@coasys/ad4m'
import { client, ensureConnection } from './client'

const SCRATCH_PERSPECTIVE_NAME = 'Scratch'

// `@Model` registers this class with the runtime under the given name.
// Properties decorated with `@Property` become link triples in the
// Perspective; `through:` is the predicate URI, `resolveLanguage:`
// names the Expression Language used to resolve the target.
//
// Notes on PropertyOptions:
//   - Properties are writable by default. Use `@ReadOnly` (or
//     `readOnly: true`) when you want immutable fields.
//   - `required: true` is enforced at SDNA-load time and demands a
//     non-empty `initial: <string>`. We omit it here and let the
//     UI enforce non-empty input on the form instead — cleaner for a
//     demo.
@Model({ name: 'Note' })
export class Note extends Ad4mModel {
  @Property({
    through: 'note://body',
    resolveLanguage: 'literal'
  })
  body!: string

  @Property({
    through: 'note://createdAt',
    resolveLanguage: 'literal'
  })
  createdAt!: string
}

/**
 * Ensure a working Perspective exists for the demo. We use a fixed
 * name (`Scratch`) so re-opening the app keeps the existing data.
 * Real apps would surface a perspective picker instead.
 */
export async function ensureScratchPerspective(): Promise<PerspectiveProxy> {
  await ensureConnection()
  const c = client()
  const all = await c.perspective.all()
  const existing = all.find((p) => p.name === SCRATCH_PERSPECTIVE_NAME)
  if (existing) return existing
  return await c.perspective.add(SCRATCH_PERSPECTIVE_NAME)
}

/** List every note currently in the perspective. */
export async function listNotes(perspective: PerspectiveProxy): Promise<Note[]> {
  // `getAllSubjectInstances<T>(Note)` is typed as returning `T[]` where
  // T = typeof Note. At runtime it returns actual instances; this cast
  // bridges the API's generic shape and the runtime reality.
  const notes = await perspective.getAllSubjectInstances(Note)
  return notes as unknown as Note[]
}

/** Create a new note with the given body. Returns the created instance. */
export async function createNote(
  perspective: PerspectiveProxy,
  body: string
): Promise<Note> {
  // Same generic-shape caveat as `getAllSubjectInstances`.
  const note = await perspective.createSubject(Note, randomBase(), {
    body,
    createdAt: new Date().toISOString()
  })
  return note as unknown as Note
}

/**
 * Generate a random base URI for a new subject. Subjects need a
 * stable URI; we synthesise one per note so each is distinct in
 * the link graph.
 */
function randomBase(): string {
  const r = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  return `note://${Date.now().toString(36)}-${r}`
}
