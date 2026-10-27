/** Prescription collection API: list prescriptions with customer and item details, and create prescriptions. */

import { db } from "@/db";
import { customers, medicines, prescriptionItems, prescriptions } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const q = (searchParams.get("q") ?? "").trim();

  const conditions = [];
  if (status) conditions.push(eq(prescriptions.status, status));
  if (q) conditions.push(sql`${customers.fullName} ilike ${"%" + q + "%"}`);

  const rows = await db
    .select({
      id: prescriptions.id,
      customerId: prescriptions.customerId,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      doctorName: prescriptions.doctorName,
      doctorSpecialty: prescriptions.doctorSpecialty,
      insurance: prescriptions.insurance,
      status: prescriptions.status,
      notes: prescriptions.notes,
      totalAmount: prescriptions.totalAmount,
      issuedAt: prescriptions.issuedAt,
      createdAt: prescriptions.createdAt,
    })
    .from(prescriptions)
    .leftJoin(customers, eq(customers.id, prescriptions.customerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(prescriptions.createdAt))
    .limit(200);

  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? await db
        .select({
          id: prescriptionItems.id,
          prescriptionId: prescriptionItems.prescriptionId,
          medicineId: prescriptionItems.medicineId,
          quantity: prescriptionItems.quantity,
          dosage: prescriptionItems.dosage,
          unitPrice: prescriptionItems.unitPrice,
          medicineName: medicines.name,
        })
        .from(prescriptionItems)
        .leftJoin(medicines, eq(medicines.id, prescriptionItems.medicineId))
        .where(inArray(prescriptionItems.prescriptionId, ids))
    : [];

  return Response.json({ prescriptions: rows, items });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerId = Number(body?.customerId);
    const items: { medicineId: number; quantity: number; dosage?: string }[] =
      Array.isArray(body?.items) ? body.items : [];

    if (!customerId || items.length === 0) {
      return Response.json(
        { error: "انتخاب مشتری و حداقل یک قلم دارو الزامی است" },
        { status: 400 },
      );
    }

    const medIds = items.map((i) => Number(i.medicineId));
    const meds = await db
      .select()
      .from(medicines)
      .where(inArray(medicines.id, medIds));
    const priceMap = new Map(meds.map((m) => [m.id, Number(m.price)]));

    let total = 0;
    for (const it of items) {
      total += (priceMap.get(Number(it.medicineId)) ?? 0) * (Number(it.quantity) || 1);
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    const [rx] = await db
      .insert(prescriptions)
      .values({
        customerId,
        doctorName: body.doctorName || null,
        doctorSpecialty: body.doctorSpecialty || null,
        insurance: body.insurance || customer?.insurance || "آزاد",
        status: body.status || "در انتظار",
        notes: body.notes || null,
        totalAmount: String(Math.round(total)),
        issuedAt: body.issuedAt || new Date().toISOString().slice(0, 10),
      })
      .returning();

    await db.insert(prescriptionItems).values(
      items.map((it) => ({
        prescriptionId: rx.id,
        medicineId: Number(it.medicineId),
        quantity: Number(it.quantity) || 1,
        dosage: it.dosage || null,
        unitPrice: String(priceMap.get(Number(it.medicineId)) ?? 0),
      })),
    );

    return Response.json({ prescription: rx }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت نسخه ناموفق بود" }, { status: 500 });
  }
}
