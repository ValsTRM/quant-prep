import { attemptHistory } from "@/lib/server/queries";

/**
 * Paged answer history for the override UI.
 *   ?limit=25&offset=0&misses=1
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10) || 25));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const missesOnly = url.searchParams.get("misses") === "1";

  return Response.json({ ...attemptHistory({ limit, offset, missesOnly }), limit, offset });
}
