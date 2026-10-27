/** Medicine item API: edit medicine data, adjust stock, or delete an unused medicine. */

import { db } from "@/db";
import { medicines } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();

  if (typeof body.addStock === "number") {
    const [row] = await db
      .update(medicines)
      .set({ stock: sql`${medicines.stock} + ${Math.round(body.addStock)}` })
      .where(eq(medicines.id, Number(id)))
      .returning();
    return Response.json({ medicine: row });
  }

  const patch: Record<string, unknown> = {};
  for (const f of ["name", "genericName", "category", "manufacturer", "form", "barcode", "expiryDate"]) {
    if (f in body) patch[f] = body[f] || null;
  }
  if ("price" in body) patch.price = String(Math.round(Number(body.price) || 0));
  if ("stock" in body) patch.stock = Number(body.stock) || 0;
  if ("reorderLevel" in body) patch.reorderLevel = Number(body.reorderLevel) || 0;
  if ("requiresPrescription" in body)
    patch.requiresPrescription = Boolean(body.requiresPrescription);

  const [row] = await db
    .update(medicines)
    .set(patch)
    .where(eq(medicines.id, Number(id)))
    .returning();
  return Response.json({ medicine: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    await db.delete(medicines).where(eq(medicines.id, Number(id)));
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "این دارو در فاکتورها استفاده شده و قابل حذف نیست" },
      { status: 400 },
    );
  }
}
