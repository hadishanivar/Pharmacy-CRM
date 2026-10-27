/** Point-of-sale screen for recording sales and updating inventory. */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Modal, PageHeader } from "@/components/shared/ui";
import { faDateTime, faNumber, shortMoney, toman } from "@/lib/format";

type Medicine = {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  requiresPrescription: boolean;
  form: string;
};

type Customer = { id: number; fullName: string; phone: string; loyaltyPoints: number };

type SaleRow = {
  id: number;
  invoiceNo: string;
  customerName: string | null;
  finalAmount: string;
  discount: string;
  paymentMethod: string;
  pointsEarned: number;
  createdAt: string;
};

type SaleItem = {
  id: number;
  saleId: number;
  medicineName: string;
  quantity: number;
  lineTotal: string;
};

type CartLine = { id: number; name: string; price: number; qty: number; stock: number };

const PAYMENTS = ["کارتخوان", "نقدی", "آنلاین", "اعتباری"];

export default function SalesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [payment, setPayment] = useState(PAYMENTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{
    invoice: string;
    amount: number;
    points: number;
  } | null>(null);

  const loadSales = useCallback(async () => {
    const res = await fetch("/api/sales");
    const data = await res.json();
    setSales(data.sales ?? []);
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    fetch("/api/medicines")
      .then((r) => r.json())
      .then((d) => setMedicines(d.medicines ?? []));
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
    loadSales();
  }, [loadSales]);

  const filtered = useMemo(() => {
    const term = q.trim();
    const list = term
      ? medicines.filter(
          (m) => m.name.includes(term) || (m.category ?? "").includes(term),
        )
      : medicines;
    return list.slice(0, 24);
  }, [medicines, q]);

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discountNum = Math.max(0, Math.min(Number(discount) || 0, total));
  const finalAmount = total - discountNum;
  const points = Math.round(finalAmount / 10000);
  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  function add(m: Medicine) {
    setCart((prev) => {
      const found = prev.find((c) => c.id === m.id);
      if (found) {
        return prev.map((c) =>
          c.id === m.id ? { ...c, qty: Math.min(c.qty + 1, Math.max(m.stock, 1)) } : c,
        );
      }
      return [
        ...prev,
        { id: m.id, name: m.name, price: Number(m.price), qty: 1, stock: m.stock },
      ];
    });
  }

  function setQty(id: number, qty: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: Math.max(0, qty) } : c))
        .filter((c) => c.qty > 0),
    );
  }

  async function checkout() {
    if (!cart.length) return;
    setSubmitting(true);
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || null,
        discount: discountNum,
        paymentMethod: payment,
        items: cart.map((c) => ({ medicineId: c.id, quantity: c.qty })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      alert("ثبت فاکتور ناموفق بود");
      return;
    }
    const data = await res.json();
    setReceipt({
      invoice: `#${faNumber(data.saleId)}`,
      amount: data.finalAmount,
      points: data.points,
    });
    setCart([]);
    setDiscount("0");
    setCustomerId("");
    loadSales();
    fetch("/api/medicines")
      .then((r) => r.json())
      .then((d) => setMedicines(d.medicines ?? []));
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="صندوق فروش"
        subtitle="ثبت سریع فاکتور، کسر خودکار موجودی و محاسبه امتیاز باشگاه مشتریان"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card mb-4 p-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 جستجوی دارو برای افزودن به سبد..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => add(m)}
                disabled={m.stock === 0}
                className="card group p-4 text-right transition hover:-translate-y-0.5 hover:ring-2 hover:ring-teal-300 disabled:opacity-40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg">💊</span>
                  {m.requiresPrescription ? (
                    <Badge tone="indigo">نسخه‌ای</Badge>
                  ) : (
                    <Badge tone="teal">OTC</Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-bold text-slate-800">
                  {m.name}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{m.category}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-700">
                    {shortMoney(m.price)}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      m.stock === 0 ? "text-rose-500" : "text-slate-400"
                    }`}
                  >
                    موجودی {faNumber(m.stock)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold text-slate-800">
              🛒 سبد فروش ({faNumber(cart.length)})
            </h2>

            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">مشتری مهمان (بدون امتیاز)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — {c.phone}
                </option>
              ))}
            </select>

            {selectedCustomer ? (
              <p className="mb-3 rounded-xl bg-teal-50 px-3 py-2 text-[11px] text-teal-700">
                امتیاز فعلی: {faNumber(selectedCustomer.loyaltyPoints)} ⭐
              </p>
            ) : null}

            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {cart.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">
                  برای شروع، دارو را از فهرست انتخاب کنید
                </p>
              )}
              {cart.map((c) => (
                <div key={c.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-700">{c.name}</p>
                    <button
                      onClick={() => setQty(c.id, 0)}
                      className="text-[11px] font-bold text-rose-500"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(c.id, c.qty - 1)}
                        className="h-6 w-6 rounded-lg bg-white text-slate-600 ring-1 ring-slate-200"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-bold">
                        {faNumber(c.qty)}
                      </span>
                      <button
                        onClick={() => setQty(c.id, c.qty + 1)}
                        className="h-6 w-6 rounded-lg bg-white text-slate-600 ring-1 ring-slate-200"
                      >
                        ＋
                      </button>
                    </div>
                    <span className="text-xs font-bold text-teal-700">
                      {toman(c.price * c.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">جمع کل</span>
                <b className="text-slate-800">{toman(total)}</b>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">تخفیف (تومان)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-left text-xs"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">روش پرداخت</span>
                <select
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  {PAYMENTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
                <span className="font-bold text-slate-700">مبلغ قابل پرداخت</span>
                <b className="text-base text-teal-700">{toman(finalAmount)}</b>
              </div>
              {customerId ? (
                <p className="text-[11px] text-amber-600">
                  ⭐ {faNumber(points)} امتیاز به مشتری اضافه می‌شود
                </p>
              ) : null}
            </div>

            <Button
              className="mt-4 w-full"
              onClick={checkout}
              disabled={!cart.length || submitting}
            >
              {submitting ? "در حال ثبت…" : "ثبت فاکتور و تسویه"}
            </Button>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-800">آخرین فاکتورها</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead className="text-[11px] text-slate-400">
              <tr>
                <th className="pb-3 font-bold">فاکتور</th>
                <th className="pb-3 font-bold">مشتری</th>
                <th className="pb-3 font-bold">اقلام</th>
                <th className="pb-3 font-bold">تخفیف</th>
                <th className="pb-3 font-bold">مبلغ</th>
                <th className="pb-3 font-bold">پرداخت</th>
                <th className="pb-3 font-bold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 20).map((s) => (
                <tr key={s.id}>
                  <td className="py-3 font-mono text-[11px] text-slate-500">
                    {s.invoiceNo}
                  </td>
                  <td className="py-3 text-xs font-bold text-slate-700">
                    {s.customerName ?? "مهمان"}
                  </td>
                  <td className="py-3 text-[11px] text-slate-500">
                    {items
                      .filter((i) => i.saleId === s.id)
                      .map((i) => `${i.medicineName}×${faNumber(i.quantity)}`)
                      .join("، ") || "—"}
                  </td>
                  <td className="py-3 text-[11px] text-rose-500">
                    {Number(s.discount) > 0 ? shortMoney(s.discount) : "—"}
                  </td>
                  <td className="py-3 text-xs font-bold text-teal-700">
                    {shortMoney(s.finalAmount)}
                  </td>
                  <td className="py-3">
                    <Badge tone="slate">{s.paymentMethod}</Badge>
                  </td>
                  <td className="py-3 text-[11px] text-slate-400">
                    {faDateTime(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title="فاکتور با موفقیت ثبت شد ✅"
      >
        <div className="grid place-items-center gap-3 py-6 text-center">
          <span className="text-5xl">🧾</span>
          <p className="text-sm text-slate-600">
            مبلغ دریافتی:{" "}
            <b className="text-teal-700">{toman(receipt?.amount ?? 0)}</b>
          </p>
          {receipt?.points ? (
            <p className="text-xs text-amber-600">
              ⭐ {faNumber(receipt.points)} امتیاز به حساب مشتری افزوده شد
            </p>
          ) : null}
          <p className="text-[11px] text-slate-400">
            موجودی انبار به‌صورت خودکار به‌روزرسانی شد
          </p>
          <Button className="mt-2" onClick={() => setReceipt(null)}>
            باشه
          </Button>
        </div>
      </Modal>
    </div>
  );
}
