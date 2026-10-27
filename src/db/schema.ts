/** Canonical PostgreSQL schema for customers, inventory, prescriptions, sales, and campaigns. */

import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* ------------------------------ مشتریان ------------------------------ */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  nationalCode: text("national_code"),
  gender: text("gender").default("زن").notNull(),
  birthDate: date("birth_date"),
  address: text("address"),
  insurance: text("insurance").default("آزاد").notNull(),
  insuranceNumber: text("insurance_number"),
  chronicConditions: text("chronic_conditions"),
  allergies: text("allergies"),
  loyaltyTier: text("loyalty_tier").default("برنزی").notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  totalSpent: numeric("total_spent", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  visitsCount: integer("visits_count").default(0).notNull(),
  smsOptIn: boolean("sms_opt_in").default(true).notNull(),
  notes: text("notes"),
  lastVisitAt: timestamp("last_visit_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* -------------------------------- داروها ------------------------------ */
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  category: text("category").default("عمومی").notNull(),
  manufacturer: text("manufacturer"),
  form: text("form").default("قرص").notNull(),
  price: numeric("price", { precision: 14, scale: 0 }).default("0").notNull(),
  stock: integer("stock").default(0).notNull(),
  reorderLevel: integer("reorder_level").default(20).notNull(),
  expiryDate: date("expiry_date"),
  requiresPrescription: boolean("requires_prescription")
    .default(false)
    .notNull(),
  barcode: text("barcode"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* -------------------------------- نسخه‌ها ----------------------------- */
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  doctorName: text("doctor_name"),
  doctorSpecialty: text("doctor_specialty"),
  insurance: text("insurance").default("آزاد").notNull(),
  status: text("status").default("در انتظار").notNull(),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  issuedAt: date("issued_at"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  quantity: integer("quantity").default(1).notNull(),
  dosage: text("dosage"),
  unitPrice: numeric("unit_price", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
});

/* -------------------------------- فروش -------------------------------- */
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull(),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id, {
    onDelete: "set null",
  }),
  totalAmount: numeric("total_amount", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  discount: numeric("discount", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  finalAmount: numeric("final_amount", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  paymentMethod: text("payment_method").default("کارتخوان").notNull(),
  pointsEarned: integer("points_earned").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  medicineId: integer("medicine_id")
    .notNull()
    .references(() => medicines.id),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 0 })
    .default("0")
    .notNull(),
});

/* --------------------------- پیگیری و تعاملات -------------------------- */
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  type: text("type").default("تماس").notNull(),
  subject: text("subject").notNull(),
  message: text("message"),
  dueDate: date("due_date"),
  status: text("status").default("باز").notNull(),
  assignedTo: text("assigned_to").default("دکتر رضایی").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/* ------------------------------- کمپین‌ها ------------------------------ */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  channel: text("channel").default("پیامک").notNull(),
  audience: text("audience").default("همه مشتریان").notNull(),
  message: text("message").notNull(),
  status: text("status").default("پیش‌نویس").notNull(),
  scheduledFor: date("scheduled_for"),
  sentCount: integer("sent_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type Medicine = typeof medicines.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Interaction = typeof interactions.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
