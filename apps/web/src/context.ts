import type { hc } from "hono/client";
import {
  createContext,
  RouterContextProvider,
  type AppLoadContext,
} from "react-router";
import type { APIRoutes } from "../workers/api";
import type { AuthContext } from "@/middleware/auth";

// `createContext()` should be executed in React Router's runtime.
// So, placing it here, not in workers/app.ts
function createContextWithAccessor<T>(initialValue?: T) {
  const ctx = createContext<T>(initialValue);

  return {
    get: (provider: Readonly<RouterContextProvider>) => provider.get(ctx),
    set: (
      provider: Readonly<RouterContextProvider> | RouterContextProvider,
      value: T,
    ) => provider.set(ctx, value),
  };
}

export const cloudflareContext = createContextWithAccessor<Env>();

export const apiClientContext =
  createContextWithAccessor<ReturnType<typeof hc<APIRoutes>>>();

export const executionContext = createContextWithAccessor<ExecutionContext>();

export const authContext = createContextWithAccessor<AuthContext>({
  user: null,
  organizationId: "",
  appId: "",
  apiHostname: "",
});
