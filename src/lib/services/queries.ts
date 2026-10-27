/** Server-side read queries for dashboard KPIs and reporting summaries. */

import { db } from "@/db";
import { ensureSeeded } from "@/lib/seed";
import { sql, type SQL } from "drizzle-orm";

type Row = Record<string, unknown>;

async function q<T extends Row>(statement: SQL): Promise<T[]> {
  const res = await db.execute<T>(statement);
  return res.rows as T[];
}

export type Kpi = {
  total_customers: string;
  new_customers: string;
  today_sales: string;
  today_invoices: string;
  month_sales: string;
  month_invoices: string;
  pending_rx: string;
  low_stock: string;
  expiring: string;
  due_followups: string;
  avg_basket: string;
  inventory_value: string;
};

export async function getDashboard() {
  await ensureSeeded();

  const kpiRows = await q<Kpi>(sql`
    select
      (select count(*) from customers)::text as total_customers,
      (select count(*) from customers where created_at >= date_trunc('month', now()))::text as new_customers,
      (select coalesce(sum(final_amount),0) from sales where created_at::date = current_date)::text as today_sales,
      (select count(*) from sales where created_at::date = current_date)::text as today_invoices,
      (select coalesce(sum(final_amount),0) from sales where created_at >= date_trunc('month', now()))::text as month_sales,
      (select count(*) from sales where created_at >= date_trunc('month', now()))::text as month_invoices,
      (select count(*) from prescriptions where status = 'در انتظار')::text as pending_rx,
      (select count(*) from medicines where stock <= reorder_level)::text as low_stock,
      (select count(*) from medicines where expiry_date <= current_date + interval '180 days')::text as expiring,
      (select count(*) from interactions where status = 'باز' and due_date <= current_date)::text as due_followups,
      (select coalesce(round(avg(final_amount)),0) from sales)::text as avg_basket,
      (select coalesce(sum(price * stock),0) from medicines)::text as inventory_value
  `);

  const series = await q<{ day: string; total: string; cnt: string }>(sql`
    select to_char(d::date, 'YYYY-MM-DD') as day,
           coalesce(sum(s.final_amount), 0)::text as total,
           count(s.id)::text as cnt
    from generate_series(current_date - interval '13 days', current_date, interval '1 day') d
    left join sales s on s.created_at::date = d::date
    group by d
    order by d
  `);

  const topMedicines = await q<{ name: string; qty: string; revenue: string }>(sql`
    select m.name, sum(si.quantity)::text as qty, sum(si.line_total)::text as revenue
    from sale_items si
    join medicines m on m.id = si.medicine_id
    group by m.name
    order by sum(si.line_total) desc
    limit 6
  `);

  const topCustomers = await q<{
    id: string;
    full_name: string;
    loyalty_tier: string;
    total_spent: string;
    visits_count: string;
  }>(sql`
    select id::text, full_name, loyalty_tier, total_spent::text, visits_count::text
    from customers
    order by total_spent desc
    limit 6
  `);

  const categories = await q<{ category: string; revenue: string }>(sql`
    select m.category, sum(si.line_total)::text as revenue
    from sale_items si
    join medicines m on m.id = si.medicine_id
    group by m.category
    order by sum(si.line_total) desc
    limit 6
  `);

  const lowStock = await q<{
    id: string;
    name: string;
    stock: string;
    reorder_level: string;
    category: string;
  }>(sql`
    select id::text, name, stock::text, reorder_level::text, category
    from medicines
    where stock <= reorder_level
    order by stock asc
    limit 6
  `);

  const expiring = await q<{ id: string; name: string; expiry_date: string }>(sql`
    select id::text, name, expiry_date::text
    from medicines
    where expiry_date is not null and expiry_date <= current_date + interval '180 days'
    order by expiry_date asc
    limit 6
  `);

  const followups = await q<{
    id: string;
    subject: string;
    type: string;
    due_date: string;
    full_name: string;
    phone: string;
  }>(sql`
    select i.id::text, i.subject, i.type, i.due_date::text, c.full_name, c.phone
    from interactions i
    join customers c on c.id = i.customer_id
    where i.status = 'باز'
    order by i.due_date asc
    limit 6
  `);

  const recentSales = await q<{
    id: string;
    invoice_no: string;
    full_name: string | null;
    final_amount: string;
    created_at: string;
    payment_method: string;
  }>(sql`
    select s.id::text, s.invoice_no, c.full_name, s.final_amount::text,
           s.created_at::text, s.payment_method
    from sales s
    left join customers c on c.id = s.customer_id
    order by s.created_at desc
    limit 7
  `);

  const birthdays = await q<{
    id: string;
    full_name: string;
    phone: string;
    birth_date: string;
  }>(sql`
    select id::text, full_name, phone, birth_date::text
    from customers
    where birth_date is not null
      and extract(month from birth_date) = extract(month from current_date)
    order by extract(day from birth_date)
    limit 5
  `);

  const rxStatus = await q<{ status: string; cnt: string }>(sql`
    select status, count(*)::text as cnt from prescriptions group by status
  `);

  return {
    kpi: kpiRows[0],
    series,
    topMedicines,
    topCustomers,
    categories,
    lowStock,
    expiring,
    followups,
    recentSales,
    birthdays,
    rxStatus,
  };
}

export async function getReports() {
  await ensureSeeded();

  const monthly = await q<{ month: string; total: string; cnt: string }>(sql`
    select to_char(d, 'YYYY-MM') as month,
           coalesce(sum(s.final_amount), 0)::text as total,
           count(s.id)::text as cnt
    from generate_series(date_trunc('month', current_date) - interval '5 months',
                         date_trunc('month', current_date), interval '1 month') d
    left join sales s on date_trunc('month', s.created_at) = d
    group by d order by d
  `);

  const byCategory = await q<{ category: string; revenue: string; qty: string }>(sql`
    select m.category, sum(si.line_total)::text as revenue, sum(si.quantity)::text as qty
    from sale_items si join medicines m on m.id = si.medicine_id
    group by m.category order by sum(si.line_total) desc
  `);

  const byInsurance = await q<{ insurance: string; cnt: string; spent: string }>(sql`
    select insurance, count(*)::text as cnt, coalesce(sum(total_spent),0)::text as spent
    from customers group by insurance order by sum(total_spent) desc
  `);

  const tiers = await q<{ loyalty_tier: string; cnt: string; spent: string }>(sql`
    select loyalty_tier, count(*)::text as cnt, coalesce(sum(total_spent),0)::text as spent
    from customers group by loyalty_tier
  `);

  const topProducts = await q<{
    name: string;
    category: string;
    qty: string;
    revenue: string;
  }>(sql`
    select m.name, m.category, sum(si.quantity)::text as qty, sum(si.line_total)::text as revenue
    from sale_items si join medicines m on m.id = si.medicine_id
    group by m.name, m.category order by sum(si.line_total) desc limit 12
  `);

  const topCustomers = await q<{
    id: string;
    full_name: string;
    phone: string;
    loyalty_tier: string;
    total_spent: string;
    visits_count: string;
  }>(sql`
    select id::text, full_name, phone, loyalty_tier, total_spent::text, visits_count::text
    from customers order by total_spent desc limit 12
  `);

  const inactive = await q<{
    id: string;
    full_name: string;
    phone: string;
    last_visit_at: string | null;
  }>(sql`
    select id::text, full_name, phone, last_visit_at::text
    from customers
    where last_visit_at is null or last_visit_at < now() - interval '30 days'
    order by last_visit_at asc nulls first
    limit 10
  `);

  const payments = await q<{ payment_method: string; cnt: string; total: string }>(sql`
    select payment_method, count(*)::text as cnt, sum(final_amount)::text as total
    from sales group by payment_method order by sum(final_amount) desc
  `);

  return {
    monthly,
    byCategory,
    byInsurance,
    tiers,
    topProducts,
    topCustomers,
    inactive,
    payments,
  };
}
