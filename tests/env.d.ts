import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
      MIRROR_DB: D1Database;
      MIRROR_MIGRATIONS: D1Migration[];
      SEED: D1Migration[];
    }
  }
}
