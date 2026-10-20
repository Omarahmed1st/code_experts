import { getBindings, getConfig } from "@/server/platform/env";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
};

/**
 * GET /api/health: confirms the Worker is up and can read D1.
 * Reports which migrations are applied and how many courses are published.
 * Error details go to the log, never to the response.
 */
export async function GET() {
  const { appEnv } = getConfig();
  try {
    const { db } = getBindings();
    const [migrations, published] = await db.batch<Record<string, unknown>>([
      db.prepare("SELECT name FROM d1_migrations ORDER BY id"),
      db.prepare("SELECT count(*) AS n FROM courses WHERE status = 'published'"),
    ]);
    return Response.json(
      {
        status: "ok",
        environment: appEnv,
        database: {
          reachable: true,
          migrations: (migrations?.results ?? []).map((row) => String(row.name)),
          publishedCourses: Number(published?.results[0]?.n ?? 0),
        },
      },
      { headers },
    );
  } catch (error) {
    console.error("health: database check failed", error);
    return Response.json(
      { status: "error", environment: appEnv, database: { reachable: false } },
      { status: 503, headers },
    );
  }
}
