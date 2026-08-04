import { listAutoBackups, writeAutoBackup } from "@/lib/server/autoBackup";

/** List automatic snapshots, newest first. */
export async function GET() {
  return Response.json({ backups: listAutoBackups() });
}

/** Take a snapshot now. The client fires this when a section/session completes. */
export async function POST(request: Request) {
  let label = "snapshot";
  try {
    const body = await request.json();
    if (typeof body?.label === "string") label = body.label;
  } catch {
    // no body → generic label
  }
  const result = writeAutoBackup(label);
  return Response.json({ ok: true, ...result });
}
