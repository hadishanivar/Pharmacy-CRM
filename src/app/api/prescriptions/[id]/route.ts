/** Prescription item API: update prescription status and handle dispensing side effects. */

import { db } from "@/db";
import {
  customers,
  medicines,
  prescriptionItems,
  prescriptions,
  saleItems,
  sales,
} from "@/db/schema";
import { tierFromPoints } from "@/lib/format";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const rxId = Number(id);
  const body = await request.json();
  const status = String(body?.status ?? "");

  const [existing] = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.id, rxId));
  if (!existing) {
    return Response.json({ error: "نسخه یافت نشد" }, { status: 404 });
  }

  // Keep the dispense side effects in one transaction so the invoice, stock, loyalty
  // points, and prescription status succeed or roll back together.
  if (status === "تحویل شده" && existing.status !== "تحویل شده") {
    const items = await db
      .select({
        medicineId: prescriptionItems.medicineId,
        quantity: prescriptionItems.quantity,
        unitPrice: prescriptionItems.unitPrice,
        name: medicines.name,
      })
      .from(prescriptionItems)
      .leftJoin(medicines, eq(medicines.id, prescriptionItems.medicineId))
      .where(eq(prescriptionItems.prescriptionId, rxId));

    const total = items.reduce(
      (acc, it) => acc + Number(it.unitPrice) * it.quantity,
      0,
    );
    const points = Math.round(total / 10000);

    await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          invoiceNo: `RX-${Date.now().toString().slice(-8)}`,
          customerId: existing.customerId,
          prescriptionId: rxId,
          totalAmount: String(Math.round(total)),
          discount: "0",
          finalAmount: String(Math.round(total)),
          paymentMethod: body.paymentMethod || "بیمه/کارتخوان",
          pointsEarned: points,
        })
        .returning();

      if (items.length) {
        await tx.insert(saleItems).values(
          items.map((it) => ({
            saleId: sale.id,
            medicineId: it.medicineId,
            medicineName: it.name ?? "—",
            quantity: it.quantity,
            unitPrice: String(it.unitPrice),
            lineTotal: String(Number(it.unitPrice) * it.quantity),
          })),
        );
        for (const it of items) {
          await tx
            .update(medicines)
            .set({ stock: sql`greatest(${medicines.stock} - ${it.quantity}, 0)` })
            .where(eq(medicines.id, it.medicineId));
        }
      }

      const [cust] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, existing.customerId));
      if (cust) {
        const newPoints = cust.loyaltyPoints + points;
        await tx
          .update(customers)
          .set({
            loyaltyPoints: newPoints,
            loyaltyTier: tierFromPoints(newPoints),
            totalSpent: String(Math.round(Number(cust.totalSpent) + total)),
            visitsCount: cust.visitsCount + 1,
            lastVisitAt: new Date(),
          })
          .where(eq(customers.id, cust.id));
      }

      await tx
        .update(prescriptions)
        .set({ status })
        .where(eq(prescriptions.id, rxId));
    });

    return Response.json({ ok: true, dispensed: true });
  }

  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if ("notes" in body) patch.notes = body.notes || null;
  if ("doctorName" in body) patch.doctorName = body.doctorName || null;

  const [row] = await db
    .update(prescriptions)
    .set(patch)
    .where(eq(prescriptions.id, rxId))
    .returning();
  return Response.json({ prescription: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(prescriptions).where(eq(prescriptions.id, Number(id)));
  return Response.json({ ok: true });
}
