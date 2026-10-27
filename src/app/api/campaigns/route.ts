/** Campaign collection API: list campaigns, calculate audience sizes, and create campaigns. */

import { db } from "@/db";
import { campaigns, customers } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { desc, eq, sql, type SQL } from "drizzle-orm";

export const dynamic = "force-dynamic";

const AUDIENCE_SQL: Record<string, SQL | null> = {
  "همه مشتریان": null,
  "مشتریان طلایی": sql`${customers.loyaltyTier} = 'طلایی'`,
  "مشتریان نقره‌ای": sql`${customers.loyaltyTier} = 'نقره‌ای'`,
  "بیماران مزمن": sql`coalesce(${customers.chronicConditions}, '—') <> '—'`,
  "بیماران دیابتی": sql`coalesce(${customers.chronicConditions}, '') ilike '%دیابت%'`,
  "مشتریان غیرفعال": sql`${customers.lastVisitAt} is null or ${customers.lastVisitAt} < now() - interval '45 days'`,
};

const AUDIENCES = Object.keys(AUDIENCE_SQL);

export async function GET() {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

  const audienceCounts: Record<string, number> = {};
  for (const name of Object.keys(AUDIENCE_SQL)) {
    const cond = AUDIENCE_SQL[name];
    const res = await db
      .select({ c: sql<string>`count(*)::text` })
      .from(customers)
      .where(
        cond
          ? sql`${cond} and ${customers.smsOptIn} = true`
          : eq(customers.smsOptIn, true),
      );
    audienceCounts[name] = Number(res[0]?.c ?? 0);
  }

  return Response.json({ campaigns: rows, audiences: AUDIENCES, audienceCounts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.message) {
      return Response.json({ error: "عنوان و متن پیام الزامی است" }, { status: 400 });
    }
    const [row] = await db
      .insert(campaigns)
      .values({
        title: String(body.title),
        channel: body.channel || "پیامک",
        audience: body.audience || "همه مشتریان",
        message: String(body.message),
        status: body.status || "پیش‌نویس",
        scheduledFor: body.scheduledFor || null,
      })
      .returning();
    return Response.json({ campaign: row }, { status: 201 });
  } catch {
    return Response.json({ error: "ثبت کمپین ناموفق بود" }, { status: 500 });
  }
}
