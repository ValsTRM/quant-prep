import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { makeId } from "@/lib/rng";
import { localDay } from "@/lib/streak";

export async function GET() {
  const db = getDb();
  const logs = db
    .select()
    .from(schema.resourceLogs)
    .orderBy(desc(schema.resourceLogs.date), desc(schema.resourceLogs.createdAt))
    .all();
  return Response.json({ logs });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const row = {
    id: makeId("r"),
    resource: String(body.resource ?? "other"),
    section: String(body.section ?? ""),
    result: body.result ? String(body.result) : null,
    minutes: body.minutes ? Number(body.minutes) : null,
    errorTypes: Array.isArray(body.errorTypes) ? body.errorTypes.join(",") : null,
    notes: body.notes ? String(body.notes) : null,
    date: body.date ? String(body.date) : localDay(Date.now()),
    createdAt: Date.now(),
  };
  db.insert(schema.resourceLogs).values(row).run();
  return Response.json({ ok: true, id: row.id });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  getDb().delete(schema.resourceLogs).where(eq(schema.resourceLogs.id, id)).run();
  return Response.json({ ok: true });
}
