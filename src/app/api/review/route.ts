import { reviewQueue } from "@/lib/server/queries";

/** Missed questions awaiting a correct re-attempt. */
export async function GET() {
  return Response.json({ queue: reviewQueue(50) });
}
