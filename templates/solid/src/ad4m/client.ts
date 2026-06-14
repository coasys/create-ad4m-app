/**
 * Singleton AD4M client + capability-based connection bootstrap.
 *
 * Two modes are supported:
 *
 *   1. **Popup (default)** — `getAd4mClient()` mounts the ad4m-connect
 *      capability UI. The user is prompted once; the JWT is stored in
 *      localStorage and reused on subsequent loads. Best for production
 *      apps where the agent owns the executor.
 *
 *   2. **Multi-user (headless)** — uncomment the `Ad4mConnect` block at
 *      the bottom and provide `VITE_AD4M_USER_EMAIL` / `VITE_AD4M_USER_PASSWORD`
 *      in `.env`. The client logs in (or signs up on first run) without
 *      a popup. Required when the executor is in `--enable-multi-user`
 *      mode; useful for headless dev / CI.
 *
 * The executor's master agent must already exist (`bin/ad4m start`
 * handles this on first run).
 */

import { getAd4mClient } from '@coasys/ad4m-connect'
import type { Ad4mClient } from '@coasys/ad4m'

let _client: Ad4mClient | null = null
let _pending: Promise<Ad4mClient> | null = null

const APP_META = {
  appInfo: {
    name: '__APP_NAME__',
    description: 'An AD4M app scaffolded with create-ad4m-app',
    url: 'localhost',
    iconPath: '/favicon.ico'
  },
  capabilities: [{ with: { domain: '*', pointers: ['*'] }, can: ['*'] }]
}

/**
 * Open the connect popup (if needed) and return a connected client.
 * Safe to call from many places — only one popup ever opens.
 */
export async function ensureConnection(): Promise<Ad4mClient> {
  if (_client) return _client
  if (_pending) return _pending
  _pending = (async () => {
    const client = await getAd4mClient(APP_META)
    _client = client
    return client
  })()
  return _pending
}

/** Throws if connection hasn't been awaited yet. */
export function client(): Ad4mClient {
  if (!_client) {
    throw new Error('AD4M client not initialised — await ensureConnection() first.')
  }
  return _client
}

// ---------------------------------------------------------------------------
// Multi-user / headless alternative — uncomment to use instead of the popup
// ---------------------------------------------------------------------------
//
// Requires the executor to be started with `--enable-multi-user true`
// (`bin/ad4m start` does this when MULTI_USER=true in .env).
//
// import Ad4mConnect from '@coasys/ad4m-connect/core'
//
// export async function ensureConnection(): Promise<Ad4mClient> {
//   if (_client) return _client
//   if (_pending) return _pending
//   _pending = (async () => {
//     const port = Number(import.meta.env.VITE_AD4M_PORT ?? 12000)
//     const email = import.meta.env.VITE_AD4M_USER_EMAIL
//     const password = import.meta.env.VITE_AD4M_USER_PASSWORD
//     if (!email || !password) {
//       throw new Error('Set VITE_AD4M_USER_EMAIL and VITE_AD4M_USER_PASSWORD in .env')
//     }
//     const core = new Ad4mConnect({
//       ...APP_META,
//       port,
//       url: `ws://localhost:${port}/graphql`,
//       multiUser: true,
//       userEmail: email,
//       userPassword: password
//     })
//     if (!(await core.isMultiUser())) {
//       throw new Error('Executor is not in multi-user mode — start with --enable-multi-user true.')
//     }
//     let ok = await core.loginWithPassword(email, password)
//     if (!ok) ok = await core.createAccount(email, password)
//     if (!ok || !core.ad4mClient) {
//       throw new Error('Authentication failed against AD4M executor.')
//     }
//     _client = core.ad4mClient as Ad4mClient
//     return _client
//   })()
//   return _pending
// }
