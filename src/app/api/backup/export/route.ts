import { buildExportPayload } from "@/lib/server/autoBackup";
import { localDay } from "@/lib/streak";

/** Full JSON backup of everything in the SQLite database. */
export async function GET() {
  const payload = buildExportPayload();
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="quant-prep-backup-${localDay(Date.now())}.json"`,
    },
  });
}
