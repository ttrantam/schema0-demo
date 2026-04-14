---
name: rls-setup
description: Set up database tables with Row-Level Security policies, configure authenticated connections, and implement secure user-scoped data access patterns (Do not apply this skill unless specifically asked by user) (project)
allowed-tools: "Read,Write,Edit,Glob,Grep,Bash"
---

# Row-Level Security (RLS) Setup

## When to Use This Skill

Use this skill when you need to:

- Set up database tables with Row-Level Security policies
- Configure authenticated database connections
- Implement user-scoped data access
- Add new tables with RLS policies
- Secure database operations with user-based access control

## Quick Start: Generate RLS Router

**⚠️ ALWAYS start with scaffolding before writing code:**

```bash
bun run scaffold-scripts/generate.ts rls-service <name>
```

Example:

```bash
bun run scaffold-scripts/generate.ts rls-service products
```

| Output File | Location | Template | Responsibility |
|-------------|----------|----------|----------------|
| RLS Router | `packages/api/src/routers/[name].ts` | `scaffold-templates/rls-service.hbs` | Generates ORPC router with `protectedProcedure`, `createRLSTransaction` for authenticated database access, and CRUD operations with RLS enforcement |

**What the template generates:**

- `getAll` - Fetches all items (RLS automatically filters by user)
- `getById` - Fetches single item by ID (RLS ensures user owns it)
- `create` - Creates new item with automatic `userId` assignment
- `update` - Updates item (RLS ensures user owns it)
- `delete` - Deletes item (RLS ensures user owns it)
- All procedures use `protectedProcedure` for authentication
- `createRLSTransaction` for secure database access
- TODO comments for schema field customization

## Database Schema with RLS

Location: `packages/db/src/schema/<table>.ts`

```typescript
import { pgTable, text, timestamp, bigint, boolean } from "drizzle-orm/pg-core";
import { crudPolicy, authUid } from "drizzle-orm/neon";
import { authenticatedUserRole } from "./index";

// Example table with RLS
export const tasks = pgTable(
  "tasks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedUserRole,
      read: authUid(table.userId), // Users can only read their own tasks
      modify: authUid(table.userId), // Users can only modify their own tasks
    }),
  ],
);
```

**Key Points:**

- `authenticatedUserRole` is defined and exported in `packages/db/src/schema/index.ts`
- `authUid()` and `crudPolicy()` are imported from `drizzle-orm/neon`
- RLS policies are enforced at the database level
- `userId` column must be set when inserting records

## Post-Generation Steps

### 1. Export schema in `packages/db/src/schema/index.ts`:

```typescript
export * from "./tasks";
```

### 2. Register router in `packages/api/src/routers/index.ts`:

```typescript
import { tasksRouter } from "./tasks";

export const appRouter = {
  // ... other routers
  tasks: tasksRouter,
};
```

### 3. Complete TODOs in generated router:

- Add your schema fields to the Zod input schemas
- Replace TODO comments with actual table operations

### 4. Create frontend route:

Use React Query for data fetching with proper optimistic updates (see `route.hbs` template for reference).

## Best Practices

1. **Always use `protectedProcedure`** - RLS requires authenticated requests
2. **Set `userId` from context** - Never trust user-provided userId
3. **Use `createRLSTransaction`** - Ensures RLS policies are enforced
4. **Test with multiple users** - Verify data isolation works correctly
5. **Handle "not found" gracefully** - RLS may return empty results

## ⚠️ Type Safety — Zero Tolerance

- **NEVER use `any` type** in generated code — use proper types, generics, or `unknown` with type narrowing
- **NEVER suppress typecheck errors** with `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, or `// eslint-disable` — fix the type error instead

For detailed schema patterns, see [SCHEMA.md](SCHEMA.md).
For service examples, see [EXAMPLES.md](EXAMPLES.md).
For common mistakes to avoid, see [REFERENCE.md](REFERENCE.md).
