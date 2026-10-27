import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/** Drizzle Kit reads the same connection string used by the application. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/pharmacy_crm",
  },
});
