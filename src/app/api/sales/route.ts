/** Sales API: list recent sales and create a sale while updating inventory and loyalty points. */

import { db } from "@/db";
import { customers, medicines, saleItems, sales } from "@/db/schema";
import { tierFromPoints } from "@/lib/format";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const rows = await db
    .select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      customerId: sales.customerId,
      customerName: customers.fullName,
      totalAmount: sales.totalAmount,
      discount: sales.discount,
      finalAmount: sales.finalAmount,
      paymentMethod: sales.paymentMethod,
      pointsEarned: sales.pointsEarned,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .orderBy(desc(sales.createdAt))
    .limit(60);

  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? await db.select().from(saleItems).where(inArray(saleItems.saleId, ids))
    : [];

  return Response.json({ sales: rows, items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: { medicineId: number; quantity: number }[] = Array.isArray(
      body?.items,
    )
      ? body.items
      : [];
    if (!items.length) {
      return Response.json({ error: "سبد فروش خالی است" }, { status: 400 });
    }

    const medIds = items.map((i) => Number(i.medicineId));
    const meds = await db
      .select()
      .from(medicines)
      .where(inArray(medicines.id, medIds));
    const medMap = new Map(meds.map((m) => [m.id, m]));

    let total = 0;
    const lines = items.map((it) => {
      const med = medMap.get(Number(it.medicineId));
      const unit = Number(med?.price ?? 0);
      const qty = Number(it.quantity) || 1;
      total += unit * qty;
      return {
        medicineId: Number(it.medicineId),
        medicineName: med?.name ?? "—",
        quantity: qty,
        unitPrice: String(unit),
        lineTotal: String(unit * qty),
      };
    });

    const discount = Math.round(Number(body.discount) || 0);
    const finalAmount = Math.max(total - discount, 0);
    const points = Math.round(finalAmount / 10000);
    const customerId = body.customerId ? Number(body.customerId) : null;

    // Treat invoice creation, line items, inventory, and customer loyalty updates as
    // one unit of work to avoid partially saved sales.
    const saleId = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          invoiceNo: `INV-${Date.now().toString().slice(-8)}`,
          customerId,
          totalAmount: String(Math.round(total)),
          discount: String(discount),
          finalAmount: String(finalAmount),
          paymentMethod: body.paymentMethod || "کارتخوان",
          pointsEarned: customerId ? points : 0,
        })
        .returning();

      await tx
        .insert(saleItems)
        .values(lines.map((l) => ({ ...l, saleId: sale.id })));

      for (const l of lines) {
        await tx
          .update(medicines)
          .set({ stock: sql`greatest(${medicines.stock} - ${l.quantity}, 0)` })
          .where(eq(medicines.id, l.medicineId));
      }

      if (customerId) {
        const [cust] = await tx
          .select()
          .from(customers)
          .where(eq(customers.id, customerId));
        if (cust) {
          const newPoints = cust.loyaltyPoints + points;
          await tx
            .update(customers)
            .set({
              loyaltyPoints: newPoints,
              loyaltyTier: tierFromPoints(newPoints),
              totalSpent: String(
                Math.round(Number(cust.totalSpent) + finalAmount),
              ),
              visitsCount: cust.visitsCount + 1,
              lastVisitAt: new Date(),
            })
            .where(eq(customers.id, customerId));
        }
      }

      return sale.id;
    });

    return Response.json({ ok: true, saleId, finalAmount, points }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت فاکتور ناموفق بود" }, { status: 500 });
  }
}
