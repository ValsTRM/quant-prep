import { restoreFromPayload, writeAutoBackup } from "@/lib/server/autoBackup";

/** Restore from an uploaded JSON backup. Replaces ALL current data. */
export async function POST(request: Request) {
  let payload: Parameters<typeof restoreFromPayload>[0];
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Safety net: snapshot the current state before overwriting it.
  writeAutoBackup("pre-import");

  const result = restoreFromPayload(payload);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true, imported: result.imported });
}
