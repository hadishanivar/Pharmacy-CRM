/** Development/demo-data endpoint. Protect or disable this endpoint before public production deployment. */

import { runSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runSeed();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
