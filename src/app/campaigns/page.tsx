/** Campaign management screen: create, review, and manage customer messaging campaigns. */

"use client";

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
import { faDate, faNumber, statusTone } from "@/lib/format";

type Campaign = {
  id: number;
  title: string;
  channel: string;
  audience: string;
  message: string;
  status: string;
  scheduledFor: string | null;
  sentCount: number;
  createdAt: string;
};

const CHANNELS = ["پیامک", "تماس", "ایمیل", "پیام‌رسان"];

export default function CampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    channel: CHANNELS[0],
    audience: "همه مشتریان",
    message: "",
    status: "پیش‌نویس",
    scheduledFor: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    setRows(data.campaigns ?? []);
    setAudiences(data.audiences ?? []);
    setCounts(data.audienceCounts ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(c: Campaign) {
    if (!confirm(`ارسال کمپین «${c.title}» به گروه «${c.audience}»؟`)) return;
    const res = await fetch(`/api/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send" }),
    });
    const data = await res.json();
    alert(`کمپین برای ${data.sentCount} مشتری ارسال شد ✅`);
    load();
  }

  async function remove(c: Campaign) {
    if (!confirm("حذف این کمپین؟")) return;
    await fetch(`/api/campaigns/${c.id}`, { method: "DELETE" });
    load();
  }

  async function submit() {
    if (!form.title.trim() || !form.message.trim()) {
      setError("عنوان و متن پیام الزامی است");
      return;
    }
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setError("ثبت کمپین ناموفق بود");
      return;
    }
    setOpen(false);
    setForm({ ...form, title: "", message: "" });
    load();
  }

  const totalSent = rows.reduce((a, r) => a + r.sentCount, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="کمپین‌های بازاریابی"
        subtitle="ارسال پیامک گروهی به مشتریان هدف بر اساس سطح وفاداری و سوابق پزشکی"
        action={
          <Button
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            ＋ کمپین جدید
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "کل کمپین‌ها", v: faNumber(rows.length), i: "📣" },
          {
            l: "ارسال شده",
            v: faNumber(rows.filter((r) => r.status === "ارسال شده").length),
            i: "✅",
          },
          { l: "مجموع پیام‌ها", v: faNumber(totalSent), i: "📩" },
          {
            l: "مخاطب فعال",
            v: faNumber(counts["همه مشتریان"] ?? 0),
            i: "👥",
          },
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

      <div className="card mb-4 p-5">
        <h2 className="mb-3 text-sm font-extrabold text-slate-800">
          گروه‌های مخاطب (دارای رضایت پیامکی)
        </h2>
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <span
              key={a}
              className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600"
            >
              {a}
              <span className="mr-2 rounded-lg bg-teal-100 px-1.5 py-0.5 text-teal-700">
                {faNumber(counts[a] ?? 0)}
              </span>
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">در حال بارگذاری…</p>
      ) : rows.length === 0 ? (
        <EmptyState text="کمپینی ثبت نشده است" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {rows.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">{c.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {c.channel} • {c.audience} • {faDate(c.scheduledFor)}
                  </p>
                </div>
                <Badge tone={statusTone(c.status)}>{c.status}</Badge>
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs leading-6 text-slate-600">
                {c.message}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-500">
                  مخاطب هدف:{" "}
                  <b className="text-slate-700">{faNumber(counts[c.audience] ?? 0)}</b>
                  {c.sentCount > 0 ? (
                    <span className="mr-2 text-emerald-600">
                      • ارسال شده به {faNumber(c.sentCount)} نفر
                    </span>
                  ) : null}
                </span>
                <div className="flex gap-1.5">
                  {c.status !== "ارسال شده" && (
                    <Button size="sm" onClick={() => send(c)}>
                      ارسال فوری
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => remove(c)}>
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="ساخت کمپین جدید">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="عنوان کمپین *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: تخفیف ویژه مکمل‌ها"
            />
          </div>
          <Select
            label="کانال ارتباطی"
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            options={CHANNELS.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="گروه مخاطب"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            options={audiences.map((a) => ({
              value: a,
              label: `${a} (${faNumber(counts[a] ?? 0)} نفر)`,
            }))}
          />
          <Input
            label="تاریخ ارسال"
            type="date"
            value={form.scheduledFor}
            onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
          />
          <Select
            label="وضعیت"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["پیش‌نویس", "زمان‌بندی شده"].map((s) => ({
              value: s,
              label: s,
            }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="متن پیام"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="مشتری گرامی، ..."
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {faNumber(form.message.length)} کاراکتر
            </p>
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
          <Button onClick={submit}>ذخیره کمپین</Button>
        </div>
      </Modal>
    </div>
  );
}
