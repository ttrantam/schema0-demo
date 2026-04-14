# Web Testing Guide

Web tests use **bun:test** with **HappyDOM** and `@testing-library/react`. They render React Router v7 page components and exercise the full chain: `fireEvent (UI) → collection.insert/update/delete → router endpoint → real PGlite`.

## Quick Start

```bash
# Step 1: Typecheck YOUR files (required, blocking)
bunx oxlint --type-check --type-aware --quiet <your-files>

# Step 2: Fix all errors before proceeding

# Step 3: Run tests from packages/test/
cd packages/test && bun test web/{entity}.test.tsx
```

**MUST run from `packages/test/`** — the `bunfig.toml` preload is resolved relative to the process CWD.

---

## Pre-Test Checklist

**⚠️ BLOCKING REQUIREMENT: Typecheck MUST pass before ANY of these checks matter.**

If typecheck fails (e.g., missing imports, missing files, type errors), STOP and fix those first. These checks are only for when typecheck passes.

Before running a test, verify the following or the test will fail in ways that are hard to diagnose:

### 1. Router MUST use `createDb()` — NOT `fetchCustomResources`

**Before writing any test, verify the router for your entity uses `createDb()` from `@template/db`.** If the router imports `fetchCustomResources`, the test WILL fail with ECONNREFUSED because no HTTP backend runs during tests.

```typescript
// ✅ CORRECT — router uses createDb(), works with real PGlite in tests
import { createDb } from "@template/db";
const db = createDb();
return await db.select().from(entities);

// ❌ WRONG — router uses fetchCustomResources (HTTP); gets ECONNREFUSED in tests
import { fetchCustomResources } from "./utils";
const res = await fetchCustomResources("entities", { method: "GET" });
```

**`fetchCustomResources` is ONLY allowed in `files.ts` and `users.ts`.** If you see it in any other router, fix the router first — do NOT work around it by mocking the client.

### 2. Collection `queryFn` must use direct server calls — NOT HTTP requests

The collection's `queryFn` **must** call the server client directly. Custom entity collections must use `client.entity.selectAll()`. The built-in `files` and `users` collections use `fetchCustomResources` (an external HTTP service) — those will get `ECONNREFUSED` in tests because no backend is running.

```typescript
// ✅ CORRECT — direct server call via mocked oRPC client, works in tests
queryFn: async (ctx) => {
  return await client.entity.selectAll({});
},

// ❌ WRONG — client.files/users.selectAll calls fetchCustomResources (HTTP); gets ECONNREFUSED
queryFn: async (ctx) => {
  return await client.files.selectAll({});
},
```

If the page silently stays on a loading spinner, check whether the `queryFn` is making a real HTTP call.

### 3. Database migrations must be generated in `packages/test`

Run drizzle-kit generate inside `packages/test` to produce migration files for the test database:

```bash
cd packages/test
bun drizzle-kit generate
```

This generates migration files into `packages/test/drizzle/` which are read by `packages/test/src/index.ts`.

**NEVER hand-write migration files.** Do NOT manually create `.sql` files, `_journal.json`, or snapshot files. Always use `bun drizzle-kit generate`.

### 4. Collection `id` and `queryKey` must match the test's `invalidateQueries` call

```typescript
// collection
queryCollectionOptions({ id: "entity", queryKey: ["entity"], ... })

// test
void testQueryClient.invalidateQueries({ queryKey: ["entity"] });
```

If they don't match, the cache is never invalidated between tests and stale data leaks across test runs.

### 5. NEVER use `.toBeInTheDocument()` or any jest-dom matchers

**`@testing-library/jest-dom` is NOT installed.** Tests run with bun:test + HappyDOM. Using `.toBeInTheDocument()` causes `TypeError: ... is not a function` which fails the test.

```typescript
// ❌ WRONG — toBeInTheDocument() does not exist in bun:test
await waitFor(() => {
  expect(screen.getByText("Test Company")).toBeInTheDocument();
});

// ✅ CORRECT — getByText/getByRole throw if not found; use inside waitFor
await waitFor(() => screen.getByText("Test Company"), { timeout: 5000 });

// ✅ CORRECT — if you need an assertion, use toBeDefined()
const el = screen.getByText("Test Company");
expect(el).toBeDefined();
```

## Infrastructure Files

| File                | Purpose                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `db.ts`             | Exports `db` (PGlite instance), `client`, `initializeTestDatabase`. Reads migrations from `packages/test/drizzle/`. |
| `drizzle.config.ts` | Drizzle config for generating test migrations from `packages/db/src/schema/`.                                       |
| `bunfig.toml`       | Tells Bun to preload `./web/happydom.ts` and `./web/setup.ts` for every web test run.                               |
| `web/happydom.ts`   | Preload: registers HappyDOM globals, mocks `@template/auth` before any import can load it.                          |
| `web/setup.ts`      | Configures `@testing-library/dom` error messages for cleaner test output.                                           |

---

```bash
# Typecheck first (required, blocking)
bunx oxlint --type-check --type-aware --quiet <your-files>

# Run tests
cd packages/test && bun test web/{entity}.test.tsx
```

### ⚠️ CRITICAL: Required Test Flow — No Shortcuts

**Every test MUST exercise the full chain:**

```
fireEvent (UI) → collection.insert/update/delete → router endpoint → real PGlite
```

This is non-negotiable. The purpose of these tests is to verify that the entire stack is wired correctly — from the UI down to the database. Bypassing any layer defeats the point.

### What this means in practice

| Layer          | How it must be triggered                                      |
| -------------- | ------------------------------------------------------------- |
| **UI**         | `fireEvent.click` / `fireEvent.change` on real rendered DOM   |
| **Collection** | Called implicitly by the form submit handler in the component |
| **Router**     | Called by `collection.onInsert` / `onUpdate` / `onDelete`     |
| **Database**   | Hit by the router via the mocked PGlite `db`                  |

### ❌ Forbidden shortcuts

**Do NOT call the router or server client directly as a substitute for the UI test:**

```typescript
// ❌ WRONG — skips the UI and collection entirely
const insertResult = await serverClient.phonebook.insertMany({ ... });
expect(insertResult.created).toHaveLength(1);

// ❌ WRONG — skips form submission; doesn't test that the form is wired to the collection
await phonebookCollection.insert([{ id: "x", name: "y", ... }]);
```

Direct router calls are only acceptable as **supplementary assertions** (e.g. to verify a delete cleared the DB), never as a replacement for the UI-driven flow.

**Do NOT remove a failing UI test and replace it with a direct DB/router test.** If the UI test times out or fails, fix the root cause (see Pre-Test Checklist above and the "Why insert requires `optimistic: false`" section below).

### ❌ ABSOLUTELY FORBIDDEN: Gutting tests to make them pass

**NEVER reduce test coverage to work around a failing test.** This is the most dangerous anti-pattern — it creates a false sense of security while shipping broken code to production.

Specifically, NEVER do any of the following:

```typescript
// ❌ FORBIDDEN — replacing full-chain CRUD tests with render-only checks
test("renders heading", async () => {
  await waitFor(() => screen.getByRole("heading", { name: /entities/i }));
});
// This verifies NOTHING about insert/update/delete functionality

// ❌ FORBIDDEN — mocking the entire ORPC client with fake returns
const mockClient = {
  entities: {
    selectAll: async () => [],
    insertMany: async () => ({ created: [], failed: [] }),
  },
} as any;
// This bypasses the real router and PGlite entirely

// ❌ FORBIDDEN — removing spyOn, fireEvent, collection imports
// If you find yourself removing these, you are gutting the test
```

**If a test fails, the correct response is ALWAYS to fix the source code, not the test:**

| Symptom                        | Root Cause                                   | Fix                                                                       |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------- |
| ECONNREFUSED in router         | Router uses `fetchCustomResources`           | Rewrite router to use `createDb()` — see `packages/api/CLAUDE.md`         |
| Schema validation rejects data | Missing fields or nullable/optional mismatch | Fix the schema overrides — see `packages/db/CLAUDE.md`                    |
| `onInsert` never called        | Collection schema validation gate            | Add system fields before `collection.insert()` — see `apps/web/CLAUDE.md` |
| HappyDOM deadlock on insert    | Missing `optimistic: false`                  | Wrap insert spy — see "Why insert requires `optimistic: false`" below     |

**Every test MUST include these three CRUD tests** (create, update, delete via UI). A test file with only render checks is incomplete and MUST be rejected.

### ⚠️ ESCAPE HATCH: When to STOP and ask the user

**If CRUD tests fail after 3 fix attempts and you cannot identify the root cause, you MUST STOP and ask the user for help.** Do NOT continue looping. Do NOT gut the tests. Do NOT replace CRUD tests with render-only checks.

Specifically, STOP if any of these are true after 3 attempts:

- `onInsert` / `onUpdate` is never called and you don't know why
- Schema validation issues persist and your fixes aren't working
- The test times out waiting for a spy to be called
- You are tempted to remove `dataValidationSpy`, `insertSpy`, or `inputValidationSpy` assertions

**What to tell the user when you stop:**

1. Which test is failing (create, update, or delete)
2. The exact error or timeout
3. What you tried (list your 3 attempts)
4. Your best guess at the root cause

The user can then debug interactively or adjust the approach. This is **always better** than shipping gutted tests that pass but verify nothing.

### 3-Layer Validation Model

Tests verify data correctness at three boundaries. Each layer catching an error means **data was wrong at that level** — but passing does NOT mean everything downstream succeeded (callbacks/handlers could still fail).

| Layer                   | What it validates                             | Spy target                                                                                                       | Pass means                                                                            | Fail means                                  |
| ----------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Layer 1: Form**       | Form data conforms to zodResolver schema      | `form.handleSubmit(onValid, onInvalid)` — if no `"Form validation errors:"` in console, it passed                | Data matches form schema                                                              | zodResolver rejected — onSubmit never fires |
| **Layer 2: Collection** | Inserted object matches collection's `schema` | `spyOn((collection as any)._mutations, "validateData")` — assert `.issues` is undefined                          | Data valid for collection — but onInsert/onUpdate/onDelete callbacks could still fail | onInsert/onUpdate/onDelete never called     |
| **Layer 3: ORPC**       | Input matches router's `.input()` schema      | `spyOn((router.procedure as any)["~orpc"].inputSchema["~standard"], "validate")` — assert `.issues` is undefined | Data valid for endpoint — but handler could still fail                                | Handler never runs                          |

### ✅ Correct structure (one test per mutation)

**⚠️ ALL THREE tests below are REQUIRED. A test file with only the create test is INCOMPLETE.**

```typescript
test("create via UI triggers insertMany endpoint", async () => {
  // 1. Spy on collection.insert with optimistic: false (required for insert)
  // 2. Spy on collection._mutations.validateData (LAYER 2 — catches schema validation failures)
  // 3. Spy on router inputSchema["~standard"].validate (LAYER 3 — catches ORPC input validation)
  // 4. fireEvent.click the "Create {Entity}" button to open dialog
  // 5. await waitFor(() => screen.getByLabelText(/fieldName/i)) to wait for dialog
  // 6. fireEvent.change to fill required fields
  //    (LAYER 1: if "Form validation errors:" appears in console, form schema rejected)
  // 7. fireEvent.click the "Create" submit button
  // 8. Assert collection.insert was called
  // 9. Assert insertSpy.mock.results[0]?.value?.error is undefined
  // 10. Assert dataValidationSpy.mock.results[0]?.value?.issues is undefined (LAYER 2)
  // 11. Assert inputValidationSpy result has no issues (LAYER 3)
});

test("update via UI triggers updateMany endpoint", async () => {
  // 1. Spy on collection.update (NOT updateMany — see below)
  // 2. Spy on router updateMany inputSchema["~standard"].validate (LAYER 3)
  // 3. fireEvent.click the row's "Edit" button (aria-label="Edit") to open edit dialog
  // 4. await waitFor(() => screen.getByLabelText(/fieldName/i)) to wait for dialog
  // 5. fireEvent.change to modify a field
  // 6. fireEvent.click the "Save" submit button
  // 7. Assert collection.update was called
  // 8. Assert ORPC input validation has no issues (LAYER 3)
  //
  // ⚠️ CRITICAL: The form uses collection.update(id, draftFn), NOT collection.updateMany().
  // Spy on "update", not "updateMany".
});

test("delete via UI triggers deleteMany endpoint", async () => {
  // ⚠️ CRITICAL: Delete uses a 2-step flow — row button → AlertDialog → confirm button.
  // Do NOT use confirm() or window.confirm — the UI uses a React AlertDialog component.
  //
  // 1. Spy on router deleteMany inputSchema["~standard"].validate (LAYER 3)
  // 2. fireEvent.click the row's "Delete" button (aria-label="Delete")
  //    → This opens the AlertDialog (NOT a browser confirm dialog)
  // 3. await waitFor(() => screen.getByRole("button", { name: /^delete$/i }))
  //    → Wait for the AlertDialog's confirm button to appear
  //    NOTE: The row "Delete" button has aria-label="Delete" (icon button),
  //    while the AlertDialog confirm button has text content "Delete".
  //    Use /^delete$/i (exact match) for the confirm button to avoid matching
  //    the row's icon button which also matches /delete/i.
  // 4. fireEvent.click the AlertDialog's "Delete" confirm button
  // 5. Assert ORPC input validation has no issues (LAYER 3)
});
```

**⚠️ AlertDialog delete flow — common pitfalls:**

| Mistake                                           | Symptom                                                             | Fix                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Column uses `confirm()` instead of `meta?.delete` | `confirm` returns `false` in HappyDOM, delete never fires           | Use `onDelete?.(row.original)` which opens AlertDialog            |
| Column passes `row.original.id` to delete handler | `setJobApplicationToDelete(someString)` — AlertDialog text is wrong | Pass `row.original` (full object)                                 |
| Test clicks wrong "Delete" button                 | Clicks the row button again instead of AlertDialog confirm          | Use `/^delete$/i` (exact) for confirm, `/delete/i` for row button |

### ⚠️ MANDATORY: Verify all 3 tests exist before declaring complete

After writing your test file, run this command to verify:

```bash
grep -c "test(\"create\|test(\"update\|test(\"delete" packages/test/web/{entity}.test.tsx
# Output MUST be 3. If less than 3, go back and add the missing tests.
```

---

## Writing a Web Test for a New Entity

### File location and naming

```
packages/test/web/{entity}.test.tsx
```

File extension **must be `.tsx`** — JSX is used and `.ts` will fail.

---

### Module Mock Ordering (Critical)

Bun's module mocking is **hoisted** — `mock.module()` calls must come before the imports they intercept, and the import order determines which mocked version each module receives. The required order is:

```typescript
// 1. Mock the database — BEFORE importing the router
//    This gives the router the real PGlite `db` instance instead of the production DB URL.
void mock.module("@template/db", () => ({ createDb: () => db }));

// 2. Mock auth — BEFORE importing the router
//    @template/auth validates env vars and creates a WorkOS client at module load time.
void mock.module("@template/auth", () => ({ auth: {}, env: {} }));

// 3. Import the router AFTER mocks — it now uses real PGlite
import { appRouter } from "@template/api/routers/index";

// 4. Create the server client and QueryClient
const serverClient = createRouterClient(appRouter, { context: mockContext as any });
const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });

// 5. Mock @/utils/orpc — the collection captures `client` and `queryClient` at import time,
//    so this mock must be registered before the collection is imported.
void mock.module("@/utils/orpc", () => ({
  client: serverClient,
  queryClient: testQueryClient,
  orpc: {},
}));

// 6. Import collections and page components LAST — they now capture the mocked orpc client
import { {entity}Collection } from "@/query-collections/custom/{entity}";
// ⚠️ DEFAULT import — no curly braces (route uses `export default function`)
import EntityPage from "@/routes/_auth.entities";       // e.g., import CrmsPage from "@/routes/_auth.crms"
import { {entity}Router } from "@template/api/routers/{entity}";
```

`mock.module()` returns a Promise — always prefix with `void` to suppress floating promise warnings.

---

### REQUIRED: debugTexts() at the Start of Every Test

**Every test MUST call `debugTexts()` as its first action** (after render/interaction that sets up the DOM state). This logs all visible DOM text to the console, making test failures immediately diagnosable — you can see exactly what was on the page when an assertion failed.

**The Helper Function — add this to every test file:**

```typescript
function debugTexts(separator = " | ") {
  const elements = screen.getAllByText(/./i);
  const texts = elements.map((el) => el.textContent?.trim()).filter(Boolean);
  console.log(texts.join(separator));
}
```

**Usage — call at the START of every test:**

```typescript
test("create via UI", async () => {
  debugTexts(); // ⚠️ REQUIRED — always first, shows current DOM state
  // ... rest of test
});

test("update via UI", async () => {
  debugTexts(); // ⚠️ REQUIRED
  // ... rest of test
});

test("delete via UI", async () => {
  debugTexts(); // ⚠️ REQUIRED
  // ... rest of test
});
```

**Also call after UI interactions that change the DOM** (opening dialogs, submitting forms):

```typescript
test("edit dialog has correct fields", async () => {
  debugTexts(); // Shows page before interaction
  fireEvent.click(screen.getByRole("button", { name: /edit/i }));
  await waitFor(() => screen.getByLabelText(/name/i));
  debugTexts(); // Shows dialog fields after opening
});
```

---

### Full Test Template

```typescript
import {
  describe,
  test,
  expect,
  mock,
  beforeAll,
  beforeEach,
  afterAll,
  spyOn,
} from "bun:test";
import { createRouterClient } from "@orpc/server";
// Import pure to disable auto-cleanup — we share one render across all tests in the describe block
import "@testing-library/react/pure";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react/pure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db, initializeTestDatabase } from "./index";
import React from "react";

// --- Mock ordering (see "Module Mock Ordering" above) ---
void mock.module("@template/db", () => ({ createDb: () => db }));
void mock.module("@template/auth", () => ({ auth: {}, env: {} }));

import { appRouter } from "@template/api/routers/index";

const mockContext = {
  session: { user: { id: "user_123456", email: "test@example.com" } },
  request: new Request("https://example.com"),
};
const serverClient = createRouterClient(appRouter, { context: mockContext as any });

const testQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 0 } },
});

void mock.module("@/utils/orpc", () => ({
  client: serverClient,
  queryClient: testQueryClient,
  orpc: {},
}));

import { {entity}Collection } from "@/query-collections/custom/{entity}";
import { BrowserRouter } from "react-router";
// ⚠️ DEFAULT import for page — no curly braces (route uses `export default function`)
import EntityPage, { loader as entitiesLoader } from "@/routes/_auth.entities";  // e.g., import CrmsPage, { loader as crmsLoader } from "@/routes/_auth.crms"
import { {entity}Router } from "@template/api/routers/{entity}";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={testQueryClient}>
    <BrowserRouter>{children}</BrowserRouter>
  </QueryClientProvider>
);

// ⚠️ REQUIRED — call at the start of EVERY test to log all DOM text for debugging
function debugTexts(separator = " | ") {
  const elements = screen.getAllByText(/./i);
  const texts = elements.map((el) => el.textContent?.trim()).filter(Boolean);
  console.log(texts.join(separator));
}

beforeAll(async () => {
  await initializeTestDatabase();
});

beforeEach(async () => {
  void testQueryClient.invalidateQueries({ queryKey: ["{entity}"] });
});

describe("{Entity}Page - full CRUD via UI", () => {
  // Render once and share across all tests in this describe block.
  // Tests run sequentially: create → update → delete.
  beforeAll(async () => {
    await act(async () => {
      render(
        <Providers>
          <{Entity}Page loaderData={{ user: { id: "user_123456" } } as any} />
        </Providers>,
      );
    });
  });

  afterAll(async () => {
    cleanup();
  });

  // Sanity check: the loader must exist or loaderData is undefined in the page,
  // causing userId to be undefined and schema validation failures in the router.
  test("{entity} route exports a loader", () => {
    expect(typeof {entity}Loader).toBe("function");
  });

  test("create via UI triggers insertMany endpoint", async () => {
    debugTexts(); // ⚠️ REQUIRED — always log DOM text at start of every test
    // ⚠️ REQUIRED: wrap insert with optimistic: false to prevent a HappyDOM hang.
    // See "Why insert requires optimistic: false" below for the full explanation.
    const originalInsert = {entity}Collection.insert.bind({entity}Collection);
    const insertSpy = spyOn({entity}Collection, "insert").mockImplementation(
      (...args: any[]) => originalInsert(args[0], { ...args[1], optimistic: false }),
    );

    // ⚠️ LAYER 2: Collection schema validation — catches missing/wrong fields
    // before onInsert callback runs. If issues exist, onInsert is never called.
    const dataValidationSpy = spyOn(
      ({entity}Collection as any)._mutations,
      "validateData",
    );

    // ⚠️ LAYER 3: ORPC input schema validation — catches data shape mismatches
    // before the handler runs. ORPC uses ~standard.validate (NOT safeParse).
    // Returns { value } on success, { issues } on failure.
    const inputValidationSpy = spyOn(
      ({entity}Router.insertMany as any)["~orpc"].inputSchema["~standard"],
      "validate",
    );

    // Open the create dialog
    await waitFor(() => screen.getByRole("button", { name: /add {entity}/i }));
    fireEvent.click(screen.getByRole("button", { name: /add {entity}/i }));
    await waitFor(() => screen.getByLabelText(/name/i));

    // Fill required fields and submit
    // ⚠️ LAYER 1: Form validation — the Form component MUST pass onInvalid to
    // form.handleSubmit(onValid, onInvalid). If onInvalid logs an error, the data
    // doesn't conform with the form resolver schema and onSubmit never fires.
    // If no "Form validation errors:" appears in console, form validation passed.
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Test Item" } });
    fireEvent.click(screen.getByRole("button", { name: /^create$/i }));

    // Assert: collection.insert was called (form → collection boundary)
    await waitFor(() => expect(insertSpy).toHaveBeenCalled(), { timeout: 3000 });

    // ⚠️ REQUIRED: always assert no validation error on the insert result.
    expect(insertSpy.mock.results[0]?.value?.error).toBeUndefined();

    // ⚠️ LAYER 2 CHECK: assert collection schema validation passed.
    // Passing means data is valid for the collection. Does NOT guarantee onInsert succeeded.
    expect(dataValidationSpy.mock.results[0]?.value?.issues).toBeUndefined();
    dataValidationSpy.mockRestore();

    const insertedItem = insertSpy.mock.calls[0]?.[0]?.[0];
    insertSpy.mockRestore();

    expect(insertedItem.name).toBe("Test Item");
    expect(insertedItem.userId).toBe("user_123456");

    // ⚠️ LAYER 3 CHECK: assert ORPC input validation passed.
    // Passing means data is valid for the endpoint. Does NOT guarantee the handler succeeded.
    const inputResult = await inputValidationSpy.mock.results[0]?.value;
    if (inputResult?.issues) {
      console.error("ORPC input validation failed:", inputResult.issues);
    }
    expect(inputResult?.issues).toBeUndefined();
    inputValidationSpy.mockRestore();
  });

  test("update via UI triggers updateMany endpoint", async () => {
    debugTexts(); // ⚠️ REQUIRED — always log DOM text at start of every test
    // Plain spyOn — no mockImplementation needed. Update does not hang.
    const updateSpy = spyOn({entity}Collection, "update");

    // ⚠️ LAYER 3: ORPC input schema validation for updateMany
    const updateInputSpy = spyOn(
      ({entity}Router.updateMany as any)["~orpc"].inputSchema["~standard"],
      "validate",
    );

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    await waitFor(() => screen.getByLabelText(/name/i));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Updated Item" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    // Assert: collection.update was called with the item's id (form → collection boundary)
    await waitFor(() => expect(updateSpy).toHaveBeenCalled(), { timeout: 3000 });
    const [updatedId] = updateSpy.mock.calls[0] as any[];
    expect(typeof updatedId).toBe("string");
    updateSpy.mockRestore();

    // ⚠️ LAYER 3 CHECK: assert ORPC input validation passed for updateMany
    const updateInputResult = await updateInputSpy.mock.results[0]?.value;
    if (updateInputResult?.issues) {
      console.error("ORPC updateMany input validation failed:", updateInputResult.issues);
    }
    expect(updateInputResult?.issues).toBeUndefined();
    updateInputSpy.mockRestore();
  });

  test("delete via UI triggers deleteMany endpoint", async () => {
    debugTexts(); // ⚠️ REQUIRED — always log DOM text at start of every test

    // ⚠️ LAYER 3: ORPC input schema validation for deleteMany
    const deleteInputSpy = spyOn(
      ({entity}Router.deleteMany as any)["~orpc"].inputSchema["~standard"],
      "validate",
    );

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => screen.getByRole("button", { name: /^delete$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    // ⚠️ LAYER 3 CHECK: assert ORPC input validation passed for deleteMany
    const deleteInputResult = await deleteInputSpy.mock.results[0]?.value;
    if (deleteInputResult?.issues) {
      console.error("ORPC deleteMany input validation failed:", deleteInputResult.issues);
    }
    expect(deleteInputResult?.issues).toBeUndefined();
    deleteInputSpy.mockRestore();
  });
});
```

---

## Why `insert` Requires `optimistic: false` (and `update`/`delete` Do Not)

### The hang mechanism

When `collection.insert()` is called with `optimistic: true` (the default), TanStack DB synchronously:

1. Adds the new item to `optimisticUpserts`
2. Calls `recomputeOptimisticState(true)` → `collectOptimisticChanges()` → `emitEvents()`
3. This synchronously notifies `useLiveQuery`'s subscription callback
4. `useLiveQuery` calls React's `setState()` with new data
5. React 18 schedules the re-render via `MessageChannel.postMessage()`

In a real browser, the `MessageChannel` message is delivered asynchronously between tasks. In **HappyDOM**, `MessageChannel` is implemented but its delivery is tied to HappyDOM's own async task queue. When `fireEvent.click` triggers an async form submit handler (`handleSubmit` from React Hook Form), the event loop enters a microtask chain. The `MessageChannel` message from step 5 is never delivered because the event loop never returns to process it — and anything the test `await`s is also stuck, because completing those awaits would require React to finish its re-render, which requires the `MessageChannel` message to be delivered first. **Deadlock.**

### Why `collectOptimisticChanges` produces an event for insert but not always for update/delete

`collectOptimisticChanges` compares the **previous optimistic state** to the **current optimistic state**. It emits an event only when the value actually changed:

```
insert:  previousValue = undefined (item didn't exist) → currentValue = new item  → emits INSERT event ✅
update:  previousValue = syncedItem (item exists)       → currentValue = modified  → emits UPDATE event ✅
delete:  previousValue = syncedItem (item exists)       → currentValue = undefined → emits DELETE event ✅
```

All three operations emit change events through the same code path in TanStack DB. The difference is **when they run in the test**:

- **insert** is always the **first mutation**. `useLiveQuery` has been showing an empty list. The INSERT event causes it to go from 0 → 1 items — a transition that triggers a React re-render in a context where the event loop is already inside the `fireEvent` synchronous call chain. This is where the deadlock occurs.

- **update and delete** run after the insert has already completed and the item is in `syncedData`. By the time these tests run, the React component has already rendered with data, and the event loop has had opportunities to settle between tests. The optimistic change event is still emitted, but it doesn't cause the same deadlock because the component's `useLiveQuery` subscription is updating an already-rendered row rather than inserting a new one into an empty list.

### The fix

```typescript
// Intercept collection.insert and force optimistic: false
const originalInsert = {entity}Collection.insert.bind({entity}Collection);
const insertSpy = spyOn({entity}Collection, "insert").mockImplementation(
  (...args: any[]) => originalInsert(args[0], { ...args[1], optimistic: false }),
);
```

With `optimistic: false`, the mutation's `optimistic` flag is `false`. In `recomputeOptimisticState`, the mutation is skipped (line 261 in state.ts: `if (mutation.optimistic)`). No item is added to `optimisticUpserts`, so `collectOptimisticChanges` finds no difference between previous and current state, produces zero events, and `emitEvents` returns early (no subscribers are notified). React never calls `setState()`, no `MessageChannel` is posted, and the event loop stays free.

The item still appears in the UI — it shows up after `onInsert` completes and the `queryFn` refetches from PGlite.

### This is non-negotiable

You **must** use this pattern for insert tests. You **must not** apply it to update or delete — they don't hang and applying `optimistic: false` there changes the behavior being tested.

---

## `spyOn` Method Names Must Match the Collection

When spying on a collection method, the method name in `spyOn` must exactly match the method that the component actually calls on the collection.

```typescript
// ✅ Collection has `insert` → component calls `collection.insert([...])` → spy matches
const insertSpy = spyOn(entityCollection, "insert");

// ✅ Collection has `update` → component calls `collection.update(id, changes)` → spy matches
const updateSpy = spyOn(entityCollection, "update");

// ❌ Collection has `updateMany` but spy targets `update` → component calls `updateMany`, spy never fires
const updateSpy = spyOn(entityCollection, "update"); // WRONG if collection only has `updateMany`
```

Before writing spyOn calls, **check the actual method names on the collection object** (in `apps/web/src/query-collections/custom/{entity}.ts`). The spy method name must be identical to what the form submit handler calls.

---

## Spying on oRPC Internals via `["~orpc"]`

### The problem: `createRouterClient` returns a Proxy

```typescript
const serverClient = createRouterClient(appRouter, { context });

serverClient.entity; // → get trap fires → returns new ProxyA
serverClient.entity; // → get trap fires → returns new ProxyB
// ProxyA !== ProxyB — different objects every time
```

You **cannot** spy on `serverClient.entity.insertMany` — each property access returns a new proxy, so the spy wraps a different object than the one actually called. Zero calls recorded.

### The fix: access `["~orpc"]` on the stable router object

Each procedure is a stable `DecoratedProcedure` object with a `["~orpc"]` property containing the handler, input/output schemas, and middlewares. Every proxy call ultimately uses this same reference.

### What we spy on: input schema validation (LAYER 3)

ORPC validates input via `schema["~standard"].validate()` (the standard-schema interface, NOT Zod's `safeParse`). Returns `{ value }` on success, `{ issues }` on failure.

```typescript
// ⚠️ LAYER 3: ORPC input validation — spy on the stable schema object
const inputValidationSpy = spyOn(
  ({entity}Router.insertMany as any)["~orpc"].inputSchema["~standard"],
  "validate",
);

// Assert: no validation issues
const inputResult = await inputValidationSpy.mock.results[0]?.value;
if (inputResult?.issues) {
  console.error("ORPC input validation failed:", inputResult.issues);
}
expect(inputResult?.issues).toBeUndefined();
inputValidationSpy.mockRestore();
```

### Which procedures have which schemas

| Procedure    | `inputSchema` | `outputSchema` |
| ------------ | ------------- | -------------- |
| `selectAll`  | ✅ (options)  | ✅ (items)     |
| `insertMany` | ✅ (items)    | —              |
| `updateMany` | ✅ (items)    | —              |
| `deleteMany` | ✅ (ids)      | —              |

---

## ⚠️ FORBIDDEN: `any` Type and Typecheck Suppression

- **NEVER use the `any` type** — use proper types, generics, or `unknown` with type narrowing instead
- **NEVER suppress typecheck errors** with `// @ts-ignore`, `// @ts-expect-error`, `// @ts-nocheck`, `// eslint-disable`, or any other suppression comment
- The purpose of typecheck is to find and **fix** all type errors — suppressing them hides bugs and is never acceptable
- For test infrastructure patterns that access private internal APIs (e.g., `_mutations`, `["~orpc"]`), use typed assertions (`as unknown as SpecificType`) or define minimal type interfaces — do NOT fall back to `any`

## Key Rules Summary

| Rule                                                                          | Reason                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run `bun test` from `packages/test/`                                          | `bunfig.toml` preload path resolves relative to CWD                                                                                                                                                                                                                 |
| `queryFn` must use `client.entity.selectAll()` directly                       | `files`/`users` collections use `fetchCustomResources` (HTTP); gets `ECONNREFUSED` — page never renders                                                                                                                                                             |
| Collection `id`/`queryKey` must match `invalidateQueries` key                 | Mismatch means stale data leaks between tests                                                                                                                                                                                                                       |
| `void mock.module(...)`                                                       | `mock.module()` returns a Promise; `void` suppresses the warning                                                                                                                                                                                                    |
| Mock `@template/db` before importing router                                   | Router captures `createDb` at module load                                                                                                                                                                                                                           |
| Mock `@template/auth` before importing router                                 | Auth validates env vars at module load                                                                                                                                                                                                                              |
| Mock `@/utils/orpc` before importing collections                              | Collection captures `client` and `queryClient` at module load                                                                                                                                                                                                       |
| Import collections and page components last                                   | They must receive the mocked orpc client                                                                                                                                                                                                                            |
| Use `@testing-library/react/pure`                                             | Disables auto-cleanup between tests; required when sharing one render across tests                                                                                                                                                                                  |
| Use `optimistic: false` on insert spy                                         | Prevents HappyDOM deadlock from React's MessageChannel scheduler                                                                                                                                                                                                    |
| Assert `insertSpy.mock.results[0]?.value?.error` is undefined                 | Catches silent schema validation failures on insert                                                                                                                                                                                                                 |
| Spy on `collection._mutations.validateData` and assert `.issues` is undefined | **DO NOT REMOVE.** Inserted data is parsed through the collection's `schema` (selectEntitySchema); if validation fails, `onInsert` and the router handler are never called — this spy surfaces the root cause. If this fails, FIX THE DATA, don't remove the check. |
| Spy on `router.procedure["~orpc"].inputSchema["~standard"].validate`          | ORPC uses ~standard.validate (NOT safeParse); returns `{ value }` or `{ issues }`. Spy on the stable router object, NOT `serverClient` (Proxy returns new object on every access)                                                                                   |
| Always call `spy.mockRestore()` after assertions                              | Prevents spy state from leaking into subsequent tests                                                                                                                                                                                                               |
| `spyOn(collection, "method")` name must match collection's actual method      | Wrong name = spy never fires; check collection source before writing spy                                                                                                                                                                                            |
| Run `cd packages/test && bun drizzle-kit generate` when schema changes        | Test infra reads from `packages/test/drizzle/`; migrations are generated from test drizzle config                                                                                                                                                                   |
