# db Package

Database layer with Drizzle ORM, PostgreSQL schema definitions, and authenticated database connections.

**Package:** `@template/db`

```
packages/db/src/
├── index.ts          # Database client (createDb) and exports
├── schema/
│   ├── index.ts      # Barrel re-exports (export * from "./{entity}")
│   └── [entity].ts   # Table + all derived schemas (insert, select, update, form)
└── migrations/       # Auto-generated — never hand-write
```

## Database Client

**Always use `createDb()` to create a fresh instance per request.** Cloudflare Workers isolate requests — a singleton `db` causes "Cannot perform I/O on behalf of a different request" errors.

```typescript
import { createDb } from "@template/db";

// ✅ Fresh instance inside handler
const db = createDb();
return await db.select().from(users);

// ❌ Module-level singleton — breaks in Workers
const db = createDb(); // at top of file
```

## Schema Definition (Single Source of Truth)

ALL schemas — table, insert, select, update, form, editForm — are defined in `packages/db/src/schema/{entity}.ts` using drizzle-zod. Routers, collections, and forms import from `@template/db/schema`. Never define `z.object()` schemas manually elsewhere.

See root `GEMINI.md` for the plural naming convention table.

### Definitive Schema Example

This is the ONE canonical pattern. All entities follow this structure:

```typescript
// packages/db/src/schema/entities.ts
import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// 1. TABLE DEFINITION
export const entities = pgTable("entities", {
  id: text("id").primaryKey(), // ALWAYS text — enables optimistic updates
  name: text("name").notNull(),
  description: text("description"), // Nullable column (string | null in DB)
  email: text("email").notNull(),
  active: boolean("active").default(true),
  userId: text("user_id"), // For RLS support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. INSERT SCHEMA — use CALLBACK overrides for nullable columns and validation
// ⚠️ ALWAYS use callbacks (schema) => ... — NEVER direct z.string().optional()
// drizzle-zod uses zod/v4 internally; direct Zod schemas from "zod" (v3-compat) fail typecheck
export const insertEntitiesSchema = createInsertSchema(entities, {
  name: (schema) => schema.min(1).max(200),
  email: (schema) => schema.email(),
  description: (schema) => schema.optional(), // nullable → optional (string | null → string | undefined)
});

// 3. SELECT SCHEMA — override nullable columns here too
export const selectEntitiesSchema = createSelectSchema(entities, {
  description: (schema) => schema.optional(),
});

// 4. UPDATE SCHEMA
export const updateEntitiesSchema = selectEntitiesSchema
  .partial()
  .required({ id: true });

// 5. FORM SCHEMA — for react-hook-form create mode (omits system fields)
// ⚠️ userId is NOT omitted — it passes validation as optional (nullable column).
// The route handler adds userId from loaderData AFTER form submission, before collection.insert().
export const entitiesFormSchema = insertEntitiesSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 6. EDIT FORM SCHEMA — for edit mode (all optional, exclude immutable fields)
// ⚠️ MUST NOT include `id` — the Dialog adds the id after form submission.
// Including `id` causes silent form validation failure: the form has no id input,
// so zodResolver rejects the data and onSubmit never fires. No error is shown.
export const entitiesEditFormSchema = entitiesFormSchema
  .omit({ email: true }) // Exclude immutable fields from edit
  .partial();

// 7. ROUTER OUTPUT SCHEMA — for .output() on selectAll/selectById
// ⚠️ This is SEPARATE from selectSchema. Think about what the DATABASE returns:
//   - timestamp("created_at") → JavaScript Date object (NOT string)
//   - text("description") nullable → string | null
//   - text("name").notNull() → string
// If you use z.string() for a timestamp column, .output() fails with "Output validation failed"
// and the collection's queryFn throws, leaving the table empty with no visible error.
export const entitiesRouterOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  email: z.string(),
  active: z.boolean().nullable().optional(),
  userId: z.string().nullable().optional(),
  createdAt: z.date(), // ⚠️ Date, NOT z.string()
  updatedAt: z.date(), // ⚠️ Date, NOT z.string()
});
```

### Key Rules

0. **NEVER use `any` type or typecheck suppression comments** — `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, `// eslint-disable` are all FORBIDDEN. The purpose of typecheck is to find and **fix** type errors, not suppress them. Use proper types, generics, or `unknown` with type narrowing.

1. **Callback overrides for nullable columns:** For every column without `.notNull()`, add: `colName: (schema) => schema.optional()`. This converts `string | null` → `string | undefined` for React Hook Form compatibility.

2. **NEVER use `.transform()` for null→undefined:** `.transform()` creates `ZodEffects` which breaks `.omit()` and `.partial()` chaining. The callback override eliminates the need.

3. **NEVER use `z.unknown()` or `z.any()`:** If you get "Invalid element at key" errors, add a callback override for that column — don't bypass validation.

4. **NEVER use `serial()` or `bigint` for primary keys:** Only `text("id").primaryKey()` supports client-generated IDs for optimistic updates.

5. **Schema Pair Consistency:** Form schema and its corresponding create/update schema must have the SAME `.omit()` exclusions. The only difference is the create/update schema includes the `id` field.

6. **Form schemas belong in the entity file, not in `index.ts`.** The barrel file only contains `export * from "./{entity}"`.

7. **Router output schema MUST mirror table nullability:** For every column WITHOUT `.notNull()`, the output schema MUST use `.nullable().optional()`. Omitting `.nullable()` causes "Output validation failed" — the table stays empty with no visible error. This is the #1 silent failure cause.

### Schema Naming Conventions

All names use PLURAL form:

| Schema                         | Derivation                                      | Purpose                               |
| ------------------------------ | ----------------------------------------------- | ------------------------------------- |
| `{entities}FormSchema`         | `insertSchema.omit({id, createdAt, updatedAt})` | Create form validation                |
| `{entities}EditFormSchema`     | `formSchema.partial()` — **NO `id`**            | Edit form validation (Dialog adds id) |
| `insert{Entities}Schema`       | `createInsertSchema(table, overrides)`          | Bulk insert validation                |
| `select{Entities}Schema`       | `createSelectSchema(table, overrides)`          | Query/collection validation           |
| `update{Entities}Schema`       | `selectSchema.partial().required({id})`         | Bulk update validation                |
| `{entities}RouterOutputSchema` | `z.object({...})` with DB return types          | Router `.output()` validation         |

### Exporting Schema

`packages/db/src/schema/index.ts`:

```typescript
export * from "./users";
export * from "./entities";
```

## Transform Utilities

Form-to-Database pipeline utilities:

```typescript
import {
  nullToUndefined,
  prepareFormForQueryCollection,
} from "@template/db/schema";

// Convert null to undefined
const queryData = nullToUndefined(formData);

// Complete pipeline: validate → transform → add system fields
const queryData = prepareFormForQueryCollection(formData, entityFormSchema, {
  id: generateId(),
  userId: currentUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## Column Types Reference

```typescript
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, decimal, real } from "drizzle-orm/pg-core";

id: text("id").primaryKey(),
name: text("name").notNull(),
email: varchar("email", { length: 255 }).unique(),
age: integer("age"),
price: decimal("price", { precision: 10, scale: 2 }),
active: boolean("active").default(true),
metadata: jsonb("metadata").$type<{ key: string }>(),
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at").defaultNow().notNull(),
```

## Row-Level Security

Use the `rls-setup` skill for complete RLS guidance.
