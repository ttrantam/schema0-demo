# Advanced Schema Patterns

Enums, JSONB, soft deletes, indexes, and schema modification workflows.

## Enums (`pgEnum()`)

Define database-level enums for constrained string columns.

```typescript
import { pgTable, pgEnum, text, timestamp } from "drizzle-orm/pg-core";

// Define at module level, BEFORE the table
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  status: orderStatusEnum("status").default("pending").notNull(),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```

**Schema overrides:** drizzle-zod infers enum columns as a union type automatically — no callback override needed for enum columns.

**routerOutputSchema:** `status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"])`

**Migration note:** Enums are database-level types. Adding/removing values requires `drizzle-kit generate` to produce the correct ALTER TYPE SQL. NEVER edit enum values and assume they auto-migrate.

## JSONB with Type Safety

Use `jsonb().$type<T>()` for structured metadata columns.

```typescript
// Define shape as a TypeScript interface
interface OrderMetadata {
  source: string;
  referralCode?: string;
  tags: string[];
}

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  metadata: jsonb("metadata").$type<OrderMetadata>(),
  // ...
});
```

**insertSchema override:**

```typescript
export const insertOrdersSchema = createInsertSchema(orders, {
  metadata: (schema) => schema.optional(),
});
```

**routerOutputSchema — define the shape explicitly:**

```typescript
metadata: z.object({
  source: z.string(),
  referralCode: z.string().optional(),
  tags: z.array(z.string()),
}).nullable().optional(),
```

**NEVER use `z.any()`, `z.unknown()`, or `z.record(z.unknown())` for JSONB columns.** Always define the exact shape.

## Soft Deletes

Use a nullable timestamp to mark records as deleted without removing them.

```typescript
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  deletedAt: timestamp("deleted_at"), // null = not deleted
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```

**insertSchema override:** `deletedAt: (schema) => schema.optional()`

**routerOutputSchema:** `deletedAt: z.date().nullable().optional()`

**Filter in router (exclude soft-deleted rows):**

```typescript
import { isNull } from "drizzle-orm";
return db.select().from(documents).where(isNull(documents.deletedAt));
```

## Indexes

Add indexes for query performance. Use the third argument to `pgTable()`.

```typescript
import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    status: text("status"),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Single column index
    index("orders_user_id_idx").on(table.userId),
    // Composite index (for queries filtering on both columns)
    index("orders_status_created_idx").on(table.status, table.createdAt),
    // Unique constraint
    uniqueIndex("orders_email_idx").on(table.email),
  ],
);
```

**Alternatives for unique constraints:** `.unique()` on the column definition (`email: text("email").unique()`) or `uniqueIndex()` in the third argument — both produce correct migrations.

**Rules:**

- NEVER write index SQL by hand — edit schema, run `drizzle-kit generate`, review, migrate
- Index names should follow the pattern `{table}_{column(s)}_idx`

## Schema Modifications

The ONLY valid workflow for modifying existing schemas:

1. **Edit** the table definition in `packages/db/src/schema/{entity}.ts`
2. **Generate** migration: `cd packages/db && bun drizzle-kit generate`
3. **Review** the generated SQL in `src/migrations/` to confirm correctness
4. **Migrate**: `cd packages/db && bun drizzle-kit migrate`

### Common modifications

**Add a column:** Add it to `pgTable()`, update all 7 derived schemas, generate + migrate.

**Remove a column:** Delete from `pgTable()`, remove from all schemas, generate + migrate.

**Rename a column:** Change the SQL name string (e.g., `text("old_name")` → `text("new_name")`) while keeping the JS key the same. Drizzle-kit detects this as a rename. Generate + migrate.

**Change column type:** Change the column builder (e.g., `text("col")` → `integer("col")`). Generate + review the ALTER TABLE carefully, then migrate.

### Prohibitions

- **NEVER** hand-write migration SQL files
- **NEVER** manually create `.sql`, snapshot, or journal files in `src/migrations/`
- **NEVER** edit existing migration files after they have been applied
- **NEVER** use `drizzle-kit push` in production — always `generate` + `migrate`
