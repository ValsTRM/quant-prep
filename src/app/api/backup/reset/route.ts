import { getSqlite } from "@/lib/db";
import { writeAutoBackup } from "@/lib/server/autoBackup";

/** Wipe all data. Takes a pre-reset snapshot first; the UI double-confirms. */
export async function POST() {
  const snapshot = writeAutoBackup("pre-reset");
  getSqlite().exec(
    "DELETE FROM attempts; DELETE FROM sessions; DELETE FROM resource_logs; DELETE FROM app_state;"
  );
  return Response.json({ ok: true, preResetBackup: snapshot.file });
}
