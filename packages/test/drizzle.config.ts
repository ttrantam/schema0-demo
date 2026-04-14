import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../db/src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
