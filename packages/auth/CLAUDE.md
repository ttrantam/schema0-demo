# auth Package

High-level authentication utilities. Wraps `@schema0/auth-web` (npm package) with environment configuration and pre-built auth client.

## Package Name

`@template/auth`

## Purpose

This package provides:

- Simplified authentication for React Router SSR apps
- Pre-configured auth client
- Environment variable management
- Helper functions for authentication operations

**This is the recommended package for authentication in React Router apps.**

## Core API

### Getting the User

```typescript
import { auth } from "@template/auth";

const user = await auth.getUser(request);

if (!user) {
  throw redirect("/login");
}

// user contains: id, email, name, organizationId, impersonator?
```

### Get Sign-In URL

```typescript
import { auth } from "@template/auth";

const signInUrl = await auth.getSignInUrl({
  state: { redirect: "/dashboard" }, // Optional redirect after login
});

return redirect(signInUrl);
```

### Get Logout URL

```typescript
import { auth, env } from "@template/auth";

const logoutUrl = await auth.getLogoutUrl({
  returnTo: env.YB_URL,
  serverRequest: request,
});

return redirect(logoutUrl);
```

### Get Access Token

```typescript
import { auth } from "@template/auth";

const accessToken = await auth.getAccessToken(request);
```

## Usage Example

See `apps/web/src/middleware/auth.ts` for the recommended authentication middleware pattern:

```typescript
import { auth, env, type User } from "@template/auth";
import { redirect, type RouterContextProvider } from "react-router";
import { authContext } from "@/context";

export const authMiddleware: Route.MiddlewareFunction = async ({
  request,
  context,
}) => {
  try {
    const user = await auth.getUser(request);
    if (!user) {
      const url = new URL(request.url);
      const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
      throw redirect(redirectUrl);
    }
    authContext.set(context, {
      user,
      organizationId: env.YB_ORGANIZATION_ID,
      appId: env.YB_APP_ID,
      apiHostname: env.YB_API_HOSTNAME,
    });
  } catch (error) {
    const url = new URL(request.url);
    const redirectUrl = `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`;
    throw redirect(redirectUrl);
  }
};

export async function getSignInUrl(redirectTo?: string): Promise<string> {
  const signInUrl = await auth.getSignInUrl({
    state: redirectTo ? { redirect: redirectTo } : undefined,
  });
  return signInUrl;
}

export async function getLogoutUrl(request: Request): Promise<string> {
  const logoutUrl = await auth.getLogoutUrl({
    returnTo: env.YB_URL,
    serverRequest: request,
  });
  return logoutUrl;
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const accessToken = await auth.getAccessToken(request);
  return accessToken;
}
```

## Environment Variables

```typescript
import { env } from "@template/auth";

env.YB_URL; // App URL
env.YB_API_HOSTNAME; // Schema0 API hostname
env.YB_ORGANIZATION_ID; // Organization ID
env.YB_APP_ID; // App ID
env.DATABASE_URL; // Database connection string
```

## Type Exports

```typescript
import type { User, Impersonator } from "@template/auth";

interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  impersonator?: Impersonator;
}
```

## Authentication Flow

1. **Middleware** - Apply `authMiddleware` to protected layout (`apps/web/src/routes/_auth.tsx`)
2. **Login** - Redirect to sign-in URL via `auth.getSignInUrl()`
3. **Auth Context** - Store auth data (user, organizationId, appId, apiHostname) in context via `authContext.set()`
4. **Access Auth** - Get auth data from context via `authContext.get()`
5. **Logout** - Redirect to logout URL via `auth.getLogoutUrl()`

See main `CLAUDE.md` for complete authentication setup examples.

## Related Packages

- `@schema0/auth-web` - Low-level authentication client (npm package)
- `@schema0/auth-mobile` - Mobile authentication client (npm package)
- `@template/api` - ORPC procedures (can access user from context)
- `@template/db` - Database with authenticated connections

## Notes

- ✅ **Use this package for server-side auth** (both web and mobile API workers)
- ✅ **See `apps/web/src/middleware/auth.ts` for web implementation reference**
- ✅ **Environment variables are validated at startup**
- ❌ **Never import `@schema0/auth-web` directly** — use `@template/auth` instead
