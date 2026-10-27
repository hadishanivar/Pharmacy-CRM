/** Customer profile screen showing customer details and related activity. */

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  customers,
  interactions,
  medicines,
  prescriptionItems,
  prescriptions,
  saleItems,
  sales,
} from "@/db/schema";
import {
  Badge,
} from "@/components/shared/ui";
import { faDate, faDateTime, faNumber, initials, shortMoney, statusTone, tierTone, toman } from "@/lib/format";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isFinite(customerId)) notFound();

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId));
  if (!customer) notFound();

  const customerSales = await db
    .select()
    .from(sales)
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(sales.createdAt))
    .limit(15);

  const items = customerSales.length
    ? await db
        .select()
        .from(saleItems)
        .where(
          inArray(
            saleItems.saleId,
            customerSales.map((s) => s.id),
          ),
        )
    : [];

  const rxs = await db
    .select()
    .from(prescriptions)
    .where(eq(prescriptions.customerId, customerId))
    .orderBy(desc(prescriptions.createdAt));

  const rxItems = rxs.length
    ? await db
        .select({
          prescriptionId: prescriptionItems.prescriptionId,
          quantity: prescriptionItems.quantity,
          dosage: prescriptionItems.dosage,
          name: medicines.name,
        })
        .from(prescriptionItems)
        .leftJoin(medicines, eq(medicines.id, prescriptionItems.medicineId))
        .where(
          inArray(
            prescriptionItems.prescriptionId,
            rxs.map((r) => r.id),
          ),
        )
    : [];

  const follows = await db
    .select()
    .from(interactions)
    .where(eq(interactions.customerId, customerId))
    .orderBy(desc(interactions.createdAt));

  const infoRows: [string, string][] = [
    ["کد ملی", customer.nationalCode ?? "—"],
    ["جنسیت", customer.gender],
    ["تاریخ تولد", customer.birthDate ? faDate(customer.birthDate) : "—"],
    ["بیمه", `${customer.insurance} ${customer.insuranceNumber ? `(${customer.insuranceNumber})` : ""}`],
    ["آدرس", customer.address ?? "—"],
    ["عضویت از", faDate(customer.createdAt)],
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/customers"
        className="mb-4 inline-block text-xs font-bold text-slate-500 hover:text-teal-600"
      >
        → بازگشت به فهرست مشتریان
      </Link>

      <div className="card mb-4 flex flex-wrap items-center gap-5 p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xl font-extrabold text-white shadow-lg shadow-teal-500/25">
          {initials(customer.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800">
              {customer.fullName}
            </h1>
            <Badge tone={tierTone(customer.loyaltyTier)}>
              {customer.loyaltyTier}
            </Badge>
            {customer.smsOptIn ? <Badge tone="teal">عضو باشگاه پیامکی</Badge> : null}
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">{customer.phone}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sales"
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/20"
          >
            🧾 فروش جدید
          </Link>
          <Link
            href="/followups"
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
          >
            🔔 ثبت پیگیری
          </Link>
          <Link
            href="/prescriptions"
            className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
          >
            📄 ثبت نسخه
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "مجموع خرید", v: toman(customer.totalSpent), i: "💳" },
          { l: "تعداد خرید", v: faNumber(customer.visitsCount), i: "🛒" },
          { l: "امتیاز وفاداری", v: faNumber(customer.loyaltyPoints), i: "⭐" },
          {
            l: "آخرین مراجعه",
            v: customer.lastVisitAt ? faDate(customer.lastVisitAt) : "—",
            i: "📅",
          },
        ].map((s) => (
          <div key={s.l} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-lg">
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
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold text-slate-800">اطلاعات هویتی</h2>
          <dl className="flex flex-col gap-2.5">
            {infoRows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-3 text-xs">
                <dt className="shrink-0 text-slate-400">{k}</dt>
                <dd className="text-left font-bold text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 space-y-2.5">
            <div className="rounded-xl bg-indigo-50/70 p-3">
              <p className="text-[11px] font-bold text-indigo-500">بیماری‌های مزمن</p>
              <p className="mt-1 text-xs text-indigo-800">
                {customer.chronicConditions || "ثبت نشده"}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50/70 p-3">
              <p className="text-[11px] font-bold text-rose-500">⚠️ حساسیت دارویی</p>
              <p className="mt-1 text-xs text-rose-800">
                {customer.allergies || "ثبت نشده"}
              </p>
            </div>
            {customer.notes ? (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-bold text-slate-500">یادداشت داروساز</p>
                <p className="mt-1 text-xs text-slate-700">{customer.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-extrabold text-slate-800">
            نسخه‌های ثبت‌شده ({faNumber(rxs.length)})
          </h2>
          {rxs.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">نسخه‌ای ثبت نشده است</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rxs.map((rx) => (
                <div key={rx.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {rx.doctorName ?? "پزشک نامشخص"}
                        <span className="mr-2 font-normal text-slate-400">
                          {rx.doctorSpecialty}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {faDate(rx.issuedAt)} • بیمه {rx.insurance}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(rx.status)}>{rx.status}</Badge>
                      <span className="text-xs font-bold text-teal-700">
                        {shortMoney(rx.totalAmount)}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {rxItems
                      .filter((i) => i.prescriptionId === rx.id)
                      .map((i, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
                        >
                          {i.name} × {faNumber(i.quantity)}
                          {i.dosage ? (
                            <span className="text-slate-400"> — {i.dosage}</span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold text-slate-800">تاریخچه خرید</h2>
          {customerSales.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">خریدی ثبت نشده است</p>
          ) : (
            <div className="flex flex-col gap-3">
              {customerSales.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400">
                      {s.invoiceNo}
                    </span>
                    <span className="text-xs font-bold text-teal-700">
                      {toman(s.finalAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {faDateTime(s.createdAt)} • {s.paymentMethod} • {faNumber(s.pointsEarned)} امتیاز
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {items
                      .filter((i) => i.saleId === s.id)
                      .map((i) => (
                        <li
                          key={i.id}
                          className="rounded-lg bg-teal-50/70 px-2 py-0.5 text-[11px] text-teal-700"
                        >
                          {i.medicineName} × {faNumber(i.quantity)}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold text-slate-800">
            تعاملات و پیگیری‌ها
          </h2>
          {follows.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">
              تعاملی ثبت نشده است
            </p>
          ) : (
            <ol className="relative flex flex-col gap-4 border-r border-slate-200 pr-4">
              {follows.map((f) => (
                <li key={f.id} className="relative">
                  <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-700">{f.subject}</p>
                    <Badge tone={statusTone(f.status)}>{f.status}</Badge>
                    <Badge tone="slate">{f.type}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{f.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    سررسید {faDate(f.dueDate)} • مسئول: {f.assignedTo}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
