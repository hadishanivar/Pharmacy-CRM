/** Small reusable chart primitives used by the dashboard and reports. */

import { faNumber, shortMoney } from "@/lib/format";

export function BarChart({
  data,
}: {
  data: { label: string; value: number; hint?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-44 items-end justify-between gap-1.5">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 2);
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 opacity-0 transition group-hover:opacity-100">
              {shortMoney(d.value)}
            </span>
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-teal-600 to-teal-400 transition-all duration-300 group-hover:from-teal-700 group-hover:to-teal-500"
                style={{ height: `${h}%` }}
                title={`${d.label}: ${shortMoney(d.value)}`}
              />
            </div>
            <span className="text-[9px] text-slate-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const BAR_COLORS = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-rose-500",
];

export function HBars({
  data,
  money = true,
}: {
  data: { label: string; value: number; sub?: string }[];
  money?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (!data.length)
    return <p className="py-6 text-center text-xs text-slate-400">داده‌ای موجود نیست</p>;
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-bold text-slate-700">{d.label}</span>
            <span className="shrink-0 text-slate-500">
              {money ? shortMoney(d.value) : faNumber(d.value)}
              {d.sub ? <span className="text-slate-400"> • {d.sub}</span> : null}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
      >
        <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white">
          <span className="text-sm font-extrabold text-slate-700">
            {faNumber(total)}
          </span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-slate-600">{s.label}</span>
            <span className="font-bold text-slate-700">{faNumber(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
