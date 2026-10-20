import { defineConfig } from "drizzle-kit";

// Used only to render the Drizzle schema as SQL for the mirror test
// (`npm run db:mirror`). Real migrations are hand-written in migrations/ and
// applied with Wrangler; never point `out` at migrations/.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/index.ts",
  out: "./.drizzle-mirror",
});
