import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const publicEnvSchema = {
  YB_URL: z.string(),
  YB_API_HOSTNAME: z.string(),
  YB_ORGANIZATION_ID: z.string(),
  YB_APP_ID: z.string(),
  YB_WORKOS_CLIENT_ID: z.string(),
};

export type PublicEnv = z.infer<typeof publicEnvSchemaObject>;

const publicEnvSchemaObject = z.object(publicEnvSchema);

export const env = createEnv({
  server: {
    ...publicEnvSchema,
    ENVIRONMENT: z.string().default("production"),
    DATABASE_URL: z.string(),
    ROOT_BACKEND_API_KEY: z.string(),
  },
  runtimeEnv: process.env,
  onValidationError: (error) => {
    console.error("Validation error:", error);
    throw new Error(
      `Validation error occurred, process.env: ${JSON.stringify(process.env)}`,
    );
  },
});
