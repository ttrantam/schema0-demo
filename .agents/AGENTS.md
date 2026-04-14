# AGENTS.md

Project-wide rules and architecture. Implementation details live in skills — read the relevant skill before writing code.

## Global Rules

1. **Use PLURAL entity names everywhere** — `themes`, `customers`, `activities` (not singular)
2. **Use `import { z } from "zod/v4"`** — NEVER `import z from "zod"` (v3-compat breaks drizzle-zod at runtime)
3. **No `any` types, no typecheck suppression** — NEVER use `any`, `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, or `// eslint-disable`. Fix the type error instead.
4. **No dev servers** — Agent hooks handle builds automatically
5. **Never hand-write migration files** — `packages/db/drizzle/` is managed by `drizzle-kit generate` and `drizzle-kit migrate`
6. **Zero TODO comments** — Run `grep -rn "TODO" packages/ apps/web/src/ --include="*.ts" --include="*.tsx"` and verify no matches
7. **Use createDb() per request** — never use singleton db instances
8. **Testing is mandatory** — every feature MUST have tests. A feature is NOT complete without a passing test file. NEVER gut tests to make them pass — fix the source code instead.
9. **Sandbox environment** — Authentication is handled automatically. `login`, `logout`, `init`, `setup` commands are NOT available. Read `.agents/skills/schema0-cli/SKILL.md` before running any `schema0` command.

## Architecture

```
packages/db/      — Database schemas (Drizzle ORM)        → see packages/db/AGENTS.md
packages/api/     — ORPC API routers                      → see packages/api/AGENTS.md
packages/auth/    — Server-side auth (uses @schema0/auth-web)
packages/test/    — Integrated tests (PGlite + UI)        → see packages/test/AGENTS.md
packages/config/  — Shared config
apps/web/         — React Router v7 + TanStack DB         → web platform (if exists)
apps/native/      — React Native / Expo                   → mobile platform (if exists)
```

### Platform Detection

Before executing platform-specific tasks, check which platforms are installed:

- **Web**: `apps/web/` exists
- **Mobile**: `apps/native/` exists
- **Template-only**: neither exists (only `packages/`)

### Catalog Dependencies

The root `package.json` defines a `catalog` with shared dependency versions. Use `catalog:` in app `package.json` files. All packages in `packages/` are workspace dependencies (`"@template/db": "workspace:*"`).

## Feature Implementation Order

For every new feature, follow this order. Each step references the skill that contains the implementation details.

### Step 1: Database schema

Read and follow the **create-db-schema** skill → creates `packages/db/src/schema/{entity}.ts`

### Step 2: API router

Read and follow the **api-router** skill → creates `packages/api/src/routers/{entity}.ts`
Register the router in `packages/api/src/routers/index.ts`.

### Step 3: Frontend (web only — skip if `apps/web/` does not exist)

Read and follow these skills:

- **query-collections** → Collection, Dialog, Form
- **customize-table** → DataTable columns
- **handle-views** → List Route and Detail Route

Add the route to the sidebar in `apps/web/src/components/app-sidebar.tsx`.

### Step 4: Typecheck

```bash
bunx oxlint --type-check --type-aware --quiet <your-files>
```

Pass only files you created or modified. Ignore `./+types/` import errors (generated at runtime by React Router).

### Step 5: Test

Read `packages/test/AGENTS.md` in full before writing any test code.

```bash
cd packages/test && bun drizzle-kit generate
```

**Web** (skip if `apps/web/` does not exist):

Create `packages/test/web/{entity}.test.tsx` with create, update, and delete tests. Run:

```bash
cd packages/test && bun test web/{entity}.test.tsx
```

**Mobile** (skip if `apps/native/` does not exist):

Create `packages/test/mobile/{entity}.test.tsx` with create, update, and delete tests. Run:

```bash
cd packages/test && node mobile/build-orpc.js
cd packages/test && NODE_OPTIONS="--experimental-vm-modules" npx jest --config jest.config.js --forceExit mobile/{entity}.test.tsx
```

All tests must pass. Do not proceed to deployment until they do.

### Step 6: Deploy

```bash
bun run build
schema0 doctor
schema0 deploy
```

## File Checklist

For each entity (web):

| #   | File          | Location                                                                   |
| --- | ------------- | -------------------------------------------------------------------------- |
| 1   | Schema        | `packages/db/src/schema/{entity}.ts`                                       |
| 2   | Router        | `packages/api/src/routers/{entity}.ts`                                     |
| 3   | Collection    | `apps/web/src/query-collections/custom/{entity}.ts`                        |
| 4   | Dialog        | `apps/web/src/components/ui/data-table/custom/{entity}/{Entity}Dialog.tsx` |
| 5   | Form          | `apps/web/src/components/ui/data-table/custom/{entity}/{Entity}Form.tsx`   |
| 6   | Columns       | `apps/web/src/components/ui/data-table/custom/{entity}/{Entity}Column.tsx` |
| 7   | Index         | `apps/web/src/components/ui/data-table/custom/{entity}/index.ts`           |
| 8   | List Route    | `apps/web/src/routes/_auth.{entity}.tsx`                                   |
| 9   | Detail Route  | `apps/web/src/routes/_auth.{entity}_.$id.tsx`                              |
| 10  | Test (web)    | `packages/test/web/{entity}.test.tsx`                                      |
| 11  | Test (mobile) | `packages/test/mobile/{entity}.test.tsx`                                   |

Without web: only files 1–2.

## Mobile Platform

React Native / Expo app at `apps/native/`.

**Worker architecture** (`apps/native/worker.ts`): Single Cloudflare Worker handles both static assets and API. API routes mounted at `/rpc` via Hono + `RPCHandler` (same routers from `packages/api/`). Static assets served by `expo-adapter-workers`. Do NOT delete `worker.ts` or `build-worker.ts`.

**Key differences from web:**

- Calls deployed mobile worker (`EXPO_PUBLIC_WEB_URL/rpc`)
- Session cookies from `expo-secure-store` attached to every ORPC request
- Uses `@tanstack/react-query` directly (NOT TanStack DB)
- Data fetching: `useQuery(orpc.{entity}.selectAll.queryOptions())`
- Auth via `@schema0/auth-mobile` + WorkOS (cookie-based sealed sessions)
- Environment variables use `EXPO_PUBLIC_*` prefix
- During dev (`schema0 dev`), API calls go to the deployed backend (deploy first, then dev)

**Required env vars for mobile** (validated in `_layout.tsx`): `EXPO_PUBLIC_WORKOS_CLIENT_ID`, `EXPO_PUBLIC_ORGANIZATION_ID`, `EXPO_PUBLIC_WEB_URL`, `EXPO_PUBLIC_API_HOSTNAME`, `EXPO_PUBLIC_APP_ID`

**Adding a platform:** `schema0 add web` or `schema0 add mobile`

## Environment Variables

Access: `import { env } from "@template/auth"`

| Variable       | Description                |
| -------------- | -------------------------- |
| `YB_URL`       | App URL                    |
| `DATABASE_URL` | Database connection string |

## Troubleshooting

- **Missing `./+types/`**: Wait for agent hooks (do not run `bun run typecheck`)
- **Sync errors**: Verify `id` field is present in schemas and query keys
- **Env errors**: Check `app/env.ts`
