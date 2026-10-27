/** Customer detail API: return a customer and their related CRM activity. */

import { db } from "@/db";
import { customers, interactions, prescriptions, saleItems, sales } from "@/db/schema";
import { tierFromPoints } from "@/lib/format";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const customerId = Number(id);
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId));
  if (!customer) {
    return Response.json({ error: "مشتری یافت نشد" }, { status: 404 });
  }

  const customerSales = await db
    .select()
    .from(sales)
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(sales.createdAt))
    .limit(20);

  const items = customerSales.length
    ? await db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, customerSales[0].id))
    : [];

  const rxs = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.customerId, customerId))
    .orderBy(desc(prescriptions.createdAt));

  const follows = await db
    .select()
    .from(interactions)
    .where(eq(interactions.customerId, customerId))
    .orderBy(desc(interactions.createdAt));

  return Response.json({
    customer,
    sales: customerSales,
    lastSaleItems: items,
    prescriptions: rxs,
    interactions: follows,
  });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  const fields = [
    "fullName",
    "phone",
    "nationalCode",
    "gender",
    "birthDate",
    "address",
    "insurance",
    "insuranceNumber",
    "chronicConditions",
    "allergies",
    "notes",
  ];
  for (const f of fields) {
    if (f in body) patch[f] = body[f] || null;
  }
  if ("smsOptIn" in body) patch.smsOptIn = Boolean(body.smsOptIn);
  if ("loyaltyPoints" in body) {
    const pts = Number(body.loyaltyPoints) || 0;
    patch.loyaltyPoints = pts;
    patch.loyaltyTier = tierFromPoints(pts);
  }

  const [row] = await db
    .update(customers)
    .set(patch)
    .where(eq(customers.id, Number(id)))
    .returning();
  return Response.json({ customer: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(customers).where(eq(customers.id, Number(id)));
  return Response.json({ ok: true });
}
