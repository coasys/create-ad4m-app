#!/usr/bin/env node

import('../dist/index.js').catch((err) => {
  if (err && err.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('Error: The CLI has not been built. Run `pnpm --filter create-ad4m-app build` first.')
    process.exit(1)
  }
  console.error(err)
  process.exit(1)
})
