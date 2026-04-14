---
name: frontend-development
description: Web frontend development guide — React Router v7, TanStack DB, real-time sync, and optimistic updates (web only)
allowed-tools: "Read,Write,Edit,Glob,Grep"
---

# Frontend Development Guide

React Router v7 frontend with TanStack DB, real-time sync, and optimistic updates.

## Architecture

```
apps/web/src/
├── routes/                  # Route modules (_auth.[entity].tsx)
├── query-collections/       # ALL TanStack DB collections
│   ├── built-in/           # ONLY users + files (fetchCustomResources)
│   └── custom/             # ALL new entities (ORPC + createDb)
├── components/ui/           # shadcn/ui + entity data-table components
└── utils/                   # ORPC client
```

**NEVER place a new entity collection in `built-in/`.** Those use `fetchCustomResources` which fails in tests. New entities go in `custom/` using `client.entity.selectAll()`.

## Critical Rules

### 1. TanStack DB for CRUD (NOT React Query)

Use TanStack DB collections with bulk operations (`insertMany`, `updateMany`, `deleteMany`). See the **`query-collections` skill** for the complete collection template.

```typescript
// ❌ FORBIDDEN
const employees = useQuery(orpc.employees.selectAll.queryOptions());

// ✅ REQUIRED - TanStack DB
import { useLiveQuery } from "@tanstack/react-db"; // ⚠️ NOT from "@tanstack/react-query"

const { data: rawData } = useLiveQuery((q) =>
  q
    .from({ employees: employeesCollection })
    .orderBy(({ employees }: any) => employees.createdAt, "desc"),
);
const data = rawData ?? [];
employeesCollection.insert([{ id: generateId(), ...data }]);
```

### 1a. `useLiveQuery` from `@tanstack/react-db` (NOT `@tanstack/react-query`)

```typescript
// ✅ CORRECT
import { useLiveQuery } from "@tanstack/react-db";

// ❌ WRONG — useLiveQuery does not exist in react-query
import { useLiveQuery } from "@tanstack/react-query";
```

### 2. Collection Schema Validation Is a Silent Failure Gate

`createCollection({ schema })` validates every object passed to `collection.insert([...])` BEFORE calling `onInsert`. If validation fails, `onInsert` is never called and the user sees no error.

**⚠️ Collection `schema` uses an inline `z.object()` — NOT `selectEntitySchema` from drizzle-zod.**
`createSelectSchema()` produces types that `createCollection({ schema })` cannot accept. Define a `const EntityItemSchema = z.object({...})` in the collection file matching the DB return types.

The inserted object must include ALL required fields: `id`, `createdAt`, `updatedAt`, `userId`, plus all non-nullable columns.

```typescript
// ✅ CORRECT — add system fields before collection.insert
await entityCollection.insert([
  {
    id: crypto.randomUUID(),
    ...formData,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
```

**Diagnosis:** `spyOn((entityCollection as any)._mutations, "validateData")` then assert `.mock.results[0]?.value?.issues` is `undefined`.

### 3. Entity Dialogs — react-hook-form with drizzle-zod schemas

Import form schemas from `@template/db/schema`. NEVER define `z.object()` schemas inline in components. See `packages/db/CLAUDE.md` for the schema definition pattern.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entityFormSchema, entityEditFormSchema } from "@template/db/schema";

// ⚠️ Use editFormSchema for edit mode — it has NO `id` field.
// The Dialog adds the id after form submission. Including id causes SILENT failure:
// no id input rendered → zodResolver rejects → onSubmit never fires, no error shown.
const form = useForm({
  resolver: zodResolver(mode === "create" ? entityFormSchema : entityEditFormSchema),
  defaultValues: { ... },
});

// ⚠️ MANDATORY: always pass onInvalid callback to surface silent zodResolver rejections.
// Without it, validation failures are completely silent — onSubmit never fires, no error shown.
<form onSubmit={form.handleSubmit(onValid, (errors) => console.error("Form validation errors:", errors))}>
```

Wrap forms in `<div className="max-h-[80vh] overflow-y-auto px-1">` for long dialogs.

### 4. Entity Types

```typescript
import { selectEmployeeSchema } from "@template/db/schema";
type Employee = z.infer<typeof selectEmployeeSchema>;
```

### 5. DataTable Architecture

- Parent owns `rowSelection` state; derive `selectedItems` (no useEffect)
- Static columns with `ActionsContext` for handlers
- **Set `autoResetPageIndex={false}`** to prevent infinite loops

### 6. NEVER use fetch() for API calls

```typescript
import { client } from "@/utils/orpc";
await client.entity.action(data);
```

### 7. Relationship Fields — Use Select (NOT Manual ID Input)

For foreign key fields, use `<Select>` with live data from related collections:

```typescript
const { data: users } = useLiveQuery((q) => q.from({ users: usersCollection }));

<Select onValueChange={field.onChange} defaultValue={field.value}>
  <SelectContent>
    {users?.map((user) => (
      <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 8. form2query Utilities

```typescript
import {
  nullToUndefined,
  prepareFormForQueryCollection,
} from "@template/db/schema";

const queryData = prepareFormForQueryCollection(formData, entityFormSchema, {
  id: generateId(),
  userId: currentUser.id,
  createdAt: new Date(),
  updatedAt: new Date(),
});
await entitiesCollection.insert([queryData]);
```

## Authentication (Loaders) — CRITICAL

**EVERY `_auth.*` route MUST export a loader returning `{ user: auth.user }`.** Without it, `userId` is `undefined` and inserts fail silently.

```typescript
import type { Route } from "./+types/_auth.{entity}";

export async function loader({ context }: Route.LoaderArgs) {
  return { user: context.user };
}

export default function EntityPage({ loaderData }: Route.ComponentProps) {
  const userId = loaderData.user?.id;
}
```

Rules:

- `Route` from `"./+types/_auth.{entity}"` (same directory)
- **`context.user` directly** — NOT `authContext.get(context).user`
- Component uses `Route.ComponentProps` (NOT custom interface)
- No database queries in loader — only read auth context
- Both list AND detail routes need loaders

## React Router v7 Type Imports

See root `CLAUDE.md` rule 7. Must use same-directory import: `import type { Route } from "./+types/entity"`.

## Navigation & Sidebar

```typescript
import { NavLink, useNavigate } from "react-router";
```

Sidebar: `src/components/app-sidebar.tsx`. Icons from [lucide.dev](https://lucide.dev).

## Error Handling

```typescript
import {
  SchemaValidationError,
  DuplicateKeyError,
  DeleteKeyNotFoundError,
} from "@tanstack/db";
// Handle in try/catch with toast notifications
```

## Troubleshooting

### Silent Insert Failure — `onInsert` never called

| Root Cause                                                       | Fix                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Missing system fields (`createdAt`, `updatedAt`, `userId`)       | Add them before `collection.insert([...])`                            |
| Nullable column receives `undefined` instead of being overridden | Override with `(schema) => schema.optional()` in `createInsertSchema` |
| `userId` undefined (missing loader)                              | Add loader to route — see Authentication above                        |

## FORBIDDEN: `any` Type and Typecheck Suppression

- **NEVER use the `any` type** — use proper types, generics, or `unknown` with type narrowing instead
- **NEVER suppress typecheck errors** with `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, `// eslint-disable`, or any other suppression comment
- The purpose of typecheck is to find and **fix** all type errors — suppressing them hides bugs and is never acceptable

## Anti-Patterns

- React Query for CRUD (use TanStack DB)
- useCallback/useMemo (React Compiler handles it)
- Manual form state with useState (use react-hook-form)
- Inline Zod schemas in components (import from `@template/db/schema`)
- Routes without a loader
- fetch() for API calls (use ORPC client)
- Single-item operations (use bulk: insertMany, updateMany, deleteMany)
- Manual ID input for relationships (use Select with live data)
- Database operations in loaders
- `any` type (use proper types from schemas, ORPC, or define interfaces)
- `// @ts-ignore`, `// @ts-expect-error`, `// eslint-disable` (fix the type error instead)

## Testing

See `packages/test/CLAUDE.md` for the full test guide. Edit/Delete buttons need `aria-label="Edit"` / `aria-label="Delete"` for test accessibility.

```bash
cd packages/test && bun test src/{entity}.test.tsx
```
