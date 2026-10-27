/** Prescription workflow screen for reviewing and processing prescriptions. */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/shared/ui";
import { faDate, faNumber, statusTone, toman } from "@/lib/format";

type Rx = {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string | null;
  doctorName: string | null;
  doctorSpecialty: string | null;
  insurance: string;
  status: string;
  notes: string | null;
  totalAmount: string;
  issuedAt: string | null;
  createdAt: string;
};

type RxItem = {
  id: number;
  prescriptionId: number;
  medicineId: number;
  quantity: number;
  dosage: string | null;
  unitPrice: string;
  medicineName: string | null;
};

type Option = { id: number; name: string; extra?: string; price?: string };

const STATUSES = ["در انتظار", "آماده", "تحویل شده", "لغو شده"];
const DOSAGES = [
  "روزی یک عدد",
  "هر ۸ ساعت یک عدد",
  "هر ۱۲ ساعت یک عدد",
  "شب‌ها قبل از خواب",
  "صبح ناشتا",
  "در صورت نیاز",
];

export default function PrescriptionsPage() {
  const [rows, setRows] = useState<Rx[]>([]);
  const [items, setItems] = useState<RxItem[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Option[]>([]);
  const [medicines, setMedicines] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    doctorName: "",
    doctorSpecialty: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [cart, setCart] = useState<
    { medicineId: number; name: string; quantity: number; dosage: string; price: number }[]
  >([]);
  const [pick, setPick] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    const res = await fetch(`/api/prescriptions?${p.toString()}`);
    const data = await res.json();
    setRows(data.prescriptions ?? []);
    setItems(data.items ?? []);
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) =>
        setCustomers(
          (d.customers ?? []).map((c: { id: number; fullName: string; phone: string }) => ({
            id: c.id,
            name: c.fullName,
            extra: c.phone,
          })),
        ),
      );
    fetch("/api/medicines")
      .then((r) => r.json())
      .then((d) =>
        setMedicines(
          (d.medicines ?? []).map(
            (m: { id: number; name: string; price: string; requiresPrescription: boolean }) => ({
              id: m.id,
              name: m.name,
              price: m.price,
              extra: m.requiresPrescription ? "نسخه‌ای" : "OTC",
            }),
          ),
        ),
      );
  }, []);

  async function changeStatus(rx: Rx, next: string) {
    if (next === "تحویل شده") {
      if (
        !confirm(
          "با تحویل نسخه، فاکتور فروش صادر شده، موجودی انبار کسر و امتیاز مشتری افزایش می‌یابد. ادامه می‌دهید؟",
        )
      )
        return;
    }
    await fetch(`/api/prescriptions/${rx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  function addItem() {
    const med = medicines.find((m) => String(m.id) === pick);
    if (!med) return;
    if (cart.some((c) => c.medicineId === med.id)) return;
    setCart([
      ...cart,
      {
        medicineId: med.id,
        name: med.name,
        quantity: 1,
        dosage: DOSAGES[0],
        price: Number(med.price ?? 0),
      },
    ]);
    setPick("");
  }

  async function submit() {
    if (!form.customerId || cart.length === 0) {
      setError("انتخاب مشتری و حداقل یک قلم دارو الزامی است");
      return;
    }
    const res = await fetch("/api/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cart }),
    });
    if (!res.ok) {
      setError("ثبت نسخه ناموفق بود");
      return;
    }
    setOpen(false);
    setCart([]);
    setForm({
      customerId: "",
      doctorName: "",
      doctorSpecialty: "",
      issuedAt: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    load();
  }

  const counts = STATUSES.map((s) => ({
    s,
    n: rows.filter((r) => r.status === s).length,
  }));
  const cartTotal = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="مدیریت نسخه‌ها"
        subtitle="ثبت، آماده‌سازی و تحویل نسخه‌های پزشک"
        action={
          <Button
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            ＋ ثبت نسخه جدید
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {counts.map((c) => (
          <button
            key={c.s}
            onClick={() => setStatus(status === c.s ? "" : c.s)}
            className={`card flex items-center justify-between p-4 text-right transition ${
              status === c.s ? "ring-2 ring-teal-400" : ""
            }`}
          >
            <div>
              <p className="text-[11px] text-slate-500">{c.s}</p>
              <p className="text-lg font-extrabold text-slate-800">{faNumber(c.n)}</p>
            </div>
            <Badge tone={statusTone(c.s)}>{c.s}</Badge>
          </button>
        ))}
      </div>

      <div className="card mb-4 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جستجو بر اساس نام مشتری..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">در حال بارگذاری…</p>
      ) : rows.length === 0 ? (
        <EmptyState text="نسخه‌ای یافت نشد" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((rx) => {
            const rxItems = items.filter((i) => i.prescriptionId === rx.id);
            return (
              <div key={rx.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/customers/${rx.customerId}`}
                      className="text-sm font-extrabold text-slate-800 hover:text-teal-600"
                    >
                      {rx.customerName}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {rx.customerPhone}
                    </p>
                  </div>
                  <Badge tone={statusTone(rx.status)}>{rx.status}</Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-[11px]">
                  <div>
                    <span className="text-slate-400">پزشک: </span>
                    <b className="text-slate-700">{rx.doctorName ?? "—"}</b>
                  </div>
                  <div>
                    <span className="text-slate-400">تخصص: </span>
                    <b className="text-slate-700">{rx.doctorSpecialty ?? "—"}</b>
                  </div>
                  <div>
                    <span className="text-slate-400">تاریخ: </span>
                    <b className="text-slate-700">{faDate(rx.issuedAt)}</b>
                  </div>
                  <div>
                    <span className="text-slate-400">بیمه: </span>
                    <b className="text-slate-700">{rx.insurance}</b>
                  </div>
                </div>

                <ul className="mt-3 flex flex-col gap-1.5">
                  {rxItems.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs ring-1 ring-slate-100"
                    >
                      <span className="font-bold text-slate-700">
                        {i.medicineName}
                        <span className="mr-2 font-normal text-slate-400">
                          {i.dosage}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        {faNumber(i.quantity)} عدد • {toman(Number(i.unitPrice) * i.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {rx.notes ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                    📝 {rx.notes}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-sm font-extrabold text-teal-700">
                    {toman(rx.totalAmount)}
                  </span>
                  <div className="flex gap-1.5">
                    {rx.status === "در انتظار" && (
                      <Button size="sm" variant="soft" onClick={() => changeStatus(rx, "آماده")}>
                        آماده‌سازی
                      </Button>
                    )}
                    {rx.status !== "تحویل شده" && rx.status !== "لغو شده" && (
                      <Button size="sm" onClick={() => changeStatus(rx, "تحویل شده")}>
                        تحویل و صدور فاکتور
                      </Button>
                    )}
                    {rx.status !== "لغو شده" && rx.status !== "تحویل شده" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => changeStatus(rx, "لغو شده")}
                      >
                        لغو
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="ثبت نسخه جدید" wide>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="مشتری *"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            options={[
              { value: "", label: "انتخاب کنید..." },
              ...customers.map((c) => ({
                value: String(c.id),
                label: `${c.name} — ${c.extra}`,
              })),
            ]}
          />
          <Input
            label="تاریخ نسخه"
            type="date"
            value={form.issuedAt}
            onChange={(e) => setForm({ ...form, issuedAt: e.target.value })}
          />
          <Input
            label="نام پزشک"
            value={form.doctorName}
            onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
            placeholder="دکتر ..."
          />
          <Input
            label="تخصص"
            value={form.doctorSpecialty}
            onChange={(e) => setForm({ ...form, doctorSpecialty: e.target.value })}
            placeholder="داخلی، قلب، اطفال..."
          />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-xs font-extrabold text-slate-700">اقلام نسخه</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            >
              <option value="">انتخاب دارو...</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.extra})
                </option>
              ))}
            </select>
            <Button variant="soft" onClick={addItem}>
              افزودن
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {cart.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">
                هنوز دارویی اضافه نشده است
              </p>
            )}
            {cart.map((c, idx) => (
              <div
                key={c.medicineId}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3"
              >
                <span className="min-w-[140px] flex-1 text-xs font-bold text-slate-700">
                  {c.name}
                </span>
                <input
                  type="number"
                  min={1}
                  value={c.quantity}
                  onChange={(e) => {
                    const next = [...cart];
                    next[idx] = { ...c, quantity: Math.max(1, Number(e.target.value)) };
                    setCart(next);
                  }}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                />
                <select
                  value={c.dosage}
                  onChange={(e) => {
                    const next = [...cart];
                    next[idx] = { ...c, dosage: e.target.value };
                    setCart(next);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                >
                  {DOSAGES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-bold text-teal-700">
                  {toman(c.price * c.quantity)}
                </span>
                <button
                  onClick={() => setCart(cart.filter((x) => x.medicineId !== c.medicineId))}
                  className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <p className="mt-3 text-left text-sm font-extrabold text-slate-800">
              جمع کل: {toman(cartTotal)}
            </p>
          )}
        </div>

        <div className="mt-4">
          <Textarea
            label="یادداشت"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
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
          <Button onClick={submit}>ثبت نسخه</Button>
        </div>
      </Modal>
    </div>
  );
}
