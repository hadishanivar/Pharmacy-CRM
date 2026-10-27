/** Follow-up item API: edit or delete an interaction. */

import { db } from "@/db";
import { interactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (body.status) {
    patch.status = String(body.status);
    patch.completedAt = body.status === "انجام شد" ? new Date() : null;
  }
  if ("subject" in body) patch.subject = body.subject;
  if ("message" in body) patch.message = body.message || null;
  if ("dueDate" in body) patch.dueDate = body.dueDate || null;

  const [row] = await db
    .update(interactions)
    .set(patch)
    .where(eq(interactions.id, Number(id)))
    .returning();
  return Response.json({ interaction: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(interactions).where(eq(interactions.id, Number(id)));
  return Response.json({ ok: true });
}
