import { publicProcedure } from "../index";
import { filesRouter } from "./files";
import { integrationsRouter } from "./integrations";
import { usersRouter } from "./users";
import { trainersRouter } from "./trainers";
import { sessionsRouter } from "./sessions";
import { bookingsRouter } from "./bookings";
import type { RouterClient } from "@orpc/server";
import type { InferRouterInputs } from "@orpc/server";
import type { InferRouterOutputs } from "@orpc/server";

// The inferred type of appRouter cannot be named without a reference to .bun/@types+pg@8.15.6/node_modules/@types/pg. This is likely not portable. A type annotation is necessary.
// @ts-nocheck (ts 2742)
export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  files: filesRouter,
  integrations: integrationsRouter,
  users: usersRouter,
  trainers: trainersRouter,
  sessions: sessionsRouter,
  bookings: bookingsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
export type Inputs = InferRouterInputs<typeof appRouter>;
export type Outputs = InferRouterOutputs<typeof appRouter>;
