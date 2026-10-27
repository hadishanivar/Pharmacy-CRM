/** Follow-up workspace for tracking customer interactions and due dates. */

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
import { daysFromNow, faDate, faNumber, relativeDays, statusTone } from "@/lib/format";

type Follow = {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string | null;
  type: string;
  subject: string;
  message: string | null;
  dueDate: string | null;
  status: string;
  assignedTo: string;
  completedAt: string | null;
};

type Customer = { id: number; fullName: string; phone: string };

const TYPES = ["تماس", "پیامک", "تمدید دارو", "تبریک تولد", "مشاوره", "پیگیری درمان"];
const STAFF = ["دکتر سارا رضایی", "دکتر امین فرهادی", "خانم نیکو", "آقای مرادی"];

export default function FollowupsPage() {
  const [rows, setRows] = useState<Follow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [scope, setScope] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    type: TYPES[0],
    subject: "",
    message: "",
    dueDate: new Date().toISOString().slice(0, 10),
    assignedTo: STAFF[0],
  });

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (scope) p.set("scope", scope);
    if (status) p.set("status", status);
    const res = await fetch(`/api/interactions?${p.toString()}`);
    const data = await res.json();
    setRows(data.interactions ?? []);
    setLoading(false);
  }, [scope, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  async function complete(f: Follow) {
    await fetch(`/api/interactions/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: f.status === "انجام شد" ? "باز" : "انجام شد" }),
    });
    load();
  }

  async function remove(f: Follow) {
    if (!confirm("حذف این پیگیری؟")) return;
    await fetch(`/api/interactions/${f.id}`, { method: "DELETE" });
    load();
  }

  async function submit() {
    if (!form.customerId || !form.subject.trim()) {
      setError("انتخاب مشتری و عنوان پیگیری الزامی است");
      return;
    }
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError("ثبت پیگیری ناموفق بود");
      return;
    }
    setOpen(false);
    setForm({ ...form, customerId: "", subject: "", message: "" });
    load();
  }

  const openCount = rows.filter((r) => r.status === "باز").length;
  const overdue = rows.filter(
    (r) => r.status === "باز" && (daysFromNow(r.dueDate) ?? 0) < 0,
  ).length;
  const todayCount = rows.filter(
    (r) => r.status === "باز" && daysFromNow(r.dueDate) === 0,
  ).length;

  const SCOPES = [
    { v: "", l: "همه" },
    { v: "today", l: "امروز" },
    { v: "overdue", l: "عقب‌افتاده" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="پیگیری‌ها و یادآورها"
        subtitle="یادآوری تمدید دارو، تماس‌های درمانی و تبریک تولد مشتریان"
        action={
          <Button
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            ＋ پیگیری جدید
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { l: "پیگیری‌های باز", v: openCount, i: "🔔", t: "bg-amber-50" },
          { l: "سررسید امروز", v: todayCount, i: "📅", t: "bg-teal-50" },
          { l: "عقب‌افتاده", v: overdue, i: "⏰", t: "bg-rose-50" },
        ].map((s) => (
          <div key={s.l} className="card flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${s.t}`}>
              {s.i}
            </span>
            <div>
              <p className="text-[11px] text-slate-500">{s.l}</p>
              <p className="text-lg font-extrabold text-slate-800">{faNumber(s.v)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-2 p-4">
        {SCOPES.map((s) => (
          <button
            key={s.v || "all"}
            onClick={() => setScope(s.v)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              scope === s.v
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s.l}
          </button>
        ))}
        <span className="mx-2 h-5 w-px bg-slate-200" />
        {["", "باز", "انجام شد"].map((s) => (
          <button
            key={s || "any"}
            onClick={() => setStatus(s)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              status === s
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s || "همه وضعیت‌ها"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">در حال بارگذاری…</p>
      ) : rows.length === 0 ? (
        <EmptyState text="پیگیری‌ای یافت نشد" />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((f) => {
            const d = daysFromNow(f.dueDate);
            const late = f.status === "باز" && d !== null && d < 0;
            return (
              <div
                key={f.id}
                className={`card flex flex-wrap items-center gap-4 p-4 ${
                  late ? "ring-1 ring-rose-200" : ""
                }`}
              >
                <button
                  onClick={() => complete(f)}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${
                    f.status === "انجام شد"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400 hover:bg-teal-100 hover:text-teal-600"
                  }`}
                  title="تغییر وضعیت"
                >
                  ✓
                </button>
                <div className="min-w-[180px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-bold ${
                        f.status === "انجام شد"
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      }`}
                    >
                      {f.subject}
                    </p>
                    <Badge tone="slate">{f.type}</Badge>
                    <Badge tone={statusTone(f.status)}>{f.status}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{f.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    مسئول: {f.assignedTo}
                  </p>
                </div>
                <Link
                  href={`/customers/${f.customerId}`}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                >
                  {f.customerName}
                  <span className="block font-mono text-[10px] text-slate-400">
                    {f.customerPhone}
                  </span>
                </Link>
                <div className="text-left">
                  <p
                    className={`text-xs font-bold ${
                      late ? "text-rose-600" : "text-slate-600"
                    }`}
                  >
                    {relativeDays(f.dueDate)}
                  </p>
                  <p className="text-[10px] text-slate-400">{faDate(f.dueDate)}</p>
                </div>
                <button
                  onClick={() => remove(f)}
                  className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100"
                >
                  حذف
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="ثبت پیگیری جدید">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="مشتری *"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              options={[
                { value: "", label: "انتخاب کنید..." },
                ...customers.map((c) => ({
                  value: String(c.id),
                  label: `${c.fullName} — ${c.phone}`,
                })),
              ]}
            />
          </div>
          <Select
            label="نوع پیگیری"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Input
            label="تاریخ سررسید"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="عنوان *"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="مثال: یادآوری تمدید نسخه انسولین"
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="توضیحات"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <Select
            label="مسئول پیگیری"
            value={form.assignedTo}
            onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            options={STAFF.map((s) => ({ value: s, label: s }))}
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
          <Button onClick={submit}>ثبت پیگیری</Button>
        </div>
      </Modal>
    </div>
  );
}
