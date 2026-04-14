# RLS Reference and Common Mistakes

## Database Access Pattern

**ALL RLS database operations MUST use `createRLSTransaction`:**

```typescript
import { createRLSTransaction } from "@template/db";
import { protectedProcedure } from "../index";

export const usersRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    const RLSTransaction = await createRLSTransaction(context.request);
    return await RLSTransaction(async (tx) => {
      return await tx.select().from(users);
    });
  }),
};
```

## How It Works

1. `createRLSTransaction(request)` takes the request object from ORPC context
2. Internally uses `env.YB_API_HOSTNAME`, `env.YB_ORGANIZATION_ID`
3. Fetches JWT claims from `https://${env.YB_API_HOSTNAME}/api/user_management/claims`
4. Validates claims against `env.YB_ORGANIZATION_ID` for authorization
5. Returns a function that wraps queries in a transaction with RLS context
6. `RLSTransaction(async (tx) => { ... })` sets JWT claims via `set_config('request.jwt.claims', ...)`
7. Database enforces RLS policies based on authenticated user's claims

## Common Mistakes to Avoid

### ❌ NEVER: Direct Database Connections

```typescript
// WRONG - Bypasses RLS
import { createDb } from "@template/db";

export const usersRouter = {
  getAll: publicProcedure.handler(async () => {
    const db = createDb();
    return await db.select().from(users); // RLS not enforced!
  }),
};
```

### ❌ NEVER: Use Regular `createDb()` for RLS Tables

```typescript
// WRONG - Use createRLSTransaction for tables with RLS policies
export const tasksRouter = {
  getAll: protectedProcedure.handler(async () => {
    const db = createDb();
    return await db.select().from(tasks); // Won't filter by user!
  }),
};
```

### ❌ NEVER: Database Operations in Route Loaders

```typescript
// WRONG - All database operations belong in ORPC procedures
import { createRLSTransaction } from "@template/db";

export async function loader({ request, context }: Route.LoaderArgs) {
  const RLSTransaction = await createRLSTransaction(request);
  return await RLSTransaction(async (tx) => {
    return await tx.select().from(users); // Put in ORPC router!
  });
}
```

### ❌ NEVER: Mix RLS and Non-RLS Incorrectly

```typescript
// WRONG - Table has RLS but not using createRLSTransaction
export const postsRouter = {
  getAll: protectedProcedure.handler(async () => {
    return await db.select().from(posts); // posts has RLS!
  }),
};

// CORRECT
export const postsRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    const RLSTransaction = await createRLSTransaction(context.request);
    return await RLSTransaction(async (tx) => {
      return await tx.select().from(posts);
    });
  }),
};
```

### ✅ ALWAYS: Use ORPC Procedures

```typescript
// CORRECT
export const usersRouter = {
  getAll: protectedProcedure.handler(async ({ context }) => {
    const RLSTransaction = await createRLSTransaction(context.request);
    return await RLSTransaction(async (tx) => {
      return await tx.select().from(users);
    });
  }),
};
```

### ✅ ALWAYS: Use Regular `db` for Non-RLS Tables

```typescript
// CORRECT - publicData table has NO RLS policies
export const publicDataRouter = {
  getAll: publicProcedure.handler(async () => {
    return await db.select().from(publicData); // No RLS needed
  }),
};
```

### ✅ ALWAYS: Set userId When Creating Records

```typescript
// CORRECT - Always set userId for RLS tables
export const tasksRouter = {
  create: protectedProcedure
    .input(z.object({ title: z.string() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      const userId = context.session.user.id; // Get from session

      return await RLSTransaction(async (tx) => {
        return await tx
          .insert(tasks)
          .values({
            ...input,
            userId, // MUST set userId
          })
          .returning();
      });
    }),
};
```

## Router File Structure

```typescript
// packages/api/src/routers/[domain].ts
import { protectedProcedure } from "../index";
import { createRLSTransaction } from "@template/db";
import { items } from "@template/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

export const itemsRouter = {
  // GET ALL
  getAll: protectedProcedure.handler(async ({ context }) => {
    const RLSTransaction = await createRLSTransaction(context.request);
    return await RLSTransaction(async (tx) => {
      return await tx.select().from(items);
    });
  }),

  // GET BY ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      return await RLSTransaction(async (tx) => {
        const result = await tx
          .select()
          .from(items)
          .where(eq(items.id, input.id));
        return result[0] || null;
      });
    }),

  // CREATE
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      const userId = context.session.user.id;

      return await RLSTransaction(async (tx) => {
        return await tx
          .insert(items)
          .values({
            ...input,
            userId,
          })
          .returning();
      });
    }),

  // UPDATE
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);
      const { id, ...data } = input;

      return await RLSTransaction(async (tx) => {
        return await tx
          .update(items)
          .set(data)
          .where(eq(items.id, id))
          .returning();
      });
    }),

  // DELETE
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const RLSTransaction = await createRLSTransaction(context.request);

      return await RLSTransaction(async (tx) => {
        return await tx.delete(items).where(eq(items.id, input.id)).returning();
      });
    }),
};
```

## When to Use RLS vs Regular db

### Use `createRLSTransaction` for:

- User-scoped data (posts, tasks, comments)
- Data that should be filtered by ownership
- Tables with `crudPolicy` in schema
- Any table with a `userId` column

### Use regular `db` for:

- Public/shared data (categories, tags, settings)
- Admin-only tables without user filtering
- Tables without RLS policies
- Lookup tables and reference data

## Deployment Checklist

1. ✅ Database schema has RLS policies with `crudPolicy()`
2. ✅ Schema exported in `packages/db/src/schema/index.ts`
3. ✅ Migrations generated and applied: `bun run db:generate && bun run db:migrate`
4. ✅ Router created in `packages/api/src/routers/`
5. ✅ Router registered in `packages/api/src/routers/index.ts`
6. ✅ All RLS procedures use `createRLSTransaction`
7. ✅ All creates set `userId` from `context.session.user.id`
8. ✅ Environment variables set:
   - `DATABASE_URL`
   - `YB_API_HOSTNAME`
   - `YB_ORGANIZATION_ID`

## Debugging RLS Issues

### Problem: RLS returns empty results

```typescript
// Check if RLS policy is correctly defined
// packages/db/src/schema/tasks.ts
export const tasks = pgTable(
  "tasks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: text("user_id").notNull(), // Must have userId column
    // ...
  },
  (table) => [
    crudPolicy({
      role: authenticatedUserRole,
      read: authUid(table.userId), // Check this matches column name
      modify: authUid(table.userId),
    }),
  ],
);
```

### Problem: Can see other users' data

```typescript
// Check that createRLSTransaction is used
// WRONG
const items = await db.select().from(tasks); // No RLS!

// CORRECT
const RLSTransaction = await createRLSTransaction(context.request);
const items = await RLSTransaction(async (tx) => {
  return await tx.select().from(tasks);
});
```

### Problem: Cannot create records

```typescript
// Check that userId is set when creating
// WRONG
await tx.insert(tasks).values({ title: "Task" }); // Missing userId!

// CORRECT
const userId = context.session.user.id;
await tx.insert(tasks).values({ title: "Task", userId });
```
