/** Medicine collection API: search inventory and create medicine records. */

import { db } from "@/db";
import { medicines } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { and, asc, eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category") ?? "";
  const filter = searchParams.get("filter") ?? "";

  const conditions = [];
  if (q) {
    conditions.push(
      or(
        sql`${medicines.name} ilike ${"%" + q + "%"}`,
        sql`coalesce(${medicines.genericName}, '') ilike ${"%" + q + "%"}`,
        sql`coalesce(${medicines.barcode}, '') ilike ${"%" + q + "%"}`,
      ),
    );
  }
  if (category) conditions.push(eq(medicines.category, category));
  if (filter === "low") conditions.push(sql`${medicines.stock} <= ${medicines.reorderLevel}`);
  if (filter === "expiring")
    conditions.push(sql`${medicines.expiryDate} <= current_date + interval '180 days'`);

  const rows = await db
    .select()
    .from(medicines)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(medicines.name))
    .limit(400);

  const cats = await db
    .selectDistinct({ category: medicines.category })
    .from(medicines)
    .orderBy(asc(medicines.category));

  return Response.json({ medicines: rows, categories: cats.map((c) => c.category) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return Response.json({ error: "نام دارو الزامی است" }, { status: 400 });
    }
    const [row] = await db
      .insert(medicines)
      .values({
        name: String(body.name),
        genericName: body.genericName || null,
        category: body.category || "عمومی",
        manufacturer: body.manufacturer || null,
        form: body.form || "قرص",
        price: String(Math.round(Number(body.price) || 0)),
        stock: Number(body.stock) || 0,
        reorderLevel: Number(body.reorderLevel) || 20,
        expiryDate: body.expiryDate || null,
        requiresPrescription: Boolean(body.requiresPrescription),
        barcode: body.barcode || null,
      })
      .returning();
    return Response.json({ medicine: row }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت دارو ناموفق بود" }, { status: 500 });
  }
}
