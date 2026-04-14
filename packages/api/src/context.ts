import type { Context as HonoContext } from "hono";
import { auth } from "@template/auth";

// DO NOT remove this export;
export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const user = await auth.getUser(context.req.raw);
  return {
    session: {
      user,
    },
    request: context.req.raw,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
