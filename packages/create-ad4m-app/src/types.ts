export type Framework = 'solid' | 'react' | 'vue' | 'r3f'

export type UiLibrary = 'tailwind' | 'vanilla'

export type Extra = 'storybook' | 'playwright' | 'husky'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export interface Answers {
  projectName: string
  framework: Framework
  ui: UiLibrary
  extras: Extra[]
  packageManager: PackageManager
}

export interface TemplateDescriptor {
  framework: Framework
  /** Directory under templates/ to use as the source. */
  sourceDir: string
  /** Human-readable label for prompts and summaries. */
  label: string
}

export const TEMPLATES: Record<Framework, TemplateDescriptor> = {
  solid: { framework: 'solid', sourceDir: 'solid', label: 'SolidJS' },
  react: { framework: 'react', sourceDir: 'react', label: 'React 19' },
  vue: { framework: 'vue', sourceDir: 'vue', label: 'Vue 3' },
  r3f: { framework: 'r3f', sourceDir: 'r3f', label: 'React Three Fiber' }
}
