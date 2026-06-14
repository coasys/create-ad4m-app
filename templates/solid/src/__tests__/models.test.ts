/**
 * Lightweight unit test demonstrating the testing surface.
 *
 * Real model assertions require a running AD4M executor + an
 * authenticated `PerspectiveProxy`. The decorator-only check here
 * is enough to catch import / module-load regressions; full
 * integration coverage is in the Playwright suite under `tests/`.
 */

import { describe, expect, it } from 'vitest'
import { Note } from '../ad4m/models'

describe('Note model', () => {
  it('exposes its class identity', () => {
    expect(Note).toBeDefined()
    expect(Note.name).toBe('Note')
  })
})
