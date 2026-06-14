# Agent guide for this AD4M app

Audience: an AI coding agent working **inside this scaffolded project**. Read this first; it tells you what AD4M idioms to follow and where this app keeps its state.

## What this project is

A frontend (SolidJS / React / Vue / R3F — depends on which template you scaffolded from) talking to a local `ad4m-executor` over WebSocket via `@coasys/ad4m` + `@coasys/ad4m-connect`. The executor is a separate process on your machine; the app does not embed it.

## Running

```bash
pnpm install
pnpm ad4m:start         # starts the executor in the background
pnpm dev                # http://localhost:3000
```

Backend (`bin/ad4m`) and frontend (Vite) read the same `.env`. Copy `.env.example` to `.env` and fill in `AD4M_CLI_PATH` + `AD4M_AGENT_PASSPHRASE` at minimum.

Useful scripts:

| | |
|---|---|
| `pnpm ad4m:status` | Is the executor up? PID? port? |
| `pnpm ad4m:logs` | Tail executor stdout/stderr |
| `pnpm ad4m:restart` | Stop + start (clears the popup token state) |
| `pnpm ad4m:stop` | Stop |
| `pnpm check` | TypeScript + oxlint |
| `pnpm test:unit` | Vitest |
| `pnpm test` | Playwright E2E |

## Where state lives

- **Executor data**: `$AD4M_DATA_PATH` (default: `~/.ad4m-<app-name>/`). Each app should have its own, set in `.env`. Stomping on another app's data path is destructive.
- **PID + logs**: `./.run/` inside the project. Gitignored.
- **Frontend auth token** (popup mode): browser `localStorage`. Clear it (or hard-reload with cache off) if the connect flow gets stuck.

## The model layer

Subjects extend `Ad4mModel`. Decorate the class with `@Model({ name })` and properties with `@Property` / `@Optional` / `@ReadOnly` / `@HasMany` / `@HasOne` / `@Flag`. Each property's `through:` is the predicate URI the property's value is linked under; `resolveLanguage:` names the Expression Language used to resolve the target.

```typescript
import { Ad4mModel, Model, Property, Optional } from '@coasys/ad4m'

@Model({ name: 'Note' })
export class Note extends Ad4mModel {
  @Property({ through: 'note://body', resolveLanguage: 'literal' })
  body!: string

  @Optional({ through: 'note://tags', resolveLanguage: 'literal' })
  tags?: string
}
```

**Important caveats** (verify against `~/workspaces/coasys/ad4m/core/src/model/decorators.ts`):

- Properties are **writable by default**. To make one read-only, set `readOnly: true` (or use the `@ReadOnly` decorator). There is no `writable:` field.
- `required: true` is enforced at SDNA-load time and **requires a non-empty `initial: <string>`**. Empty string fails the guard. If you don't have a sensible default, drop `required:` and enforce non-empty input at the UI/API layer.

See `src/ad4m/models.ts` for the demo `Note` model.

## The connect flow

Two modes, both wired in `src/ad4m/client.ts`:

1. **Popup (default)** — `getAd4mClient(APP_META)` mounts the ad4m-connect capability UI. The user grants permissions once and the JWT is cached in `localStorage`.
2. **Multi-user (headless)** — `new Ad4mConnect({...})` from `@coasys/ad4m-connect/core`, with `userEmail` + `userPassword` from `.env`. Requires the executor started with `MULTI_USER=true` (which makes `bin/ad4m start` pass `--enable-multi-user true`).

`APP_META`'s shape is `{ appInfo: { name, description, url, iconPath? }, capabilities: [...] }`. Not the flat `appName / appDesc / appDomain` form some old docs show.

## First-run setup

`bin/ad4m start` handles it on first run:

1. `init` if `last-seen-version` is missing.
2. Start the executor.
3. Wait for `API server starting` in the log.
4. If `$AD4M_DATA_PATH/ad4m/agent.json` doesn't exist → run `agent generate -p <passphrase>` and wait for the file to appear.

The AD4M CLI's `agent generate` and `agent status` commands have a deserialization bug that exits non-zero on success. **Don't trust exit codes from those commands** — `bin/ad4m` detects success by checking for `agent.json`.

## Common error → fix table

| Error | Cause | Fix |
|---|---|---|
| `Object literal may only specify known properties, and 'writable' does not exist in type 'PropertyOptions'` | Stale API; the field is `readOnly` (inverted). | Drop `writable: true`. Properties are writable by default. |
| `SubjectProperty requires an 'initial' option if 'required' is true` | Decorator fires at module import; the model file can't load. | Drop `required: true`, or set a non-empty `initial: 'something'`. Empty string doesn't work. |
| `'@coasys/ad4m-connect' has no default export` | Old import shape. | Use `import { getAd4mClient } from '@coasys/ad4m-connect'`. |
| `main key not found. call createMainKey() first` | Master agent not generated yet. | `pnpm ad4m:restart` (it re-runs `agent generate`). |
| `Invalid credentials` on first multi-user login | Account doesn't exist yet — expected first run. | The client falls through to `createAccount` automatically. |
| `Failed to start dapp server: Address already in use` (in executor log) | Dapp server tried to bind a busy port. | Benign. Ignore — main API on `AD4M_PORT` is unaffected. |
| `Failed to deserialize response for 'agent.X'` from `ad4m agent ...` CLI | AD4M CLI deserializer bug. | Don't trust exit code. Operation likely succeeded — verify via `$AD4M_DATA_PATH/ad4m/agent.json`. |

## What to verify after any change

1. `pnpm check` — TS + lint pass.
2. `pnpm build` — Vite production build succeeds.
3. `pnpm ad4m:restart && pnpm dev` — executor restarts cleanly, app loads in browser.
4. Open browser dev tools, confirm no `[error]` console messages on initial mount, and that the connected status shows.

## Things to avoid

- **Don't** `rm -rf $AD4M_DATA_PATH` without explicit user approval — it destroys all perspectives, agent keys, and settings for this app.
- **Don't** change `@coasys/ad4m` decorator imports based on old documentation. The package is pre-1.0 and moves; verify against `~/workspaces/coasys/ad4m/core/src/model/decorators.ts`.
- **Don't** add a `prepare: husky` script if husky isn't in `devDependencies`. Either install it or drop the script.
- **Don't** invent your own `pnpm ad4m:*` aliases without keeping them in sync with `bin/ad4m` subcommands.
