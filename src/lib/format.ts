/** Persian locale formatting helpers and UI status/tier presentation utilities. */

const numberFormatter = new Intl.NumberFormat("fa-IR");

export function faNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "۰";
  return numberFormatter.format(n);
}

export function toman(value: number | string | null | undefined): string {
  return `${faNumber(Math.round(Number(value ?? 0)))} تومان`;
}

export function shortMoney(value: number | string | null | undefined): string {
  const n = Math.round(Number(value ?? 0));
  if (n >= 1_000_000_000) return `${faNumber((n / 1_000_000_000).toFixed(1))} میلیارد`;
  if (n >= 1_000_000) return `${faNumber((n / 1_000_000).toFixed(1))} میلیون`;
  if (n >= 1_000) return `${faNumber(Math.round(n / 1000))} هزار`;
  return faNumber(n);
}

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  hour: "2-digit",
  minute: "2-digit",
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function faDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? dateFormatter.format(d) : "—";
}

export function faShortDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? shortDateFormatter.format(d) : "—";
}

export function faDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? `${dateFormatter.format(d)} • ${timeFormatter.format(d)}` : "—";
}

export function daysFromNow(value: string | Date | null | undefined): number | null {
  const d = toDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeDays(value: string | Date | null | undefined): string {
  const diff = daysFromNow(value);
  if (diff === null) return "—";
  if (diff === 0) return "امروز";
  if (diff === 1) return "فردا";
  if (diff === -1) return "دیروز";
  if (diff > 0) return `${faNumber(diff)} روز دیگر`;
  return `${faNumber(Math.abs(diff))} روز پیش`;
}

export function tierFromPoints(points: number): string {
  if (points >= 1500) return "طلایی";
  if (points >= 600) return "نقره‌ای";
  return "برنزی";
}

export function statusTone(status: string): string {
  switch (status) {
    case "تحویل شده":
    case "انجام شد":
    case "ارسال شده":
      return "emerald";
    case "آماده":
    case "زمان‌بندی شده":
      return "indigo";
    case "در انتظار":
    case "باز":
    case "پیش‌نویس":
      return "amber";
    case "لغو شده":
      return "rose";
    default:
      return "slate";
  }
}

export function tierTone(tier: string): string {
  if (tier === "طلایی") return "amber";
  if (tier === "نقره‌ای") return "indigo";
  return "slate";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`;
}
