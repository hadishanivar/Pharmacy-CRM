/** Client-side inventory interactions: filters, medicine editing, and stock adjustments. */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
} from "@/components/shared/ui";
import { daysFromNow, faDate, faNumber, shortMoney, toman } from "@/lib/format";

type Medicine = {
  id: number;
  name: string;
  genericName: string | null;
  category: string;
  manufacturer: string | null;
  form: string;
  price: string;
  stock: number;
  reorderLevel: number;
  expiryDate: string | null;
  requiresPrescription: boolean;
  barcode: string | null;
};

const EMPTY = {
  name: "",
  genericName: "",
  category: "عمومی",
  manufacturer: "",
  form: "قرص",
  price: "0",
  stock: "0",
  reorderLevel: "20",
  expiryDate: "",
  barcode: "",
  requiresPrescription: false,
};

const FORMS = ["قرص", "کپسول", "شربت", "آمپول", "قطره", "پماد", "اسپری", "پودر", "بسته", "دستگاه"];

export default function MedicinesClient({
  initialFilter = "",
}: {
  initialFilter?: string;
}) {
  const [rows, setRows] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (filter) p.set("filter", filter);
    const res = await fetch(`/api/medicines?${p.toString()}`);
    const data = await res.json();
    setRows(data.medicines ?? []);
    if (data.categories?.length) setCategories(data.categories);
    setLoading(false);
  }, [q, category, filter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const stats = useMemo(() => {
    const value = rows.reduce((a, r) => a + Number(r.price) * r.stock, 0);
    const low = rows.filter((r) => r.stock <= r.reorderLevel).length;
    const rx = rows.filter((r) => r.requiresPrescription).length;
    return { value, low, rx, count: rows.length };
  }, [rows]);

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY });
    setError("");
    setOpen(true);
  }

  function openEdit(m: Medicine) {
    setEditing(m);
    setForm({
      name: m.name,
      genericName: m.genericName ?? "",
      category: m.category,
      manufacturer: m.manufacturer ?? "",
      form: m.form,
      price: String(m.price),
      stock: String(m.stock),
      reorderLevel: String(m.reorderLevel),
      expiryDate: m.expiryDate ?? "",
      barcode: m.barcode ?? "",
      requiresPrescription: m.requiresPrescription,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setError("نام دارو الزامی است");
      return;
    }
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      expiryDate: form.expiryDate || null,
    };
    const res = await fetch(
      editing ? `/api/medicines/${editing.id}` : "/api/medicines",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      setError("ذخیره‌سازی ناموفق بود");
      return;
    }
    setOpen(false);
    load();
  }

  async function restock(m: Medicine) {
    const input = prompt(`افزودن موجودی به «${m.name}» (تعداد):`, "50");
    if (!input) return;
    const addStock = Number(input);
    if (!Number.isFinite(addStock) || addStock === 0) return;
    await fetch(`/api/medicines/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addStock }),
    });
    load();
  }

  async function remove(m: Medicine) {
    if (!confirm(`حذف «${m.name}» از انبار؟`)) return;
    const res = await fetch(`/api/medicines/${m.id}`, { method: "DELETE" });
    if (!res.ok) alert("این قلم در فاکتورها استفاده شده و قابل حذف نیست.");
    load();
  }

  const FILTERS = [
    { v: "", l: "همه اقلام" },
    { v: "low", l: "رو به اتمام" },
    { v: "expiring", l: "نزدیک انقضا" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="انبار دارو"
        subtitle="مدیریت موجودی، قیمت، تاریخ انقضا و نقطه سفارش"
        action={<Button onClick={openNew}>＋ افزودن قلم جدید</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "تعداد اقلام", v: faNumber(stats.count), i: "💊" },
          { l: "ارزش موجودی", v: `${shortMoney(stats.value)} تومان`, i: "🏷️" },
          { l: "رو به اتمام", v: faNumber(stats.low), i: "⚠️" },
          { l: "نیازمند نسخه", v: faNumber(stats.rx), i: "📄" },
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
          placeholder="جستجوی نام دارو، نام ژنریک یا بارکد..."
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.v || "all"}
              onClick={() => setFilter(f.v)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                filter === f.v
                  ? "bg-teal-600 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-right text-sm">
            <thead className="bg-slate-50 text-[11px] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-bold">دارو</th>
                <th className="px-4 py-3 font-bold">دسته</th>
                <th className="px-4 py-3 font-bold">قیمت</th>
                <th className="px-4 py-3 font-bold">موجودی</th>
                <th className="px-4 py-3 font-bold">انقضا</th>
                <th className="px-4 py-3 font-bold">وضعیت</th>
                <th className="px-4 py-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((m) => {
                const low = m.stock <= m.reorderLevel;
                const days = daysFromNow(m.expiryDate);
                return (
                  <tr key={m.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {m.genericName} • {m.manufacturer} • {m.form}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{m.category}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">
                      {toman(m.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              low ? "bg-rose-500" : "bg-teal-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (m.stock / Math.max(m.reorderLevel * 3, 1)) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            low ? "text-rose-600" : "text-slate-700"
                          }`}
                        >
                          {faNumber(m.stock)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500">
                      {faDate(m.expiryDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {low ? <Badge tone="rose">کمبود موجودی</Badge> : null}
                        {days !== null && days < 180 ? (
                          <Badge tone="amber">نزدیک انقضا</Badge>
                        ) : null}
                        {m.requiresPrescription ? (
                          <Badge tone="indigo">نسخه‌ای</Badge>
                        ) : (
                          <Badge tone="teal">OTC</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => restock(m)}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          شارژ
                        </button>
                        <button
                          onClick={() => openEdit(m)}
                          className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-[11px] font-bold text-teal-700 hover:bg-teal-100"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => remove(m)}
                          className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 && (
          <div className="p-6">
            <EmptyState text="قلمی با این مشخصات یافت نشد" />
          </div>
        )}
        {loading && (
          <p className="py-10 text-center text-sm text-slate-400">در حال بارگذاری…</p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `ویرایش ${editing.name}` : "افزودن قلم دارویی"}
        wide
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="نام تجاری *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="نام ژنریک"
            value={form.genericName}
            onChange={(e) => setForm({ ...form, genericName: e.target.value })}
          />
          <Input
            label="دسته‌بندی"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <Input
            label="شرکت سازنده"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
          <Select
            label="شکل دارویی"
            value={form.form}
            onChange={(e) => setForm({ ...form, form: e.target.value })}
            options={FORMS.map((f) => ({ value: f, label: f }))}
          />
          <Input
            label="قیمت (تومان)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            label="موجودی"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <Input
            label="نقطه سفارش مجدد"
            type="number"
            value={form.reorderLevel}
            onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
          />
          <Input
            label="تاریخ انقضا"
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
          <Input
            label="بارکد"
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.requiresPrescription}
              onChange={(e) =>
                setForm({ ...form, requiresPrescription: e.target.checked })
              }
              className="h-4 w-4 accent-teal-600"
            />
            فروش این قلم نیازمند نسخه پزشک است
          </label>
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
          <Button onClick={save}>{editing ? "ذخیره تغییرات" : "افزودن"}</Button>
        </div>
      </Modal>
    </div>
  );
}
