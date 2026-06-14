# create-ad4m-app

> Interactive scaffolding CLI for AD4M applications.

```bash
npx create-ad4m-app my-app
```

Walks you through framework choice (Solid / React / Vue / R3F), UI library, optional extras (Storybook, Playwright, Husky), and package manager, then generates a ready-to-go project.

## Defaults

Press Enter through every prompt and you get:

- **SolidJS** + Vite 8 + TypeScript 6 (ESM)
- **Tailwind v4** via `@tailwindcss/vite`
- **oxlint + oxfmt** (Rust-based; ~50× faster than eslint+prettier)
- **Vitest** (unit) + **Playwright** (E2E)
- **Storybook** with `storybook-solidjs-vite`
- **Husky + lint-staged** pre-commit hooks
- **pnpm**

## Flags

```
--framework <solid|react|vue|r3f>     # default: solid
--ui        <tailwind|vanilla>        # default: tailwind
--extras    <storybook,playwright,husky>
--pm        <pnpm|npm|yarn|bun>       # default: pnpm
--yes, -y                             # accept defaults, no prompts
--help, -h
```

Example:

```bash
npx create-ad4m-app my-app --framework solid --ui tailwind --yes
```

## What gets generated

A flat single-package SPA, including:

- `src/ad4m/client.ts` — singleton `Ad4mClient` + `@coasys/ad4m-connect` bootstrap with capability presets.
- `src/ad4m/models.ts` — `Note` extending `Ad4mModel` with `@Property` decorators; ensure/list/create helpers for a `Scratch` Perspective.
- `src/App.tsx` — wires it together: connect → identify → provision Perspective → render notes → write back.
- `src/components/StatusBadge.tsx` — a small reusable component (with a Storybook story if you kept Storybook).
- Tests, configs, and Husky hooks reflecting your choices.

The generated `package.json` uses `link:` to a local `@coasys/ad4m` checkout — this will switch to a pinned `^<version>` from npm once the next AD4M release lands.

## Development

```bash
# In the create-ad4m-app monorepo root:
pnpm install
pnpm dev:cli            # run CLI from source via tsx
pnpm build:cli          # bundle to dist/
pnpm test:scaffold      # smoke-test every template
```

## License

CAL-1.0
