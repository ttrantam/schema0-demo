import { PGlite } from "@electric-sql/pglite";
import * as schema from "@template/db/schema";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { join } from "path";

export const client = new PGlite();
export const db = drizzle({
  client,
  schema,
});

// Initialize the database schema (create tables)
export async function initializeTestDatabase() {
  await client.waitReady;
  await migrate(db, {
    migrationsFolder: join(__dirname, "drizzle"),
  });
}
