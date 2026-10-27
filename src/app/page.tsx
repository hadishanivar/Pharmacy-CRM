/** Dashboard route: summarizes business activity and key performance indicators. */

import Link from "next/link";
import { BarChart, Donut, HBars } from "@/components/dashboard/charts";
import { Badge } from "@/components/shared/ui";
import { faDate, faNumber, relativeDays, shortMoney, toman } from "@/lib/format";
import { getDashboard } from "@/lib/services/queries";

export const dynamic = "force-dynamic";

const WEEK = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function Kpi({
  title,
  value,
  sub,
  icon,
  tone,
  href,
}: {
  title: string;
  value: string;
  sub: string;
  icon: string;
  tone: string;
  href: string;
}) {
  return (
    <Link href={href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-800">{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${tone}`}>
          {icon}
        </span>
      </div>
    </Link>
  );
}

function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-800">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const d = await getDashboard();
  const kpi = d.kpi;

  const chartData = d.series.map((s) => {
    const date = new Date(s.day);
    return {
      label: WEEK[(date.getDay() + 1) % 7],
      value: Number(s.total),
    };
  });

  const statusColors: Record<string, string> = {
    "در انتظار": "#f59e0b",
    آماده: "#6366f1",
    "تحویل شده": "#10b981",
    "لغو شده": "#f43f5e",
  };
  const donut = d.rxStatus.map((r) => ({
    label: r.status,
    value: Number(r.cnt),
    color: statusColors[r.status] ?? "#94a3b8",
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            سلام دکتر رضایی 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {faDate(new Date())} — خلاصه عملکرد داروخانه مهر
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sales"
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700"
          >
            🧾 فروش جدید
          </Link>
          <Link
            href="/customers"
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            ＋ مشتری جدید
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          title="فروش امروز"
          value={toman(kpi?.today_sales)}
          sub={`${faNumber(kpi?.today_invoices)} فاکتور ثبت شده`}
          icon="💰"
          tone="bg-teal-50 text-teal-600"
          href="/sales"
        />
        <Kpi
          title="مشتریان ثبت‌شده"
          value={faNumber(kpi?.total_customers)}
          sub={`${faNumber(kpi?.new_customers)} مشتری جدید این ماه`}
          icon="👥"
          tone="bg-indigo-50 text-indigo-600"
          href="/customers"
        />
        <Kpi
          title="نسخه‌های در انتظار"
          value={faNumber(kpi?.pending_rx)}
          sub="نیازمند آماده‌سازی و تحویل"
          icon="📄"
          tone="bg-amber-50 text-amber-600"
          href="/prescriptions"
        />
        <Kpi
          title="اقلام رو به اتمام"
          value={faNumber(kpi?.low_stock)}
          sub={`${faNumber(kpi?.expiring)} قلم نزدیک به انقضا`}
          icon="⚠️"
          tone="bg-rose-50 text-rose-600"
          href="/medicines?filter=low"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="روند فروش ۱۴ روز اخیر"
          className="lg:col-span-2"
          action={
            <div className="flex gap-4 text-[11px]">
              <span className="text-slate-500">
                فروش ماه:{" "}
                <b className="text-slate-700">{shortMoney(kpi?.month_sales)} تومان</b>
              </span>
              <span className="text-slate-500">
                میانگین سبد:{" "}
                <b className="text-slate-700">{shortMoney(kpi?.avg_basket)} تومان</b>
              </span>
            </div>
          }
        >
          <BarChart data={chartData} />
        </Section>

        <Section title="وضعیت نسخه‌ها">
          <Donut segments={donut} />
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
            ارزش موجودی انبار:{" "}
            <b className="text-slate-700">{toman(kpi?.inventory_value)}</b>
          </div>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="پیگیری‌های امروز"
          action={
            <Link href="/followups" className="text-[11px] font-bold text-teal-600">
              همه →
            </Link>
          }
        >
          <ul className="flex flex-col gap-2.5">
            {d.followups.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">
                پیگیری بازی وجود ندارد
              </li>
            )}
            {d.followups.map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white/70 p-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-sm">
                  🔔
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">
                    {f.subject}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {f.full_name} • {f.phone}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-400">
                  {relativeDays(f.due_date)}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="هشدار موجودی"
          action={
            <Link
              href="/medicines?filter=low"
              className="text-[11px] font-bold text-teal-600"
            >
              انبار →
            </Link>
          }
        >
          <ul className="flex flex-col gap-2.5">
            {d.lowStock.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-sm">
                  💊
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.category}</p>
                </div>
                <Badge tone={Number(m.stock) === 0 ? "rose" : "amber"}>
                  {faNumber(m.stock)} عدد
                </Badge>
              </li>
            ))}
            {d.lowStock.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">
                موجودی همه اقلام کافی است
              </li>
            )}
          </ul>
        </Section>

        <Section title="نزدیک به انقضا">
          <ul className="flex flex-col gap-2.5">
            {d.expiring.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-sm">
                  ⏳
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-700">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{faDate(m.expiry_date)}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600">
                  {relativeDays(m.expiry_date)}
                </span>
              </li>
            ))}
            {d.expiring.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">
                موردی نزدیک انقضا نیست
              </li>
            )}
          </ul>
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="پرفروش‌ترین اقلام">
          <HBars
            data={d.topMedicines.map((m) => ({
              label: m.name,
              value: Number(m.revenue),
              sub: `${faNumber(m.qty)} عدد`,
            }))}
          />
        </Section>

        <Section title="فروش به تفکیک دسته">
          <HBars
            data={d.categories.map((c) => ({
              label: c.category,
              value: Number(c.revenue),
            }))}
          />
        </Section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="مشتریان برتر"
          className="lg:col-span-1"
          action={
            <Link href="/customers" className="text-[11px] font-bold text-teal-600">
              همه →
            </Link>
          }
        >
          <ul className="flex flex-col gap-3">
            {d.topCustomers.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-500">
                  {faNumber(i + 1)}
                </span>
                <Link
                  href={`/customers/${c.id}`}
                  className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700 hover:text-teal-600"
                >
                  {c.full_name}
                </Link>
                <span className="shrink-0 text-[11px] text-slate-500">
                  {shortMoney(c.total_spent)}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="آخرین فاکتورها"
          className="lg:col-span-2"
          action={
            <Link href="/sales" className="text-[11px] font-bold text-teal-600">
              صندوق →
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-[11px] text-slate-400">
                  <th className="pb-2 font-bold">شماره فاکتور</th>
                  <th className="pb-2 font-bold">مشتری</th>
                  <th className="pb-2 font-bold">پرداخت</th>
                  <th className="pb-2 font-bold">مبلغ</th>
                  <th className="pb-2 font-bold">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.recentSales.map((s) => (
                  <tr key={s.id} className="text-slate-600">
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">
                      {s.invoice_no}
                    </td>
                    <td className="py-2.5 font-bold text-slate-700">
                      {s.full_name ?? "مهمان"}
                    </td>
                    <td className="py-2.5">
                      <Badge tone="slate">{s.payment_method}</Badge>
                    </td>
                    <td className="py-2.5 font-bold text-teal-700">
                      {shortMoney(s.final_amount)}
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-400">
                      {faDate(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {d.birthdays.length > 0 && (
        <div className="mt-4">
          <Section title="🎂 تولدهای این ماه (فرصت ارسال کد تخفیف)">
            <div className="flex flex-wrap gap-3">
              {d.birthdays.map((b) => (
                <Link
                  key={b.id}
                  href={`/customers/${b.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/70 px-4 py-2.5 transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <span className="text-lg">🎁</span>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{b.full_name}</p>
                    <p className="text-[11px] text-slate-400">{faDate(b.birth_date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
