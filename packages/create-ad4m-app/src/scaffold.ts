/**
 * File-system scaffolding: copy a template tree into the target dir,
 * substitute placeholders, then prune optional pieces the user opted
 * out of.
 *
 * Templates live alongside the CLI in `templates/` at the repo root
 * (development) or as a sibling `templates/` folder bundled with the
 * published package (production). The resolver tries both.
 */

import fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { TEMPLATES, type Answers, type Extra } from './types.js'

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

/**
 * Resolve the absolute path to the repo's `templates/` directory.
 * Tries a few locations to cover both source-mode (tsx) and built
 * (dist) execution layouts.
 */
export function resolveTemplatesRoot(metaUrl: string): string {
  const here = path.dirname(fileURLToPath(metaUrl))
  const candidates = [
    // <repo>/packages/create-ad4m-app/dist/index.js → ../../../templates
    path.resolve(here, '..', '..', '..', 'templates'),
    // <repo>/packages/create-ad4m-app/src/index.ts  → ../../../templates
    path.resolve(here, '..', '..', 'templates'),
    // Published layout: <pkg>/dist/index.js + <pkg>/templates
    path.resolve(here, '..', 'templates')
  ]
  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) return candidate
  }
  throw new Error(`Could not find templates/ directory. Looked in:\n  ${candidates.join('\n  ')}`)
}

export async function scaffold(answers: Answers, targetDir: string, templatesRoot: string): Promise<void> {
  const commonDir = path.join(templatesRoot, '_common')
  const sourceDir = path.join(templatesRoot, TEMPLATES[answers.framework].sourceDir)
  await ensureDirIsEmpty(targetDir)
  // _common/ is overlaid first; framework files copy on top so a
  // framework-specific override (e.g. its own .gitignore) wins.
  if (fsSync.existsSync(commonDir)) {
    await copyTree(commonDir, targetDir)
  }
  await copyTree(sourceDir, targetDir)
  await applySubstitutions(targetDir, answers)
  await applyExtras(targetDir, answers)
  await applyUi(targetDir, answers)
  await applyPackageManager(targetDir, answers)
}

async function ensureDirIsEmpty(dir: string): Promise<void> {
  try {
    const entries = await fs.readdir(dir)
    if (entries.length > 0) {
      throw new Error(`Target directory '${dir}' is not empty. Aborting to avoid overwriting files.`)
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
    // ENOENT: directory doesn't exist; copyTree will create it.
  }
}

async function copyTree(src: string, dst: string): Promise<void> {
  const entries = await fs.readdir(src, { withFileTypes: true })
  await fs.mkdir(dst, { recursive: true })
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)
    if (entry.isDirectory()) {
      await copyTree(s, d)
    } else if (entry.isFile()) {
      await fs.copyFile(s, d)
    }
  }
}

const SUBSTITUTION_EXTENSIONS = new Set([
  '.json', '.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.md', '.yaml', '.yml'
])

async function applySubstitutions(targetDir: string, answers: Answers): Promise<void> {
  const replacements: Array<[RegExp, string]> = [
    [/__APP_NAME__/g, answers.projectName]
  ]
  await walkFiles(targetDir, async (filePath) => {
    if (!SUBSTITUTION_EXTENSIONS.has(path.extname(filePath))) return
    const original = await fs.readFile(filePath, 'utf8')
    let next = original
    for (const [pattern, replacement] of replacements) {
      next = next.replace(pattern, replacement)
    }
    if (next !== original) {
      await fs.writeFile(filePath, next)
    }
  })
}

async function walkFiles(root: string, visit: (filePath: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const p = path.join(root, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walkFiles(p, visit)
    } else if (entry.isFile()) {
      await visit(p)
    }
  }
}

// ---------------------------------------------------------------------------
// Extras pruning
// ---------------------------------------------------------------------------

/**
 * If the user opted out of an extra, delete its files and strip the
 * corresponding sections from package.json.
 */
async function applyExtras(targetDir: string, answers: Answers): Promise<void> {
  const wants = new Set<Extra>(answers.extras)

  if (!wants.has('storybook')) {
    await removePaths(targetDir, ['.storybook', 'stories'])
    await mutatePackageJson(targetDir, (pkg) => {
      removeScripts(pkg, ['storybook', 'build-storybook'])
      removeDevDeps(pkg, [
        'storybook',
        'storybook-solidjs-vite',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-links',
        '@storybook/blocks'
      ])
    })
  }

  if (!wants.has('playwright')) {
    await removePaths(targetDir, ['tests', 'playwright.config.ts'])
    await mutatePackageJson(targetDir, (pkg) => {
      removeScripts(pkg, ['test'])
      removeDevDeps(pkg, ['@playwright/test'])
    })
  }

  if (!wants.has('husky')) {
    await removePaths(targetDir, ['.husky'])
    await mutatePackageJson(targetDir, (pkg) => {
      removeScripts(pkg, ['prepare'])
      removeDevDeps(pkg, ['husky', 'lint-staged'])
      delete pkg['lint-staged']
    })
  }
}

// ---------------------------------------------------------------------------
// UI library swap
// ---------------------------------------------------------------------------

async function applyUi(targetDir: string, answers: Answers): Promise<void> {
  if (answers.ui === 'tailwind') return

  // Strip tailwind: replace styles/index.css with a minimal stylesheet,
  // remove plugin imports from vite.config.ts, drop dev deps.
  const indexCss = path.join(targetDir, 'src', 'styles', 'index.css')
  await fs.writeFile(
    indexCss,
    `html,
body,
#root {
  height: 100%;
  margin: 0;
  background: #09090b;
  color: #fafafa;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
`
  )

  const viteConfig = path.join(targetDir, 'vite.config.ts')
  await replaceInFile(viteConfig, /import tailwindcss from '@tailwindcss\/vite'\n/, '')
  await replaceInFile(viteConfig, /tailwindcss\(\),\s*/, '')

  await mutatePackageJson(targetDir, (pkg) => {
    removeDevDeps(pkg, ['@tailwindcss/vite', 'tailwindcss'])
  })
}

// ---------------------------------------------------------------------------
// Package-manager hints
// ---------------------------------------------------------------------------

async function applyPackageManager(targetDir: string, answers: Answers): Promise<void> {
  // The template scripts use `pnpm dev`/`pnpm exec lint-staged` directly.
  // For other PMs, rewrite to the equivalent runner.
  if (answers.packageManager === 'pnpm') return

  const runner = {
    pnpm: 'pnpm',
    npm: 'npm run',
    yarn: 'yarn',
    bun: 'bun run'
  } as const
  const exec = {
    pnpm: 'pnpm exec',
    npm: 'npx',
    yarn: 'yarn',
    bun: 'bunx'
  } as const

  // playwright.config.ts references `pnpm dev` for its dev server.
  const pwConfig = path.join(targetDir, 'playwright.config.ts')
  await tryReplaceInFile(pwConfig, /'pnpm dev'/g, `'${runner[answers.packageManager]} dev'`)

  // .husky/pre-commit uses `pnpm exec lint-staged`
  const huskyHook = path.join(targetDir, '.husky', 'pre-commit')
  await tryReplaceInFile(
    huskyHook,
    /pnpm exec lint-staged/g,
    `${exec[answers.packageManager]} lint-staged`
  )
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

async function removePaths(targetDir: string, relPaths: string[]): Promise<void> {
  for (const rel of relPaths) {
    const abs = path.join(targetDir, rel)
    try {
      await fs.rm(abs, { recursive: true, force: true })
    } catch {
      // already absent
    }
  }
}

async function mutatePackageJson(
  targetDir: string,
  mutate: (pkg: Record<string, any>) => void
): Promise<void> {
  const p = path.join(targetDir, 'package.json')
  const raw = await fs.readFile(p, 'utf8')
  const pkg = JSON.parse(raw)
  mutate(pkg)
  await fs.writeFile(p, JSON.stringify(pkg, null, 2) + '\n')
}

function removeScripts(pkg: Record<string, any>, names: string[]): void {
  if (!pkg.scripts) return
  for (const name of names) {
    delete pkg.scripts[name]
  }
}

function removeDevDeps(pkg: Record<string, any>, names: string[]): void {
  if (!pkg.devDependencies) return
  for (const name of names) {
    delete pkg.devDependencies[name]
  }
}

async function replaceInFile(filePath: string, pattern: RegExp, replacement: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf8')
  await fs.writeFile(filePath, content.replace(pattern, replacement))
}

async function tryReplaceInFile(filePath: string, pattern: RegExp, replacement: string): Promise<void> {
  try {
    await replaceInFile(filePath, pattern, replacement)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}
