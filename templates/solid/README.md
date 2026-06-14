# __APP_NAME__

An AD4M application scaffolded with [`create-ad4m-app`](https://github.com/coasys/create-ad4m-app).

## Stack

| | |
|---|---|
| Build | Vite 8 |
| Language | TypeScript 6 (ESM) |
| Framework | SolidJS |
| Styling | Tailwind v4 |
| Lint | oxlint |
| Format | oxfmt |
| Unit tests | Vitest |
| E2E | Playwright |
| Stories | Storybook |
| Git hooks | Husky + lint-staged |
| Package mgr | pnpm |
| AD4M client | `@coasys/ad4m` + `@coasys/ad4m-connect` |

## Quick start

```bash
# Install dependencies
pnpm install

# Start the dev server (http://localhost:3000)
pnpm dev

# Type-check + lint
pnpm check

# Run unit tests
pnpm test:unit

# Run end-to-end tests
pnpm test

# Open Storybook
pnpm storybook

# Build for production
pnpm build
pnpm preview
```

## Prerequisites

The app expects an **AD4M executor** running on your machine. Install the [AD4M Launcher](https://ad4m.dev) or run `ad4m-executor run` from a local checkout. On first connect, the executor will prompt you to grant the app capabilities.

## What the demo does

`src/App.tsx` shows the minimum useful AD4M wiring:

1. **Connect** via `@coasys/ad4m-connect` — opens the capability popup, stores a JWT, returns an `Ad4mClient`.
2. **Identify** — fetches the agent DID via `client.agent.me()` and displays it.
3. **Provision a Perspective** — ensures a `Scratch` Perspective exists (creates one if not).
4. **Define a model** — `Note` extends `Ad4mModel` with `@Property` decorators (`body`, `createdAt`); each property is a link triple resolved through the `literal://` Expression Language.
5. **Write + read** — `createNote` / `listNotes` persist into and query the Perspective. Reactivity updates the UI on each successful write.

Edit `src/ad4m/models.ts` to extend the schema, or `src/App.tsx` to redesign the surface.

## Project structure

```
src/
├── ad4m/
│   ├── client.ts            # Ad4mClient singleton + capability bootstrap
│   └── models.ts            # Note Ad4mModel + ensure/list/create helpers
├── components/
│   └── StatusBadge.tsx
├── styles/
│   └── index.css            # @import "tailwindcss";
├── App.tsx                  # Demo: connect → list/create notes
└── index.tsx                # Solid render entry point

tests/                       # Playwright E2E
src/**/__tests__/            # Vitest unit tests
stories/                     # Storybook stories
.storybook/                  # Storybook config
```

## Capabilities

The default request grants the app every capability (`{ domain: "*", pointers: ["*"], can: ["*"] }`) — sane for a fresh project. Narrow it in `src/ad4m/client.ts` once you know what your app actually needs.

## License

MIT
