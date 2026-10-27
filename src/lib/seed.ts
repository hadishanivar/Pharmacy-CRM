/** Deterministic demo-data seeding helpers for local development and previews. */

import { db } from "@/db";
import {
  campaigns,
  customers,
  interactions,
  medicines,
  prescriptionItems,
  prescriptions,
  saleItems,
  sales,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import { tierFromPoints } from "./format";

/* یک مولد عدد شبه‌تصادفی قطعی تا داده نمونه همیشه یکسان ساخته شود */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const CUSTOMERS = [
  ["زهرا محمدی", "09121234567", "زن", "1985-04-12", "تأمین اجتماعی", "دیابت نوع ۲", "پنی‌سیلین", "مشتری وفادار، هر ماه انسولین می‌گیرد"],
  ["علی کریمی", "09123456789", "مرد", "1978-09-03", "بیمه سلامت", "فشار خون بالا", "—", "علاقه‌مند به مکمل‌های ورزشی"],
  ["فاطمه حسینی", "09351112233", "زن", "1992-01-25", "آزاد", "—", "آسپرین", "خرید محصولات آرایشی بهداشتی"],
  ["محمدرضا اکبری", "09127778899", "مرد", "1965-06-30", "نیروهای مسلح", "کلسترول بالا، آرتروز", "—", "بازنشسته، تخفیف ویژه"],
  ["سارا نوری", "09302223344", "زن", "1998-11-17", "بیمه سلامت", "کم‌خونی", "—", "دانشجو"],
  ["حسین صادقی", "09124445566", "مرد", "1988-03-08", "تأمین اجتماعی", "—", "لاکتوز", "پدر دو کودک، خرید شیرخشک"],
  ["مریم رستمی", "09361239876", "زن", "1972-07-21", "تأمین اجتماعی", "کم‌کاری تیروئید", "سولفامید", "نسخه ماهانه لووتیروکسین"],
  ["امیر تهرانی", "09129998877", "مرد", "2001-02-14", "آزاد", "آسم", "—", "اسپری تنفسی مصرف می‌کند"],
  ["نرگس قاسمی", "09195554433", "زن", "1960-12-05", "بیمه سلامت", "پوکی استخوان، فشار خون", "—", "سالمند، نیاز به یادآوری دارو"],
  ["بهنام یوسفی", "09126667788", "مرد", "1995-08-19", "آزاد", "—", "—", "ورزشکار"],
  ["الهام شریفی", "09381234512", "زن", "1990-05-09", "تأمین اجتماعی", "میگرن", "ایبوپروفن", "حساس به قیمت"],
  ["رضا موسوی", "09121112222", "مرد", "1983-10-28", "بیمه سلامت", "رفلاکس معده", "—", "خرید اینترنتی"],
  ["طاهره عبدی", "09371119988", "زن", "1955-03-16", "تأمین اجتماعی", "دیابت، نارسایی قلبی", "پنی‌سیلین", "همراه بیمار پیگیری می‌کند"],
  ["کاوه ابراهیمی", "09128889900", "مرد", "1987-01-11", "آزاد", "—", "—", "مدیر شرکت، خرید عمده مکمل"],
];

const MEDICINES: [string, string, string, string, string, number, number, number, number, boolean][] = [
  ["استامینوفن ۵۰۰", "Acetaminophen", "مسکن و تب‌بر", "داروپخش", "قرص", 18000, 420, 80, 540, false],
  ["ایبوپروفن ۴۰۰", "Ibuprofen", "مسکن و تب‌بر", "رازک", "قرص", 26000, 310, 60, 400, false],
  ["آموکسی‌سیلین ۵۰۰", "Amoxicillin", "آنتی‌بیوتیک", "فارابی", "کپسول", 54000, 96, 50, 300, true],
  ["آزیترومایسین ۲۵۰", "Azithromycin", "آنتی‌بیوتیک", "عبیدی", "قرص", 98000, 42, 40, 210, true],
  ["متفورمین ۵۰۰", "Metformin", "دیابت", "تهران دارو", "قرص", 32000, 180, 60, 420, true],
  ["انسولین گلارژین", "Insulin Glargine", "دیابت", "اکسیر", "قلم تزریق", 820000, 26, 15, 150, true],
  ["لوزارتان ۵۰", "Losartan", "قلب و عروق", "سبحان دارو", "قرص", 45000, 210, 50, 380, true],
  ["آتورواستاتین ۲۰", "Atorvastatin", "قلب و عروق", "ابوریحان", "قرص", 62000, 140, 50, 330, true],
  ["لووتیروکسین ۱۰۰", "Levothyroxine", "غدد", "ایران هورمون", "قرص", 29000, 165, 60, 260, true],
  ["سالبوتامول اسپری", "Salbutamol", "تنفسی", "سینا دارو", "اسپری", 185000, 38, 20, 240, true],
  ["اُمپرازول ۲۰", "Omeprazole", "گوارش", "دارو پخش", "کپسول", 38000, 220, 60, 300, false],
  ["شربت دیفن‌هیدرامین", "Diphenhydramine", "سرماخوردگی", "جالینوس", "شربت", 42000, 130, 40, 190, false],
  ["ویتامین D3 ۱۰۰۰", "Cholecalciferol", "مکمل", "یوروویتال", "قرص", 140000, 260, 50, 600, false],
  ["مولتی‌ویتامین بزرگسال", "Multivitamin", "مکمل", "نیچرمید", "قرص", 310000, 95, 30, 480, false],
  ["قرص آهن فروس سولفات", "Ferrous Sulfate", "مکمل", "ایران دارو", "قرص", 36000, 175, 50, 410, false],
  ["کلسیم + منیزیم", "Calcium Magnesium", "مکمل", "نیچرمید", "قرص", 395000, 72, 25, 520, false],
  ["شیرخشک مرحله ۱", "Infant Formula", "کودک", "نوتریشن", "پودر", 420000, 54, 20, 300, false],
  ["پماد هیدروکورتیزون", "Hydrocortisone", "پوست", "بهوزان", "پماد", 48000, 88, 30, 250, false],
  ["قطره چشمی اشک مصنوعی", "Artificial Tears", "چشم", "سینا دارو", "قطره", 76000, 110, 30, 180, false],
  ["ماسک سه‌لایه (۵۰ عددی)", "Face Mask", "بهداشتی", "پاک‌نام", "بسته", 95000, 240, 60, 900, false],
  ["محلول ضدعفونی دست", "Hand Sanitizer", "بهداشتی", "فیروز", "محلول", 68000, 150, 40, 420, false],
  ["کرم ضدآفتاب SPF50", "Sunscreen", "آرایشی بهداشتی", "سی‌گل", "کرم", 520000, 64, 20, 560, false],
  ["شامپو ضدریزش", "Anti Hair Loss", "آرایشی بهداشتی", "درماتیپیک", "شامپو", 480000, 47, 15, 640, false],
  ["سرنگ انسولین", "Insulin Syringe", "تجهیزات", "سوپا", "بسته", 115000, 18, 25, 700, false],
  ["نوار تست قند خون", "Glucose Strip", "تجهیزات", "اکیو-چک", "بسته", 680000, 12, 20, 320, false],
  ["دستگاه فشارسنج دیجیتال", "BP Monitor", "تجهیزات", "بیورر", "دستگاه", 2450000, 9, 5, 1200, false],
];

const DOCTORS: [string, string][] = [
  ["دکتر مهدی علوی", "داخلی"],
  ["دکتر شیرین کاظمی", "غدد و متابولیسم"],
  ["دکتر رامین پورمند", "قلب و عروق"],
  ["دکتر نسیم جوادی", "اطفال"],
  ["دکتر فرید اسدی", "عفونی"],
];

/**
 * Rebuilds the demo dataset from deterministic sample records.
 * WARNING: this starts by truncating application tables; never run against production data.
 */
export async function runSeed() {
  await db.execute(
    sql`truncate table ${saleItems}, ${sales}, ${prescriptionItems}, ${prescriptions}, ${interactions}, ${campaigns}, ${medicines}, ${customers} restart identity cascade`,
  );

  const rand = rng(20260215);

  /* ------------------------------ داروها ------------------------------ */
  const medRows = await db
    .insert(medicines)
    .values(
      MEDICINES.map((m, i) => ({
        name: m[0],
        genericName: m[1],
        category: m[2],
        manufacturer: m[3],
        form: m[4],
        price: String(m[5]),
        stock: m[6],
        reorderLevel: m[7],
        expiryDate: iso(shift(m[8])),
        requiresPrescription: m[9],
        barcode: `62610${String(100000 + i * 37)}`,
      })),
    )
    .returning();

  /* ----------------------------- مشتریان ------------------------------ */
  const customerRows = await db
    .insert(customers)
    .values(
      CUSTOMERS.map((c, i) => {
        const points = Math.round(rand() * 2100);
        return {
          fullName: c[0],
          phone: c[1],
          nationalCode: String(1200000000 + i * 7654321),
          gender: c[2],
          birthDate: c[3],
          address: "تهران، خیابان ولیعصر، کوچه " + (i + 3),
          insurance: c[4],
          insuranceNumber: String(9900000 + i * 1234),
          chronicConditions: c[5],
          allergies: c[6],
          loyaltyTier: tierFromPoints(points),
          loyaltyPoints: points,
          smsOptIn: i % 7 !== 0,
          notes: c[7],
        };
      }),
    )
    .returning();

  /* ------------------------------ فروش -------------------------------- */
  type Totals = { spent: number; visits: number; last: Date | null };
  const totals = new Map<number, Totals>();

  for (let i = 0; i < 70; i++) {
    const daysAgo = Math.floor(rand() * 34);
    const createdAt = shift(-daysAgo);
    createdAt.setHours(9 + Math.floor(rand() * 11), Math.floor(rand() * 60), 0, 0);

    const customer = customerRows[Math.floor(rand() * customerRows.length)];
    const itemCount = 1 + Math.floor(rand() * 4);
    const picked = new Set<number>();
    const items: {
      medicineId: number;
      medicineName: string;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }[] = [];
    let total = 0;

    for (let k = 0; k < itemCount; k++) {
      const med = medRows[Math.floor(rand() * medRows.length)];
      if (picked.has(med.id)) continue;
      picked.add(med.id);
      const qty = 1 + Math.floor(rand() * 3);
      const unit = Number(med.price);
      const line = unit * qty;
      total += line;
      items.push({
        medicineId: med.id,
        medicineName: med.name,
        quantity: qty,
        unitPrice: String(unit),
        lineTotal: String(line),
      });
    }
    if (!items.length) continue;

    const discount = rand() > 0.72 ? Math.round((total * 0.1) / 1000) * 1000 : 0;
    const finalAmount = total - discount;
    const points = Math.round(finalAmount / 10000);

    const [sale] = await db
      .insert(sales)
      .values({
        invoiceNo: `INV-${14040000 + i}`,
        customerId: customer.id,
        totalAmount: String(total),
        discount: String(discount),
        finalAmount: String(finalAmount),
        paymentMethod: ["کارتخوان", "نقدی", "آنلاین", "اعتباری"][
          Math.floor(rand() * 4)
        ],
        pointsEarned: points,
        createdAt,
      })
      .returning();

    await db
      .insert(saleItems)
      .values(items.map((it) => ({ ...it, saleId: sale.id })));

    const prev = totals.get(customer.id) ?? { spent: 0, visits: 0, last: null };
    totals.set(customer.id, {
      spent: prev.spent + finalAmount,
      visits: prev.visits + 1,
      last: !prev.last || createdAt > prev.last ? createdAt : prev.last,
    });
  }

  for (const [customerId, t] of totals) {
    await db
      .update(customers)
      .set({
        totalSpent: String(Math.round(t.spent)),
        visitsCount: t.visits,
        lastVisitAt: t.last,
      })
      .where(sql`${customers.id} = ${customerId}`);
  }

  /* ----------------------------- نسخه‌ها ------------------------------- */
  const statuses = ["در انتظار", "آماده", "تحویل شده", "تحویل شده", "لغو شده"];
  for (let i = 0; i < 16; i++) {
    const customer = customerRows[Math.floor(rand() * customerRows.length)];
    const doctor = DOCTORS[Math.floor(rand() * DOCTORS.length)];
    const status = statuses[Math.floor(rand() * statuses.length)];
    const rxMeds = medRows.filter((m) => m.requiresPrescription);
    const items: {
      medicineId: number;
      quantity: number;
      dosage: string;
      unitPrice: string;
    }[] = [];
    let total = 0;
    const n = 1 + Math.floor(rand() * 3);
    const used = new Set<number>();
    for (let k = 0; k < n; k++) {
      const med = rxMeds[Math.floor(rand() * rxMeds.length)];
      if (used.has(med.id)) continue;
      used.add(med.id);
      const qty = 1 + Math.floor(rand() * 2);
      total += Number(med.price) * qty;
      items.push({
        medicineId: med.id,
        quantity: qty,
        dosage: ["هر ۸ ساعت یک عدد", "روزی یک عدد صبح ناشتا", "شب‌ها قبل خواب", "هر ۱۲ ساعت"][
          Math.floor(rand() * 4)
        ],
        unitPrice: String(med.price),
      });
    }
    if (!items.length) continue;

    const [rx] = await db
      .insert(prescriptions)
      .values({
        customerId: customer.id,
        doctorName: doctor[0],
        doctorSpecialty: doctor[1],
        insurance: customer.insurance,
        status,
        totalAmount: String(total),
        issuedAt: iso(shift(-Math.floor(rand() * 20))),
        notes: rand() > 0.6 ? "بیمه تکمیلی نیز اعمال شود" : null,
        createdAt: shift(-Math.floor(rand() * 20)),
      })
      .returning();

    await db
      .insert(prescriptionItems)
      .values(items.map((it) => ({ ...it, prescriptionId: rx.id })));
  }

  /* ---------------------------- پیگیری‌ها ------------------------------ */
  const followTypes = ["تماس", "پیامک", "تمدید دارو", "تبریک تولد", "مشاوره"];
  const subjects = [
    "یادآوری تمدید نسخه ماهانه",
    "پیگیری عوارض دارویی",
    "اطلاع‌رسانی رسیدن داروی سفارشی",
    "تبریک تولد و ارسال کد تخفیف",
    "مشاوره مصرف مکمل",
    "یادآوری تست قند خون",
  ];
  await db.insert(interactions).values(
    Array.from({ length: 14 }).map((_, i) => {
      const customer = customerRows[Math.floor(rand() * customerRows.length)];
      const due = shift(Math.floor(rand() * 14) - 5);
      const done = rand() > 0.6;
      return {
        customerId: customer.id,
        type: followTypes[i % followTypes.length],
        subject: subjects[i % subjects.length],
        message: "تماس با بیمار جهت پیگیری وضعیت درمان و مصرف صحیح دارو.",
        dueDate: iso(due),
        status: done ? "انجام شد" : "باز",
        assignedTo: ["دکتر سارا رضایی", "دکتر امین فرهادی", "خانم نیکو"][
          Math.floor(rand() * 3)
        ],
        completedAt: done ? shift(-1) : null,
      };
    }),
  );

  /* ----------------------------- کمپین‌ها ------------------------------ */
  await db.insert(campaigns).values([
    {
      title: "تخفیف ۲۰٪ مکمل‌های ویتامینی",
      channel: "پیامک",
      audience: "مشتریان طلایی",
      message: "مشتری گرامی، تا پایان هفته ۲۰٪ تخفیف روی تمام مکمل‌ها. داروخانه مهر",
      status: "ارسال شده",
      scheduledFor: iso(shift(-6)),
      sentCount: 412,
    },
    {
      title: "یادآوری واکسن آنفولانزا",
      channel: "پیامک",
      audience: "بیماران مزمن",
      message: "واکسن آنفولانزا موجود شد. جهت رزرو با داروخانه مهر تماس بگیرید.",
      status: "زمان‌بندی شده",
      scheduledFor: iso(shift(4)),
      sentCount: 0,
    },
    {
      title: "باشگاه مشتریان - امتیاز دو برابر",
      channel: "پیامک",
      audience: "همه مشتریان",
      message: "این هفته امتیاز خریدهای شما دو برابر محاسبه می‌شود.",
      status: "پیش‌نویس",
      scheduledFor: iso(shift(9)),
      sentCount: 0,
    },
    {
      title: "پیگیری بیماران دیابتی",
      channel: "تماس",
      audience: "بیماران دیابتی",
      message: "تماس جهت بررسی روند مصرف انسولین و نوار تست.",
      status: "ارسال شده",
      scheduledFor: iso(shift(-14)),
      sentCount: 63,
    },
  ]);

  return { customers: customerRows.length, medicines: medRows.length };
}

let seedPromise: Promise<unknown> | null = null;

/** Ensures demo records exist for local previews; see runSeed before changing this flow. */
export async function ensureSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const res = await db.execute<{ count: string }>(
        sql`select count(*)::text as count from ${customers}`,
      );
      const count = Number(res.rows?.[0]?.count ?? "0");
      if (count === 0) await runSeed();
    } catch {
      seedPromise = null;
    }
  })();
  return seedPromise;
}
