/** Campaign item API: update campaign metadata or mark a campaign as sent. */

import { db } from "@/db";
import { campaigns, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function audienceCondition(audience: string) {
  switch (audience) {
    case "مشتریان طلایی":
      return sql`${customers.loyaltyTier} = 'طلایی'`;
    case "مشتریان نقره‌ای":
      return sql`${customers.loyaltyTier} = 'نقره‌ای'`;
    case "بیماران مزمن":
      return sql`coalesce(${customers.chronicConditions}, '—') <> '—'`;
    case "بیماران دیابتی":
      return sql`coalesce(${customers.chronicConditions}, '') ilike '%دیابت%'`;
    case "مشتریان غیرفعال":
      return sql`(${customers.lastVisitAt} is null or ${customers.lastVisitAt} < now() - interval '45 days')`;
    default:
      return sql`true`;
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();
  const campaignId = Number(id);

  const [existing] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!existing) return Response.json({ error: "یافت نشد" }, { status: 404 });

  if (body.action === "send") {
    const res = await db
      .select({ c: sql<string>`count(*)::text` })
      .from(customers)
      .where(
        sql`${audienceCondition(existing.audience)} and ${customers.smsOptIn} = true`,
      );
    const sentCount = Number(res[0]?.c ?? 0);
    const [row] = await db
      .update(campaigns)
      .set({ status: "ارسال شده", sentCount })
      .where(eq(campaigns.id, campaignId))
      .returning();
    return Response.json({ campaign: row, sentCount });
  }

  const patch: Record<string, unknown> = {};
  for (const f of ["title", "channel", "audience", "message", "status"]) {
    if (f in body) patch[f] = body[f];
  }
  if ("scheduledFor" in body) patch.scheduledFor = body.scheduledFor || null;

  const [row] = await db
    .update(campaigns)
    .set(patch)
    .where(eq(campaigns.id, campaignId))
    .returning();
  return Response.json({ campaign: row });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(campaigns).where(eq(campaigns.id, Number(id)));
  return Response.json({ ok: true });
}
