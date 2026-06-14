import * as p from '@clack/prompts'
import path from 'node:path'

import {
  TEMPLATES,
  type Answers,
  type Extra,
  type Framework,
  type PackageManager,
  type UiLibrary
} from './types.js'

export interface CliFlags {
  framework?: Framework
  ui?: UiLibrary
  extras?: Extra[]
  packageManager?: PackageManager
  yes?: boolean
}

const DEFAULT_ANSWERS: Omit<Answers, 'projectName'> = {
  framework: 'solid',
  ui: 'tailwind',
  extras: ['storybook', 'playwright', 'husky'],
  packageManager: 'pnpm'
}

/**
 * Resolve the final Answers, prompting interactively for anything not
 * supplied on the command line and not implied by --yes.
 */
export async function gatherAnswers(
  cwd: string,
  rawName: string | undefined,
  flags: CliFlags
): Promise<Answers> {
  const projectName = await resolveProjectName(cwd, rawName)

  if (flags.yes) {
    return {
      projectName,
      framework: flags.framework ?? DEFAULT_ANSWERS.framework,
      ui: flags.ui ?? DEFAULT_ANSWERS.ui,
      extras: flags.extras ?? DEFAULT_ANSWERS.extras,
      packageManager: flags.packageManager ?? DEFAULT_ANSWERS.packageManager
    }
  }

  const framework =
    flags.framework ??
    ((await p.select({
      message: 'Framework',
      initialValue: DEFAULT_ANSWERS.framework as string,
      options: Object.values(TEMPLATES).map((t) => ({
        value: t.framework,
        label: t.label
      }))
    })) as Framework)
  assertNotCancelled(framework)

  const ui =
    flags.ui ??
    ((await p.select({
      message: 'UI library',
      initialValue: DEFAULT_ANSWERS.ui as string,
      options: [
        { value: 'tailwind', label: 'Tailwind v4 (recommended)' },
        { value: 'vanilla', label: 'Plain CSS' }
      ]
    })) as UiLibrary)
  assertNotCancelled(ui)

  const extras =
    flags.extras ??
    ((await p.multiselect({
      message: 'Extras (space to toggle)',
      initialValues: DEFAULT_ANSWERS.extras as string[],
      required: false,
      options: [
        { value: 'storybook', label: 'Storybook (component dev)' },
        { value: 'playwright', label: 'Playwright (E2E tests)' },
        { value: 'husky', label: 'Husky + lint-staged (pre-commit)' }
      ]
    })) as Extra[])
  assertNotCancelled(extras)

  const packageManager =
    flags.packageManager ??
    ((await p.select({
      message: 'Package manager',
      initialValue: DEFAULT_ANSWERS.packageManager as string,
      options: [
        { value: 'pnpm', label: 'pnpm (recommended)' },
        { value: 'npm', label: 'npm' },
        { value: 'yarn', label: 'yarn' },
        { value: 'bun', label: 'bun' }
      ]
    })) as PackageManager)
  assertNotCancelled(packageManager)

  return { projectName, framework, ui, extras, packageManager }
}

async function resolveProjectName(
  cwd: string,
  rawName: string | undefined
): Promise<string> {
  if (rawName) return rawName

  const value = (await p.text({
    message: 'Project name',
    placeholder: 'my-ad4m-app',
    defaultValue: 'my-ad4m-app',
    validate(input) {
      if (!input) return undefined
      if (!/^[a-z0-9-_]+$/i.test(input)) {
        return 'Use only letters, numbers, hyphens, and underscores.'
      }
      if (input === '.') return 'Use an explicit name, not `.`'
      return undefined
    }
  })) as string
  assertNotCancelled(value)
  return value
}

function assertNotCancelled<T>(value: T | symbol): asserts value is T {
  if (p.isCancel(value)) {
    p.cancel('Cancelled. No files were written.')
    process.exit(0)
  }
}

/**
 * Resolve an absolute target directory for the scaffold.
 */
export function targetDirFor(cwd: string, projectName: string): string {
  return path.resolve(cwd, projectName)
}
