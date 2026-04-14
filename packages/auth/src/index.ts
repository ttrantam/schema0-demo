import { createClient } from "@schema0/auth-web";
import { env } from "../env";
import type { User } from "@schema0/auth-web";
// DO NOT REMOVE THIS EXPORT
export { env, type User };

export const auth: Awaited<ReturnType<typeof createClient>> =
  await createClient(env.YB_WORKOS_CLIENT_ID, {
    apiHostname: env.YB_API_HOSTNAME,
    https: env.ENVIRONMENT === "production",
    organizationId: env.YB_ORGANIZATION_ID,
    redirectUri: env.YB_URL,
  });
