/** Customer collection API: search/filter customers and create customer records. */

import { db } from "@/db";
import { customers } from "@/db/schema";
import { tierFromPoints } from "@/lib/format";
import { ensureSeeded } from "@/lib/seed";
import { and, desc, eq, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tier = searchParams.get("tier") ?? "";

  const filters = [];
  if (q) {
    filters.push(
      or(
        sql`${customers.fullName} ilike ${"%" + q + "%"}`,
        sql`${customers.phone} ilike ${"%" + q + "%"}`,
        sql`coalesce(${customers.nationalCode}, '') ilike ${"%" + q + "%"}`,
      ),
    );
  }
  if (tier) filters.push(eq(customers.loyaltyTier, tier));

  const rows = await db
    .select()
    .from(customers)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(200);

  return Response.json({ customers: rows });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.fullName || !body?.phone) {
      return Response.json(
        { error: "نام و شماره موبایل الزامی است" },
        { status: 400 },
      );
    }
    const points = Number(body.loyaltyPoints ?? 0);
    const [row] = await db
      .insert(customers)
      .values({
        fullName: String(body.fullName),
        phone: String(body.phone),
        nationalCode: body.nationalCode || null,
        gender: body.gender || "زن",
        birthDate: body.birthDate || null,
        address: body.address || null,
        insurance: body.insurance || "آزاد",
        insuranceNumber: body.insuranceNumber || null,
        chronicConditions: body.chronicConditions || null,
        allergies: body.allergies || null,
        loyaltyPoints: points,
        loyaltyTier: tierFromPoints(points),
        smsOptIn: body.smsOptIn !== false,
        notes: body.notes || null,
      })
      .returning();
    return Response.json({ customer: row }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت مشتری ناموفق بود" }, { status: 500 });
  }
}
