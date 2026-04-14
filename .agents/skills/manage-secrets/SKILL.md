---
name: manage-secrets
description: Add and manage application secrets and environment variables. Use when adding API keys, credentials, or updating env.ts.
allowed-tools: "Read,Write,Edit,Glob,Grep"
---

# Manage Secrets & Backend Integration

Process for adding and managing secure environment variables and integrating external services (AI providers, payment processors, email services, etc.).

## Instructions

When you need to add a new secret (like an API key for a third-party service):

1. **Add the secret using the MCP tool**:
   - Use the appropriate MCP tool or command to securely store the secret value.
   - Ensure the secret is available in the runtime environment (e.g., local `.env` or deployment secrets).

2. **Update Type Definitions in `packages/auth/env.ts`**:
   - Edit `packages/auth/env.ts` to include the new variable in the server schema.
   - Use `z.string().optional()` for keys that might not be present in all environments.

   ```typescript
   // packages/auth/env.ts
   export const env = createEnv({
     server: {
       // ... existing vars
       NEW_SECRET_KEY: z.string().optional(),
     },
     // ...
   });
   ```

3. **Install Dependencies**:

   ```bash
   bun add <package-name>
   ```

4. **Create Service Client (Optional)**:
   For complex services, create a client in `packages/api/src/lib/`:

   ```typescript
   // packages/api/src/lib/my-service.ts
   import { env } from "@template/auth";

   export const myServiceClient = new MyService({
     apiKey: env.NEW_SECRET_KEY,
   });
   ```

5. **Usage in Router**:
   Access the secret in your code via `env.NEW_SECRET_KEY` (import from `@template/auth`).

   ```typescript
   import { env } from "@template/auth";

   export const myRouter = {
     action: protectedProcedure.handler(async () => {
       // Use env.NEW_SECRET_KEY directly
       const result = await myServiceCall(env.NEW_SECRET_KEY);
       return result;
     }),
   };
   ```

## Examples

### Adding OpenAI API Key

1. Add secret `OPENAI_API_KEY` using MCP tool.
2. Update `packages/auth/env.ts`:
   ```typescript
   OPENAI_API_KEY: z.string().optional(),
   ```
3. Install dependencies:
   ```bash
   bun add ai @ai-sdk/openai
   ```
4. Use in router:

   ```typescript
   import { openai } from "@ai-sdk/openai";
   import { streamText } from "ai";
   import { env } from "@template/auth";

   // ... inside handler
   const result = streamText({
     model: openai({ apiKey: env.OPENAI_API_KEY })("gpt-4o-mini"),
     // ...
   });
   ```

### Payment Provider: Stripe

1. Add secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
2. Update `packages/auth/env.ts`.
3. Install `stripe`.
4. Create client `packages/api/src/lib/stripe.ts`:

   ```typescript
   import Stripe from "stripe";
   import { env } from "@template/auth";

   export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
   ```

### Email Provider: Resend

1. Add secret `RESEND_API_KEY`.
2. Update `packages/auth/env.ts`.
3. Install `resend`.
4. Create client `packages/api/src/lib/resend.ts`.

## Secret Injection

Secrets are injected at deploy time (not build time) and must never be committed to git. All secret operations are managed through the schema0 CLI:

```bash
schema0 secrets set SECRET_NAME=value
schema0 secrets set --env-file .env.production
schema0 secrets list
schema0 secrets delete SECRET_NAME
```

## Type Safety

The `env` object is fully typed. Accessing a non-existent key will cause a TypeScript error.
