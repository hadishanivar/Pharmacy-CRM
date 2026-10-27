/** Shared presentational UI primitives (buttons, badges, modals, and page headers). */

"use client";

import type { ReactNode } from "react";

/* --------------------------------- Card -------------------------------- */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- Badge -------------------------------- */
const TONES: Record<string, string> = {
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES | string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
        TONES[tone] ?? TONES.slate
      }`}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Button ------------------------------- */
export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger" | "soft";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20",
    soft: "bg-teal-50 text-teal-700 hover:bg-teal-100 ring-1 ring-teal-200",
    ghost: "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
    danger: "bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

/* -------------------------------- Modal -------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 backdrop-blur-sm">
      <div
        className={`fade-in my-8 w-full ${
          wide ? "max-w-4xl" : "max-w-2xl"
        } rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------- Fields ------------------------------- */
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label, className, ...rest } = props;
  const input = <input {...rest} className={`${fieldClass} ${className ?? ""}`} />;
  return label ? <Field label={label}>{input}</Field> : input;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string },
) {
  const { label, className, ...rest } = props;
  const el = <textarea {...rest} className={`${fieldClass} ${className ?? ""}`} />;
  return label ? <Field label={label}>{el}</Field> : el;
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { value: string; label: string }[];
  },
) {
  const { label, options, className, ...rest } = props;
  const el = (
    <select {...rest} className={`${fieldClass} ${className ?? ""}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  return label ? <Field label={label}>{el}</Field> : el;
}

/* -------------------------------- Empty -------------------------------- */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <span className="text-3xl">🗂️</span>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
