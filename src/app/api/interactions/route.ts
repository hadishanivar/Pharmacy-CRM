/** Follow-up/interactions collection API: list, filter, and create customer interactions. */

import { db } from "@/db";
import { customers, interactions } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { and, asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const scope = searchParams.get("scope") ?? "";

  const conditions = [];
  if (status) conditions.push(eq(interactions.status, status));
  if (scope === "today")
    conditions.push(sql`${interactions.dueDate} = current_date`);
  if (scope === "overdue")
    conditions.push(
      sql`${interactions.dueDate} < current_date and ${interactions.status} = 'باز'`,
    );

  const rows = await db
    .select({
      id: interactions.id,
      customerId: interactions.customerId,
      customerName: customers.fullName,
      customerPhone: customers.phone,
      type: interactions.type,
      subject: interactions.subject,
      message: interactions.message,
      dueDate: interactions.dueDate,
      status: interactions.status,
      assignedTo: interactions.assignedTo,
      createdAt: interactions.createdAt,
      completedAt: interactions.completedAt,
    })
    .from(interactions)
    .leftJoin(customers, eq(customers.id, interactions.customerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(interactions.status), asc(interactions.dueDate))
    .limit(200);

  return Response.json({ interactions: rows });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.customerId || !body?.subject) {
      return Response.json(
        { error: "انتخاب مشتری و عنوان پیگیری الزامی است" },
        { status: 400 },
      );
    }
    const [row] = await db
      .insert(interactions)
      .values({
        customerId: Number(body.customerId),
        type: body.type || "تماس",
        subject: String(body.subject),
        message: body.message || null,
        dueDate: body.dueDate || new Date().toISOString().slice(0, 10),
        status: body.status || "باز",
        assignedTo: body.assignedTo || "دکتر سارا رضایی",
      })
      .returning();
    return Response.json({ interaction: row }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت پیگیری ناموفق بود" }, { status: 500 });
  }
}
