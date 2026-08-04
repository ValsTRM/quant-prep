/**
 * Ask the server to take an automatic snapshot. Fire-and-forget: backups must
 * never block or break the practice flow.
 */
export function requestAutoBackup(label: string): void {
  try {
    void fetch("/api/backup/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    }).catch(() => {});
  } catch {
    // ignore — snapshots are best-effort
  }
}
