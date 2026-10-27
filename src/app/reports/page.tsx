/** Reporting screen for operational and customer analytics. */

import Link from "next/link";
import { BarChart, Donut, HBars } from "@/components/dashboard/charts";
import {
  Badge,
} from "@/components/shared/ui";
import { faDate, faNumber, shortMoney, tierTone, toman } from "@/lib/format";
import { getReports } from "@/lib/services/queries";

export const dynamic = "force-dynamic";

const monthFmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" });

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-extrabold text-slate-800">{title}</h2>
      {children}
    </div>
  );
}

export default async function ReportsPage() {
  const r = await getReports();

  const monthly = r.monthly.map((m) => ({
    label: monthFmt.format(new Date(`${m.month}-02`)),
    value: Number(m.total),
  }));

  const totalRevenue = r.monthly.reduce((a, m) => a + Number(m.total), 0);
  const totalInvoices = r.monthly.reduce((a, m) => a + Number(m.cnt), 0);

  const tierColors: Record<string, string> = {
    طلایی: "#f59e0b",
    "نقره‌ای": "#6366f1",
    برنزی: "#94a3b8",
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">گزارش‌های تحلیلی</h1>
        <p className="mt-1 text-sm text-slate-500">
          تحلیل فروش، رفتار مشتریان و عملکرد دسته‌های دارویی
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "درآمد ۶ ماه اخیر", v: `${shortMoney(totalRevenue)} تومان`, i: "💰" },
          { l: "تعداد فاکتور", v: faNumber(totalInvoices), i: "🧾" },
          {
            l: "میانگین فاکتور",
            v: `${shortMoney(totalInvoices ? totalRevenue / totalInvoices : 0)} تومان`,
            i: "📊",
          },
          { l: "مشتریان کم‌تحرک", v: faNumber(r.inactive.length), i: "😴" },
        ].map((s) => (
          <div key={s.l} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-lg">
              {s.i}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">{s.l}</p>
              <p className="truncate text-sm font-extrabold text-slate-800">{s.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="درآمد ماهانه (۶ ماه گذشته)" className="lg:col-span-2">
          <BarChart data={monthly} />
        </Panel>
        <Panel title="ترکیب باشگاه مشتریان">
          <Donut
            segments={r.tiers.map((t) => ({
              label: t.loyalty_tier,
              value: Number(t.cnt),
              color: tierColors[t.loyalty_tier] ?? "#94a3b8",
            }))}
          />
          <ul className="mt-4 flex flex-col gap-2">
            {r.tiers.map((t) => (
              <li
                key={t.loyalty_tier}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px]"
              >
                <span className="text-slate-600">{t.loyalty_tier}</span>
                <b className="text-slate-800">{shortMoney(t.spent)} تومان</b>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="فروش بر اساس دسته دارویی">
          <HBars
            data={r.byCategory.slice(0, 8).map((c) => ({
              label: c.category,
              value: Number(c.revenue),
              sub: `${faNumber(c.qty)} عدد`,
            }))}
          />
        </Panel>
        <Panel title="توزیع بیمه مشتریان">
          <HBars
            data={r.byInsurance.map((i) => ({
              label: i.insurance,
              value: Number(i.spent),
              sub: `${faNumber(i.cnt)} نفر`,
            }))}
          />
        </Panel>
        <Panel title="روش‌های پرداخت">
          <HBars
            data={r.payments.map((p) => ({
              label: p.payment_method,
              value: Number(p.total),
              sub: `${faNumber(p.cnt)} فاکتور`,
            }))}
          />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="۱۲ قلم پرفروش">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-[11px] text-slate-400">
                <tr>
                  <th className="pb-2 font-bold">#</th>
                  <th className="pb-2 font-bold">دارو</th>
                  <th className="pb-2 font-bold">دسته</th>
                  <th className="pb-2 font-bold">تعداد</th>
                  <th className="pb-2 font-bold">درآمد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.topProducts.map((p, i) => (
                  <tr key={p.name} className="text-slate-600">
                    <td className="py-2.5 text-slate-400">{faNumber(i + 1)}</td>
                    <td className="py-2.5 font-bold text-slate-700">{p.name}</td>
                    <td className="py-2.5 text-[11px] text-slate-400">{p.category}</td>
                    <td className="py-2.5">{faNumber(p.qty)}</td>
                    <td className="py-2.5 font-bold text-teal-700">
                      {shortMoney(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="مشتریان برتر">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-[11px] text-slate-400">
                <tr>
                  <th className="pb-2 font-bold">مشتری</th>
                  <th className="pb-2 font-bold">سطح</th>
                  <th className="pb-2 font-bold">خرید</th>
                  <th className="pb-2 font-bold">مجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.topCustomers.map((c) => (
                  <tr key={c.id} className="text-slate-600">
                    <td className="py-2.5">
                      <Link
                        href={`/customers/${c.id}`}
                        className="font-bold text-slate-700 hover:text-teal-600"
                      >
                        {c.full_name}
                      </Link>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {c.phone}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Badge tone={tierTone(c.loyalty_tier)}>{c.loyalty_tier}</Badge>
                    </td>
                    <td className="py-2.5">{faNumber(c.visits_count)}</td>
                    <td className="py-2.5 font-bold text-teal-700">
                      {toman(c.total_spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="😴 مشتریان بدون خرید در ۳۰ روز اخیر — کاندید کمپین بازگشت">
          <div className="flex flex-wrap gap-3">
            {r.inactive.map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-2.5 transition hover:border-amber-200 hover:bg-amber-50/40"
              >
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-xs font-bold text-slate-700">{c.full_name}</p>
                  <p className="font-mono text-[11px] text-slate-400">{c.phone}</p>
                  <p className="text-[10px] text-slate-400">
                    آخرین خرید: {c.last_visit_at ? faDate(c.last_visit_at) : "بدون سابقه"}
                  </p>
                </div>
              </Link>
            ))}
            {r.inactive.length === 0 && (
              <p className="text-xs text-slate-400">همه مشتریان فعال هستند 🎉</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
