/** Customer directory screen with search, filters, and customer creation. */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/shared/ui";
import { faDate, faNumber, initials, shortMoney, tierTone } from "@/lib/format";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  nationalCode: string | null;
  gender: string;
  birthDate: string | null;
  address: string | null;
  insurance: string;
  insuranceNumber: string | null;
  chronicConditions: string | null;
  allergies: string | null;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSpent: string;
  visitsCount: number;
  smsOptIn: boolean;
  notes: string | null;
  lastVisitAt: string | null;
};

const EMPTY = {
  fullName: "",
  phone: "",
  nationalCode: "",
  gender: "زن",
  birthDate: "",
  address: "",
  insurance: "آزاد",
  insuranceNumber: "",
  chronicConditions: "",
  allergies: "",
  notes: "",
  smsOptIn: true,
};

const INSURANCES = ["آزاد", "تأمین اجتماعی", "بیمه سلامت", "نیروهای مسلح", "بیمه تکمیلی"];

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tier) params.set("tier", tier);
    const res = await fetch(`/api/customers?${params.toString()}`);
    const data = await res.json();
    setRows(data.customers ?? []);
    setLoading(false);
  }, [q, tier]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const gold = rows.filter((r) => r.loyaltyTier === "طلایی").length;
    const spent = rows.reduce((a, r) => a + Number(r.totalSpent), 0);
    const sms = rows.filter((r) => r.smsOptIn).length;
    return { total, gold, spent, sms };
  }, [rows]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError("");
    setOpen(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      fullName: c.fullName,
      phone: c.phone,
      nationalCode: c.nationalCode ?? "",
      gender: c.gender,
      birthDate: c.birthDate ?? "",
      address: c.address ?? "",
      insurance: c.insurance,
      insuranceNumber: c.insuranceNumber ?? "",
      chronicConditions: c.chronicConditions ?? "",
      allergies: c.allergies ?? "",
      notes: c.notes ?? "",
      smsOptIn: c.smsOptIn,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!form.fullName.trim() || !form.phone.trim()) {
      setError("نام و شماره موبایل الزامی است");
      return;
    }
    setSaving(true);
    const res = await fetch(
      editing ? `/api/customers/${editing.id}` : "/api/customers",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "خطا در ذخیره اطلاعات");
      return;
    }
    setOpen(false);
    load();
  }

  async function remove(c: Customer) {
    if (!confirm(`حذف پرونده «${c.fullName}»؟ تمام سوابق مرتبط حذف می‌شود.`)) return;
    await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="پرونده مشتریان"
        subtitle="مدیریت اطلاعات بیماران، بیمه، سوابق دارویی و باشگاه وفاداری"
        action={<Button onClick={openNew}>＋ مشتری جدید</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "تعداد نتایج", v: faNumber(stats.total), i: "👥" },
          { l: "مشتریان طلایی", v: faNumber(stats.gold), i: "🏅" },
          { l: "مجموع خرید", v: `${shortMoney(stats.spent)} تومان`, i: "💳" },
          { l: "عضو باشگاه پیامکی", v: faNumber(stats.sms), i: "📩" },
        ].map((s) => (
          <div key={s.l} className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-lg">
              {s.i}
            </span>
            <div>
              <p className="text-[11px] text-slate-500">{s.l}</p>
              <p className="text-sm font-extrabold text-slate-800">{s.v}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجوی نام، موبایل یا کد ملی..."
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <div className="flex gap-2">
          {["", "طلایی", "نقره‌ای", "برنزی"].map((t) => (
            <button
              key={t || "all"}
              onClick={() => setTier(t)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                tier === t
                  ? "bg-teal-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t || "همه"}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">مشتری</th>
                <th className="px-4 py-3 font-bold">بیمه</th>
                <th className="px-4 py-3 font-bold">سوابق پزشکی</th>
                <th className="px-4 py-3 font-bold">سطح وفاداری</th>
                <th className="px-4 py-3 font-bold">مجموع خرید</th>
                <th className="px-4 py-3 font-bold">آخرین مراجعه</th>
                <th className="px-4 py-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-[11px] font-bold text-white">
                        {initials(c.fullName)}
                      </span>
                      <div>
                        <Link
                          href={`/customers/${c.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-teal-600"
                        >
                          {c.fullName}
                        </Link>
                        <p className="font-mono text-[11px] text-slate-400">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{c.insurance}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.chronicConditions && c.chronicConditions !== "—" ? (
                        <Badge tone="indigo">{c.chronicConditions}</Badge>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                      {c.allergies && c.allergies !== "—" ? (
                        <Badge tone="rose">حساسیت: {c.allergies}</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={tierTone(c.loyaltyTier)}>
                      {c.loyaltyTier} • {faNumber(c.loyaltyPoints)} امتیاز
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-teal-700">
                    {shortMoney(c.totalSpent)}
                    <span className="mr-1 font-normal text-slate-400">
                      ({faNumber(c.visitsCount)} خرید)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500">
                    {c.lastVisitAt ? faDate(c.lastVisitAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Link
                        href={`/customers/${c.id}`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                      >
                        پرونده
                      </Link>
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && (
          <div className="p-6">
            <EmptyState text="مشتری‌ای با این مشخصات پیدا نشد" />
          </div>
        )}
        {loading && (
          <p className="py-10 text-center text-sm text-slate-400">در حال بارگذاری…</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `ویرایش پرونده ${editing.fullName}` : "ثبت مشتری جدید"}
        wide
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="نام و نام خانوادگی *"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="شماره موبایل *"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="09xxxxxxxxx"
          />
          <Input
            label="کد ملی"
            value={form.nationalCode}
            onChange={(e) => setForm({ ...form, nationalCode: e.target.value })}
          />
          <Select
            label="جنسیت"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={[
              { value: "زن", label: "زن" },
              { value: "مرد", label: "مرد" },
            ]}
          />
          <Input
            label="تاریخ تولد (میلادی)"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          />
          <Select
            label="نوع بیمه"
            value={form.insurance}
            onChange={(e) => setForm({ ...form, insurance: e.target.value })}
            options={INSURANCES.map((i) => ({ value: i, label: i }))}
          />
          <Input
            label="شماره بیمه"
            value={form.insuranceNumber}
            onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
          />
          <Input
            label="بیماری‌های مزمن"
            value={form.chronicConditions}
            onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
            placeholder="دیابت، فشار خون..."
          />
          <Input
            label="حساسیت‌های دارویی"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="پنی‌سیلین..."
          />
          <Input
            label="آدرس"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="یادداشت داروساز"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="باشگاه مشتریان">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.smsOptIn}
                  onChange={(e) => setForm({ ...form, smsOptIn: e.target.checked })}
                  className="h-4 w-4 accent-teal-600"
                />
                دریافت پیامک‌های اطلاع‌رسانی و تخفیف
              </label>
            </Field>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "در حال ذخیره…" : editing ? "ذخیره تغییرات" : "ثبت مشتری"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
