import { defineConfig } from "drizzle-kit";

// Only needed if you want drizzle-kit migrations/studio; the app itself
// creates its tables automatically on first run.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./data/quant-prep.sqlite",
  },
});
