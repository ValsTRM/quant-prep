import {
  readAutoBackup,
  restoreFromPayload,
  writeAutoBackup,
} from "@/lib/server/autoBackup";

/** Restore an automatic snapshot by filename. Replaces ALL current data. */
export async function POST(request: Request) {
  let file: string | undefined;
  try {
    const body = await request.json();
    file = body?.file;
  } catch {
    // handled below
  }
  if (!file) return Response.json({ error: "file required" }, { status: 400 });

  const payload = readAutoBackup(file);
  if (!payload) return Response.json({ error: "Unknown backup file" }, { status: 404 });

  // Safety net: snapshot the current state before overwriting it.
  writeAutoBackup("pre-restore");

  const result = restoreFromPayload(payload);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true, imported: result.imported, restoredFrom: file });
}
