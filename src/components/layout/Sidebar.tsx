/** Primary application navigation shared by all authenticated-style dashboard routes. */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/", label: "داشبورد", icon: "📊" },
  { href: "/customers", label: "مشتریان", icon: "👥" },
  { href: "/prescriptions", label: "نسخه‌ها", icon: "📄" },
  { href: "/sales", label: "صندوق فروش", icon: "🧾" },
  { href: "/medicines", label: "انبار دارو", icon: "💊" },
  { href: "/followups", label: "پیگیری‌ها", icon: "🔔" },
  { href: "/campaigns", label: "کمپین پیامکی", icon: "📣" },
  { href: "/reports", label: "گزارش‌ها", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* موبایل */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-lg text-white">
            ⚕
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800">داروخانه مهر</p>
            <p className="text-[11px] text-slate-500">سامانه CRM</p>
          </div>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          {open ? "بستن" : "منو"}
        </button>
      </div>

      <aside
        className={`no-print ${
          open ? "block" : "hidden"
        } lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0`}
      >
        <div className="flex h-full flex-col gap-1 border-slate-200 bg-white/80 p-4 backdrop-blur lg:border-l">
          <div className="mb-4 hidden items-center gap-3 px-2 lg:flex">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xl text-white shadow-lg shadow-teal-500/30">
              ⚕
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold text-slate-800">داروخانه مهر</p>
              <p className="text-xs text-slate-500">سامانه مدیریت مشتریان</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-teal-600 font-bold text-white shadow-md shadow-teal-600/25"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-4 text-white lg:block">
            <p className="text-sm font-bold">دکتر سارا رضایی</p>
            <p className="mt-0.5 text-[11px] text-slate-300">مسئول فنی داروخانه</p>
            <p className="mt-3 text-[11px] leading-5 text-slate-300">
              شیفت صبح • ۸:۰۰ تا ۱۴:۰۰
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
