# Testing Guide

This package contains the integrated test infrastructure for full-stack CRUD features. All tests run against a real in-process PGlite database — no mocks for the DB layer.

## Test Types

| Type   | Location                   | Runner                               | Docs               |
| ------ | -------------------------- | ------------------------------------ | ------------------ |
| Web    | `web/{entity}.test.tsx`    | bun:test + HappyDOM                  | `web/CLAUDE.md`    |
| Mobile | `mobile/{entity}.test.tsx` | Jest + @testing-library/react-native | `mobile/CLAUDE.md` |

## Quick Start

```bash
cd packages/test

# Generate migrations (if schema changed)
bun drizzle-kit generate

# Web
bun test web/{entity}.test.tsx

# Mobile
node mobile/build-orpc.js
NODE_OPTIONS="--experimental-vm-modules" npx jest --config jest.config.js --forceExit mobile/{entity}.test.tsx
```

## Shared Infrastructure

| File                | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `db.ts`             | PGlite instance, `initializeTestDatabase()`. Reads migrations from `drizzle/`. |
| `drizzle.config.ts` | Generates test migrations from `packages/db/src/schema/`.                      |

**Read the platform-specific guide (`web/CLAUDE.md` or `mobile/CLAUDE.md`) before writing any test code.**
