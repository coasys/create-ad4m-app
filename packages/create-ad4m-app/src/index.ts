/**
 * create-ad4m-app — interactive scaffolding CLI.
 *
 * Usage:
 *   npx create-ad4m-app [name]
 *   npx create-ad4m-app [name] --framework solid --ui tailwind --yes
 *
 * Flags:
 *   --framework <solid|react|vue|r3f>
 *   --ui        <tailwind|vanilla>
 *   --extras    <storybook,playwright,husky>   (comma-separated)
 *   --pm        <pnpm|npm|yarn|bun>
 *   --yes / -y                                 (accept all defaults)
 *   --help / -h
 */

import * as p from '@clack/prompts'
import pc from 'picocolors'

import { gatherAnswers, targetDirFor, type CliFlags } from './prompts.js'
import { resolveTemplatesRoot, scaffold } from './scaffold.js'
import { TEMPLATES, type Answers, type Extra, type Framework, type PackageManager, type UiLibrary } from './types.js'

main().catch((err) => {
  console.error(pc.red('Error:'), err instanceof Error ? err.message : String(err))
  process.exit(1)
})

async function main(): Promise<void> {
  const { name, flags } = parseArgs(process.argv.slice(2))

  if (flags.help) {
    printHelp()
    return
  }

  p.intro(pc.bgCyan(pc.black(' create-ad4m-app ')))

  const cwd = process.cwd()
  const answers = await gatherAnswers(cwd, name, flags)
  const targetDir = targetDirFor(cwd, answers.projectName)
  const templatesRoot = resolveTemplatesRoot(import.meta.url)

  const s = p.spinner()
  s.start('Scaffolding')
  try {
    await scaffold(answers, targetDir, templatesRoot)
    s.stop(`Scaffolded ${pc.cyan(answers.projectName)}`)
  } catch (err) {
    s.stop(pc.red('Scaffold failed'))
    throw err
  }

  p.outro(summary(answers, targetDir))
}

function summary(answers: Answers, targetDir: string): string {
  const rel = relativize(targetDir)
  const runCmd = answers.packageManager === 'npm' ? 'npm run' : answers.packageManager
  return [
    `${pc.green('✓')} Project ready at ${pc.cyan(rel)}`,
    '',
    'Next steps:',
    `  ${pc.dim('$')} cd ${rel}`,
    `  ${pc.dim('$')} ${answers.packageManager} install`,
    `  ${pc.dim('$')} ${runCmd} dev`,
    '',
    `Stack: ${TEMPLATES[answers.framework].label} · ${answers.ui === 'tailwind' ? 'Tailwind v4' : 'Plain CSS'}`
  ].join('\n')
}

function relativize(target: string): string {
  const cwd = process.cwd()
  if (target.startsWith(cwd + '/')) return './' + target.slice(cwd.length + 1)
  return target
}

// ---------------------------------------------------------------------------
// Arg parsing (minimal — no external dep)
// ---------------------------------------------------------------------------

interface ParsedArgs {
  name?: string
  flags: CliFlags & { help?: boolean }
}

function parseArgs(argv: string[]): ParsedArgs {
  const flags: ParsedArgs['flags'] = {}
  let name: string | undefined

  // Normalise `--flag=value` into separate tokens for uniform handling.
  const tokens: string[] = []
  for (const raw of argv) {
    if (raw.startsWith('--') && raw.includes('=')) {
      const eq = raw.indexOf('=')
      tokens.push(raw.slice(0, eq), raw.slice(eq + 1))
    } else {
      tokens.push(raw)
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const arg = tokens[i]
    if (arg === '--yes' || arg === '-y') {
      flags.yes = true
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true
    } else if (arg === '--framework') {
      flags.framework = nextValue(tokens, i, arg) as Framework
      i++
    } else if (arg === '--ui') {
      flags.ui = nextValue(tokens, i, arg) as UiLibrary
      i++
    } else if (arg === '--extras') {
      flags.extras = nextValue(tokens, i, arg)
        .split(',')
        .map((x) => x.trim()) as Extra[]
      i++
    } else if (arg === '--pm' || arg === '--package-manager') {
      flags.packageManager = nextValue(tokens, i, arg) as PackageManager
      i++
    } else if (!arg.startsWith('-') && name === undefined) {
      name = arg
    }
  }

  return { name, flags }
}

function nextValue(tokens: string[], i: number, flag: string): string {
  const v = tokens[i + 1]
  if (!v || v.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`)
  }
  return v
}

function printHelp(): void {
  console.log(
    [
      `${pc.bold('create-ad4m-app')} — scaffold an AD4M application`,
      '',
      `${pc.bold('Usage:')}`,
      '  npx create-ad4m-app [name] [options]',
      '',
      `${pc.bold('Options:')}`,
      '  --framework <solid|react|vue|r3f>   Choose the UI framework',
      '  --ui <tailwind|vanilla>             Choose the styling library',
      '  --extras <a,b,c>                    Comma-separated extras',
      '                                        (storybook,playwright,husky)',
      '  --pm <pnpm|npm|yarn|bun>            Package manager',
      '  --yes, -y                           Accept all defaults',
      '  --help, -h                          Show this help',
      '',
      'Default stack: SolidJS + Tailwind v4 + Storybook + Playwright + Husky + pnpm.'
    ].join('\n')
  )
}
