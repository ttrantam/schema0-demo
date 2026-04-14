import { env } from "@template/auth";
import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { z } from "zod/v4";
import * as schema from "./schema";

// Zod schema for claims object (JWT format)
const ClaimsSchema = z.object({
  aud: z.string(), // audience - organization ID
  iss: z.string(), // issuer
  sub: z.string(), // subject - user ID
  sid: z.string(), // session ID
  jti: z.string(), // JWT ID
  org_id: z.string(), // organization ID
  role: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  entitlements: z.array(z.string()),
  exp: z.number(), // expiration timestamp
  iat: z.number(), // issued at timestamp
});

export type Claims = z.infer<typeof ClaimsSchema>;

// Create a new db instance for each request to avoid I/O context issues in Cloudflare Workers
export const createDb = () => drizzle(env.DATABASE_URL, { schema });

// Infer the transaction type from the db instance
type DbType = ReturnType<typeof createDb>;
type TransactionType = Parameters<Parameters<DbType["transaction"]>[0]>[0];

export const createRLSTransaction = async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie");

  const res = await fetch(
    `http://${env.YB_API_HOSTNAME}/api/user_management/claims`,
    {
      headers: {
        // Forward the cookies from the browser
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    },
  );

  const data = (await res.json()) as { claims: string };
  if (!res.ok) {
    throw new Error("Failed to create database connection.");
  }

  const stringClaims = data.claims;

  // Parse the JSON string to get the claims object
  const claimsObject =
    typeof stringClaims === "string" ? JSON.parse(stringClaims) : stringClaims;

  const claims = ClaimsSchema.parse(claimsObject);

  if (claims.org_id !== env.YB_ORGANIZATION_ID) {
    throw new Error("Unauthorized");
  }

  if (!claims) throw new Error("No claims provided.");

  const db = createDb();

  // Return a function that wraps queries in a transaction with RLS
  return async <T>(
    callback: (tx: TransactionType) => Promise<T>,
  ): Promise<T> => {
    return db.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`SELECT set_config('request.jwt.claims', ${stringClaims}, true)`,
      );
      return callback(tx);
    });
  };
};
