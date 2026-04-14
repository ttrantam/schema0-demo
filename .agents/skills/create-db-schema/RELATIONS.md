# Schema Relations Reference

Patterns for foreign keys, type-safe relations, and junction tables.

## Foreign Keys (`.references()`)

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  // FK to parent table — MUST be text() to match text PK
  customerId: text("customer_id")
    .references(() => customers.id)
    .notNull(),
  // Nullable FK (optional relationship)
  assigneeId: text("assignee_id").references(() => users.id),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```

**Rules:**

- FK column type MUST be `text()` — never `integer` (parent PKs are always `text`)
- Nullable FK (no `.notNull()`) → add callback override in insert/select schemas: `assigneeId: (schema) => schema.optional()`
- routerOutputSchema for nullable FK: `assigneeId: z.string().nullable().optional()`
- routerOutputSchema for notNull FK: `customerId: z.string()`

## Type-safe Relations (`relations()`)

Use `relations()` to enable Drizzle's relational query API (`db.query.orders.findMany({ with: { ... } })`).

```typescript
import { relations } from "drizzle-orm";

// One-to-many: customer has many orders
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

// Many-to-one: order belongs to one customer
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  lineItems: many(lineItems),
}));

// One-to-one: user has one profile
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
}));
```

**When to use:** For `db.query.{table}.findMany({ with: { relation: true } })` relational queries. Standard CRUD routers typically use `db.select().from()` with explicit joins instead.

## Many-to-Many Junction Tables

Junction tables connect two entities. They MUST follow the same conventions as regular entities.

```typescript
export const tagsOnPosts = pgTable("tags_on_posts", {
  id: text("id").primaryKey(), // ⚠️ text PK, NOT composite PK
  postId: text("post_id")
    .references(() => posts.id)
    .notNull(),
  tagId: text("tag_id")
    .references(() => tags.id)
    .notNull(),
  userId: text("user_id"), // RLS support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```

**Why `text("id").primaryKey()` instead of composite PK?**
TanStack DB collections require `getKey: (item) => item.id` — every collection item must have a single string `id` field. Composite PKs break this contract.

Junction tables need their own full set of 7 derived schemas (insert, select, update, form, editForm, routerOutput) just like any other entity.

## Relations in routerOutputSchema

When a router returns joined/nested data:

```typescript
import { z } from "zod/v4";

export const ordersWithCustomerRouterOutputSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

Nested relations are always `.nullable().optional()` — the join may not return a match.
