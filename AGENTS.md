# Agents: maintaining `create-ad4m-app`

Audience: an AI coding agent extending or maintaining this repo. Skip the marketing — read this once and act on it.

## What this repo is

Two products in one monorepo:

1. **`packages/create-ad4m-app/`** — a small CLI that scaffolds an AD4M project from one of the templates.
2. **`templates/`** — the actual project templates. `solid` is the default; `react`, `vue`, `r3f` are alternates. `_common/` is overlaid into every scaffold.

**The CLI is small. Almost all the value is in the templates. Treat the templates as the product.**

## The AD4M API moves; verify before you write

`@coasys/ad4m` and `@coasys/ad4m-connect` are pre-1.0 (currently `0.13.0-test-N`). Decorator names, exports, and option shapes change between releases. **Before changing a template's import or decorator usage, grep the actual source.** Do not copy from old docs, blog posts, or training data.

Canonical sources:

- `~/workspaces/coasys/ad4m/core/src/model/decorators.ts` — `@Model`, `@Property`, `@Optional`, `@ReadOnly`, `@Flag`, `@HasMany`, `@HasOne`. The `PropertyOptions` interface lives here.
- `~/workspaces/coasys/ad4m/core/src/model/Ad4mModel.ts` — the base class subjects extend.
- `~/workspaces/coasys/ad4m/core/src/perspectives/PerspectiveProxy.ts` — `createSubject`, `getAllSubjectInstances`, etc.
- `~/workspaces/coasys/ad4m/connect/src/index.ts` — `getAd4mClient`, `getAd4mConnect`, `isEmbedded` (no default export).
- `~/workspaces/coasys/ad4m/connect/src/core.ts` — `Ad4mConnect` class for headless multi-user flows.
- `~/workspaces/coasys/ad4m/connect/src/types.ts` — `Ad4mConnectOptions` shape.

## Things that bite (verify checklist)

If a change touches AD4M imports, grep `decorators.ts` / `index.ts` to confirm each item:

- [ ] Decorator name is `@Model`, **not** `@ModelOptions`.
- [ ] Property writability is `readOnly?: boolean`, **not** `writable: boolean`. Properties are writable by default when `through:` is set.
- [ ] `required: true` requires a non-empty `initial: <string>`. An empty string fails the runtime guard because `!''` is truthy. Prefer dropping `required` and validating at the UI layer.
- [ ] `@coasys/ad4m-connect` has **no default export**. Use named imports: `getAd4mClient`, `getAd4mConnect`, `isEmbedded`. For headless flow, import `Ad4mConnect` from `@coasys/ad4m-connect/core`.
- [ ] `Ad4mConnectOptions` uses a nested `appInfo: { name, description, url, iconPath? }`, **not** flat `appName / appDesc / appDomain / appIconPath`.
- [ ] `LinkQuery` is a class — pass `new LinkQuery({…})` to query methods, not a plain object literal.

## How `_common/` works

`scaffold.ts` first copies `templates/_common/` into the target, then copies the chosen framework template on top — so a framework-specific file (e.g. its own `.gitignore`) overrides the common one.

Files in `_common/`:

- `.gitignore`, `.nvmrc`, `.husky/pre-commit` — shared editor / hook configs.
- `bin/ad4m` — executor lifecycle helper (init / start / stop / restart / status / logs).
- `.env.example` — copy to `.env` for runtime config.
- `CLAUDE.md` — instructions for agents working **inside** a scaffolded project.

Add new shared files here when at least two frameworks need them. If only one needs it, put it in that framework's directory.

## Verifying changes

Always before pushing:

```bash
pnpm build:cli                # rebuild the bundled CLI
# Scaffold every framework into a sandbox:
for fw in solid react vue r3f; do
  rm -rf /tmp/cad4m-verify/$fw-app
  node packages/create-ad4m-app/bin/create-ad4m-app.js \
    /tmp/cad4m-verify/$fw-app --yes --framework $fw
done
# Then for each scaffolded project: pnpm install && pnpm check
```

A change that doesn't `pnpm check` cleanly in every framework variant should not land.

## Adding a new template

1. Copy `templates/solid/` (or whichever existing template is closest) as a baseline.
2. Edit the demo files: `index.html`, `src/main.*`, `src/App.*`, framework-idiomatic versions of `src/ad4m/client.ts` and `src/ad4m/models.ts`.
3. Add an entry to `TEMPLATES` in `packages/create-ad4m-app/src/types.ts` and the `Framework` union.
4. Update the prompts in `packages/create-ad4m-app/src/prompts.ts` if the new value isn't auto-listed from `TEMPLATES`.
5. Run the verify loop above. Fix anything that breaks.

## Things to avoid

- **Don't** invent a `writable:` field, `@ModelOptions` decorator, or flat `appName` config. They look right; they aren't.
- **Don't** add a `prepare: husky` script unless husky is actually in the resolved devDependencies. The scaffolder's `applyExtras` already handles this — verify after refactors.
- **Don't** copy AD4M client code from training data. The API is moving; verify against source.
- **Don't** mutate `templates/_common/` in ways that conflict with a framework template's expected layout. Adding `.foo` is safe; adding a `src/main.tsx` is not.
