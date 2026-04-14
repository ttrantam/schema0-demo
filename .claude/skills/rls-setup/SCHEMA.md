# RLS Schema Patterns

## RLS Imports

```typescript
// packages/db/src/schema/[table].ts
import { pgTable, text, timestamp, bigint, boolean } from "drizzle-orm/pg-core";
import { crudPolicy, authUid } from "drizzle-orm/neon";
import { authenticatedUserRole } from "./index";
```

**Key imports:**

- `crudPolicy` - Helper to define RLS policies
- `authUid` - Helper to check if current user matches userId column
- `authenticatedUserRole` - Role for authenticated users (defined in `packages/db/src/schema/index.ts`)

## Authenticated User Role

Define once in `packages/db/src/schema/index.ts`:

```typescript
import { pgRole } from "drizzle-orm/pg-core";

export const authenticatedUserRole = pgRole("authenticated_user").existing();
```

Import in all RLS schema files:

```typescript
import { authenticatedUserRole } from "./index";
```

## Common Policy Patterns

### User-Scoped Data (Most Common)

```typescript
crudPolicy({
  role: authenticatedUserRole,
  read: authUid(table.userId),
  modify: authUid(table.userId),
});
```

User can only read and modify their own data.

### Public Read, User Write

```typescript
crudPolicy({
  role: authenticatedUserRole,
  read: sql`true`,
  modify: authUid(table.userId),
});
```

All authenticated users can read, only owner can modify.

### Admin-Only Access

```typescript
crudPolicy({
  role: authenticatedUserRole,
  read: sql`false`,
  modify: sql`false`,
});
```

No regular users can access (admin only via different role).

## Complete Table Example

```typescript
// packages/db/src/schema/posts.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { crudPolicy, authUid } from "drizzle-orm/neon";
import { authenticatedUserRole } from "./index";

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(), // Use text IDs with generateId() on client
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedUserRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ],
);
```

**Important:**

- `userId` column is required for user-scoped RLS
- Set `userId` manually when inserting records: `{ ...data, userId: context.session.user.id }`
- RLS policies filter/restrict based on `userId`

## Schema Export

Export all schemas in `packages/db/src/schema/index.ts`:

```typescript
import { pgRole } from "drizzle-orm/pg-core";

// Export authenticated user role
export const authenticatedUserRole = pgRole("authenticated_user").existing();

// Export all tables
export * from "./posts";
export * from "./comments";
export * from "./tasks";
export * from "./todo"; // Example
```

## Adding Relations

```typescript
// packages/db/src/schema/posts.ts (add after table definition)
import { relations } from "drizzle-orm";
import { users } from "./users";
import { comments } from "./comments";

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));
```

```typescript
// packages/db/src/schema/comments.ts
import { relations } from "drizzle-orm";
import { posts } from "./posts";
import { users } from "./users";

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
```

## Migration Workflow

### 1. Define/Update Schema

```bash
# Edit packages/db/src/schema/[table].ts
# Add or modify table definition
```

### 2. Generate Migration

```bash
bun run db:generate
```

This creates a migration file in `packages/db/src/migrations/`.

### 3. Review Migration

Check the generated SQL in `packages/db/src/migrations/[timestamp]_[name].sql` to ensure correctness.

### 4. Apply Migration

```bash
bun run db:migrate
```

This applies the migration to the database.

## Column Types Reference

```typescript
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const example = pgTable("example", {
  // ID - always use text with generateId() for client-generated IDs
  id: text("id").primaryKey(),

  // Text
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).unique(),

  // Numbers
  count: integer("count").default(0),
  amount: bigint("amount", { mode: "number" }),

  // Boolean
  isActive: boolean("is_active").default(true).notNull(),

  // JSON
  metadata: jsonb("metadata").$type<{ key: string }>(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // User ID for RLS
  userId: text("user_id").notNull(),
});
```

## Multiple Policies Example

```typescript
export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(), // Use text IDs with generateId() on client
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Policy 1: Users can read their own posts (published or not)
    crudPolicy({
      role: authenticatedUserRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
    // Policy 2: Users can also read published posts from others
    // Note: Drizzle RLS typically uses single policy, this is conceptual
    // In practice, combine logic: authUid(table.userId) OR (table.isPublished = true)
  ],
);
```

Environment variables are loaded in `packages/auth/src/env.ts` using `@t3-oss/env-core`.

## Troubleshooting

### Problem: RLS policies not applied

```bash
# Ensure migrations are applied
bun run db:migrate

# Check database for RLS policies
# Connect to DB and run:
# SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Problem: Cannot insert records

```typescript
// Ensure userId is set when creating
const userId = context.session.user.id;
await tx.insert(posts).values({
  title: "Post",
  content: "Content",
  userId, // MUST include userId
});
```

### Problem: Empty results from queries

```typescript
// Ensure using createRLSTransaction
const RLSTransaction = await createRLSTransaction(context.request);
const posts = await RLSTransaction(async (tx) => {
  return await tx.select().from(posts); // RLS filters by user
});
```
