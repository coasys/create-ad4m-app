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

export function client(): Ad4mClient {
  if (!_client) {
    throw new Error('AD4M client not initialised — await ensureConnection() first.')
  }
  return _client
}
