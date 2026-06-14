# create-ad4m-app

The starter toolkit for building AD4M apps. One repo, two products:

1. **`create-ad4m-app`** — interactive CLI in [`packages/create-ad4m-app`](./packages/create-ad4m-app). Run `npx create-ad4m-app my-app` to scaffold a new project.
2. **Project templates** — under [`templates/`](./templates). The `default` template is the reference SolidJS + Vite 8 + Tailwind v4 stack; alternates exist for React, Vue, and React Three Fiber.

## Quick start

```bash
npx create-ad4m-app my-app
cd my-app
pnpm install
pnpm dev
```

The CLI walks you through framework choice, UI library, optional extras (Storybook, Playwright, Husky), and package manager.

## Default stack

The `solid` template — the one you get if you press Enter through every prompt — is the current opinionated working setup.

| Layer | Tool |
|---|---|
| Build | Vite 8 |
| Language | TypeScript 6 (ESM) |
| Framework | SolidJS |
| Styling | Tailwind v4 (Vite plugin, no PostCSS) |
| Lint | oxlint |
| Format | oxfmt |
| Unit tests | Vitest |
| E2E | Playwright |
| Components | Storybook |
| Hooks | Husky + lint-staged |
| Package mgr | pnpm |
| AD4M client | `@coasys/ad4m` + `@coasys/ad4m-connect` |

The demo app connects to a running AD4M executor, displays the agent DID, ensures a `Scratch` perspective exists, defines a `Note` model via `Ad4mModel` + `@Property`, and lets you create notes from the UI — reactivity proves the AD4M connection is live.

## Variants

| Template | Framework | Notes |
|---|---|---|
| `solid` | SolidJS | The default; full-featured. |
| `react` | React 19 | Minimal-but-working demo. |
| `vue` | Vue 3 | Minimal-but-working demo. |
| `r3f` | React Three Fiber | Minimal-but-working demo; AD4M state drives a 3D scene. |

All variants share `templates/_common/`, which the scaffolder overlays into every project before the framework files copy on top. Common files include `.gitignore`, `.nvmrc`, `.husky/pre-commit`, `.env.example`, `bin/ad4m` (executor lifecycle helper), and `CLAUDE.md` / `AGENTS.md` (agent docs).

## Layout

```
create-ad4m-app/
├── packages/
│   └── create-ad4m-app/        # the CLI
│       ├── bin/                # `bin/create-ad4m-app.js` shebang
│       ├── src/                # TS source (built to dist/)
│       └── package.json
├── templates/
│   ├── _common/                # shared files merged into every scaffold
│   ├── solid/                  # default; solid + tailwind v4
│   ├── react/
│   ├── vue/
│   └── r3f/
└── scripts/
    └── test-scaffold.mjs       # smoke test: scaffolds, installs, builds
```

## Development

```bash
pnpm install                    # installs the CLI's deps
pnpm dev:cli                    # run the CLI in dev mode (tsx)
pnpm build:cli                  # bundle the CLI to dist/
pnpm test:scaffold              # smoke-test every template
```

## AD4M dependency

The templates currently use `link:` to a local `@coasys/ad4m` checkout for development. This will switch to a pinned `^<version>` from npm once the next AD4M release lands. Until then, the scaffolded `package.json` includes a comment noting the dev-time linkage.

## License

CAL-1.0
