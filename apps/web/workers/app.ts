import { Hono } from "hono";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { apiRoutes, type APIRoutes } from "./api";
import { hc } from "hono/client";
import {
  apiClientContext,
  cloudflareContext,
  executionContext,
  authContext,
} from "@/context";

type HonoConfig = {
  Bindings: Env;
  Variables: {
    apiClient: ReturnType<typeof hc<APIRoutes>>;
  };
};

const app = new Hono<HonoConfig>();

// Middleware
app.use(logger());
app.use(
  "/*",
  cors({
    origin: (c) => env?.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

// Mount API routes
app.route("/", apiRoutes);

// React Router (catches all non-API routes)
app.all("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  const rrCtx = new RouterContextProvider();

  cloudflareContext.set(rrCtx, c.env);
  apiClientContext.set(rrCtx, c.get("apiClient"));
  executionContext.set(rrCtx, c.executionCtx);

  return requestHandler(c.req.raw, rrCtx);
});

export default app;
