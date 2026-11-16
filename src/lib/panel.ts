import { randomUUID } from "node:crypto";
import { ensureSchema, query } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { creditCycle } from "@/lib/credit-cycle";
import { writeActivity } from "@/lib/activity";

export type Appointment = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  service: string;
  staff_name: string;
  starts_at: string;
  status: string;
};

export type Order = {
  id: string;
  customer_name: string;
  summary: string;
  total_label: string;
  status: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  price_label: string;
  in_stock: boolean;
};

export type Conversation = {
  id: string;
  channel: string;
  customer_name: string;
  question: string;
  answer: string;
  taken_over: boolean;
  created_at: string;
};

export type Knowledge = {
  id: string;
  kind: string;
  title: string;
  body: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  emails: string;
  other_contact: string;
  contact_person: string;
  address: string;
  shipping_address: string;
  tax_office: string;
  tax_number: string;
  tax_exempt: boolean;
  bank_info: string;
  currency: string;
  risk_limit_kurus: number | null;
  due_days: number | null;
  discount_percent: number | null;
  price_list: string;
  opening_balance_kurus: number;
  class1: string;
  class2: string;
  code: string;
  staff_ids: string;
  image_path: string;
  note: string;
};

export type Supplier = {
  id: string;
  name: string;
  tax_office: string;
  tax_number: string;
  tax_exempt: boolean;
  bank_info: string;
  currency: string;
  due_days: number | null;
  opening_balance_kurus: number;
  contact_person: string;
  emails: string;
  address: string;
  phone: string;
  other_contact: string;
  class1: string;
  class2: string;
  code: string;
  note: string;
};

export type CustomerBranch = {
  id: string;
  name: string;
  address: string;
  code: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  body: string;
  suggestion: string;
  replied: boolean;
};

export type ShopSettings = {
  open_time: string;
  close_time: string;
  closed_days: string;
  reminder_whatsapp: boolean;
  reminder_sms: boolean;
  card_label: string;
  headline: string;
  about: string;
  price_note: string;
  campaign: string;
  public_slug: string;
  address: string;
  bank_info: string;
  logo_path: string;
  tax_office: string;
  tax_number: string;
  notify_appointment: boolean;
  notify_money: boolean;
  notify_expense: boolean;
  notify_credit: boolean;
  notify_subscription: boolean;
};

export type Staff = { id: string; name: string; available: boolean };
export type Invoice = { id: string; period_label: string; amount_label: string; status: string };
export type Campaign = { id: string; body: string; recipient_count: number; created_at: string };

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replaceAll("ğ", "g")
      .replaceAll("ü", "u")
      .replaceAll("ş", "s")
      .replaceAll("ı", "i")
      .replaceAll("ö", "o")
      .replaceAll("ç", "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "dukkan"
  );
}

export function startOfDay(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function localKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDay(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(value);
}

export async function preparePanel(user: SessionUser) {
  await ensureSchema();
  await clearSeededRows(user.id);
  await attachLooseLedger(user.id);
  await attachAppointments(user.id);
  await undoAutomaticCreditPayments(user.id);
  await restoreUnpaidCreditCycle(user.id);
  await syncCreditCycles(user.id);
  await removeAutomaticCreditPeriodExpenses(user.id);
  await postRecurringMasraflar(user.id);

  const slug = slugify(user.business_name);
  const existing = await query<{ user_id: string }>("select user_id from shop_settings where user_id = $1", [user.id]);
  if (!existing[0]) {
    await query("insert into shop_settings (user_id, public_slug, card_label) values ($1, $2, '')", [user.id, slug]);
  }
}

async function attachLooseLedger(userId: string) {
  const loose = await query<{ id: string; kind: string; amount_kurus: number | string }>(
    "select id, kind, amount_kurus from ledger where user_id = $1 and account_id is null",
    [userId],
  );
  if (loose.length === 0) return;
  const kasas = await query<{ id: string }>(
    "select id from finance_accounts where user_id = $1 and kind = 'kasa' and currency = 'TL' order by name limit 1",
    [userId],
  );
  const kasaId = kasas[0]?.id;
  if (!kasaId) return;
  let delta = 0;
  for (const row of loose) {
    const amount = Number(row.amount_kurus);
    delta += row.kind === "gider" ? -amount : amount;
    await query("update ledger set account_id = $1 where id = $2 and user_id = $3", [kasaId, row.id, userId]);
  }
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [delta, kasaId, userId]);
}

async function undoAutomaticCreditPayments(userId: string) {
  const done = await query<{ flag: string }>("select flag from user_flags where user_id = $1 and flag = 'undo-auto-credit-payments'", [userId]);
  if (done[0]) return;
  const rows = await query<{ id: string; account_id: string | null; amount_kurus: number | string; kind: string }>(
    "select id, account_id, amount_kurus, kind from ledger where user_id = $1 and credit_id is not null",
    [userId],
  );
  for (const row of rows) {
    if (row.account_id && row.kind === "gider") {
      await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [Number(row.amount_kurus), row.account_id, userId]);
    }
    await query("delete from ledger where id = $1 and user_id = $2", [row.id, userId]);
  }
  await query("insert into user_flags (user_id, flag) values ($1, 'undo-auto-credit-payments')", [userId]);
}

const creditMonths: Record<string, number> = { aylik: 1, ucaylik: 3, altiaylik: 6, yillik: 12 };

async function restoreUnpaidCreditCycle(userId: string) {
  const done = await query<{ flag: string }>("select flag from user_flags where user_id = $1 and flag = 'restore-unpaid-credit-cycle'", [userId]);
  if (done[0]) return;
  const credits = await query<{ id: string; remaining_kurus: number | string; remaining_installments: number | string; next_due: string | Date; schedule: string }>(
    "select id, remaining_kurus, remaining_installments, next_due, schedule from credits where user_id = $1",
    [userId],
  );
  const paid = await query<{ credit_id: string }>("select distinct credit_id from ledger where user_id = $1 and credit_id is not null", [userId]);
  const paidIds = new Set(paid.map((row) => row.credit_id));
  const today = localKey(new Date());
  for (const credit of credits) {
    if (paidIds.has(credit.id)) continue;
    const left = Number(credit.remaining_installments);
    const remaining = Number(credit.remaining_kurus);
    const months = creditMonths[credit.schedule];
    if (!months || left <= 0 || remaining <= 0 || left >= 144) continue;
    const due = calendarKey(credit.next_due);
    const previous = shiftCreditDue(due, -months);
    if (previous > today || due <= today) continue;
    const payment = Math.round(remaining / left);
    await query(
      "update credits set remaining_kurus = $1, remaining_installments = $2, next_due = $3 where id = $4 and user_id = $5",
      [remaining + payment, left + 1, previous, credit.id, userId],
    );
  }
  await query("insert into user_flags (user_id, flag) values ($1, 'restore-unpaid-credit-cycle')", [userId]);
}

async function syncCreditCycles(userId: string) {
  const rows = await query<{ id: string; remaining_kurus: number | string; period_kurus: number | string | null }>(
    "select id, remaining_kurus, period_kurus from credits where user_id = $1",
    [userId],
  );
  for (const row of rows) {
    const remaining = Number(row.remaining_kurus);
    const cycle = creditCycle(Number(row.period_kurus ?? 0), remaining);
    await query(
      "update credits set period_kurus = $1, minimum_kurus = $2, remaining_installments = $3 where id = $4 and user_id = $5",
      [cycle.period, cycle.minimum, cycle.months, row.id, userId],
    );
  }
}

async function removeAutomaticCreditPeriodExpenses(userId: string) {
  const done = await query<{ flag: string }>(
    "select flag from user_flags where user_id = $1 and flag = 'remove-auto-credit-period-expenses'",
    [userId],
  );
  if (done[0]) return;
  const rows = await query<{ id: string; account_id: string | null; amount_kurus: number | string; kind: string }>(
    "select id, account_id, amount_kurus, kind from ledger where user_id = $1 and credit_payment = 'donem'",
    [userId],
  );
  for (const row of rows) {
    if (row.account_id && row.kind === "gider") {
      await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [Number(row.amount_kurus), row.account_id, userId]);
    }
    await query("delete from ledger where id = $1 and user_id = $2", [row.id, userId]);
  }
  await query("insert into user_flags (user_id, flag) values ($1, 'remove-auto-credit-period-expenses')", [userId]);
}

function shiftCreditDue(iso: string, months: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  return localKey(date);
}

async function postRecurringMasraflar(userId: string) {
  const rules = await query<{
    id: string;
    category: string;
    document_no: string;
    description: string;
    status: string;
    account_id: string | null;
    amount_kurus: number | string;
    vat_rate: number | string;
    repeat_until: string | Date;
    repeat_day: number | string;
  }>(
    `select id, category, document_no, description, status, account_id, amount_kurus, vat_rate, repeat_until, repeat_day
     from masraflar where user_id = $1 and series_id = id and repeat_until is not null`,
    [userId],
  );
  const thisMonth = localKey(new Date()).slice(0, 7);
  for (const rule of rules) {
    const until = calendarKey(rule.repeat_until);
    if (until.slice(0, 7) < thisMonth) continue;
    const day = Math.min(Math.max(Number(rule.repeat_day) || 1, 1), 28);
    const happened = `${thisMonth}-${String(day).padStart(2, "0")}`;
    if (happened > until) continue;
    const existing = await query<{ id: string }>(
      "select id from masraflar where user_id = $1 and series_id = $2 and happened_on >= $3 and happened_on < $4 limit 1",
      [userId, rule.id, `${thisMonth}-01`, nextMonthStart(thisMonth)],
    );
    if (existing[0]) continue;
    const masrafId = randomUUID();
    await query(
      `insert into masraflar (id, user_id, category, happened_on, document_no, description, status, account_id, amount_kurus, vat_rate, series_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [masrafId, userId, rule.category, happened, rule.document_no, rule.description, rule.status, rule.account_id, Number(rule.amount_kurus), Number(rule.vat_rate), rule.id],
    );
    if (rule.status === "odendi" && rule.account_id) {
      const ledgerId = randomUUID();
      await query(
        "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,'gider',$3,$4,$5,$6)",
        [ledgerId, userId, `Masraf: ${rule.category}`, Number(rule.amount_kurus), happened, rule.account_id],
      );
      await query("update masraflar set ledger_id = $1 where id = $2 and user_id = $3", [ledgerId, masrafId, userId]);
      await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [Number(rule.amount_kurus), rule.account_id, userId]);
    }
  }
}

function nextMonthStart(month: string) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value, 1);
  return localKey(date);
}

async function attachAppointments(userId: string) {
  const loose = await query<{ id: string; customer_name: string; phone: string; starts_at: string | Date; status: string }>(
    "select id, customer_name, phone, starts_at, status from appointments where user_id = $1 and customer_id is null",
    [userId],
  );
  for (const row of loose) {
    const customerId = await matchOrCreateCustomer(userId, row.customer_name, row.phone, row.starts_at, row.status !== "iptal");
    await query("update appointments set customer_id = $1 where id = $2 and user_id = $3", [customerId, row.id, userId]);
  }
}

export async function matchOrCreateCustomer(userId: string, name: string, phone: string, when: string | Date, countsVisit: boolean) {
  const digits = phone.replace(/\D/g, "");
  const found = digits
    ? await query<{ id: string }>(
        "select id from customers where user_id = $1 and regexp_replace(phone, '\\D', '', 'g') = $2 limit 1",
        [userId, digits],
      )
    : await query<{ id: string }>("select id from customers where user_id = $1 and name = $2 limit 1", [userId, name]);
  const visit = calendarKey(when);
  if (found[0]) {
    if (countsVisit) {
      await query(
        `update customers set last_visit = case when last_visit < $1::date then $1::date else last_visit end,
          visit_count = visit_count + 1, name = $2, phone = $3 where id = $4 and user_id = $5`,
        [visit, name, phone, found[0].id, userId],
      );
    }
    return found[0].id;
  }
  const customerId = randomUUID();
  await query(
    `insert into customers (id, user_id, name, phone, last_visit, visit_count, note, marketing_ok)
     values ($1,$2,$3,$4,$5,$6,'',false)`,
    [customerId, userId, name, phone, visit, countsVisit ? 1 : 0],
  );
  return customerId;
}

async function clearSeededRows(userId: string) {
  await query(
    "delete from appointments where user_id = $1 and phone in ('05321110001', '05321110002', '05321110003', '05321110004', '05321110005')",
    [userId],
  );
  await query("delete from customers where user_id = $1 and phone in ('05321110001', '05321110002')", [userId]);
  await query("delete from orders where user_id = $1 and customer_name in ('Deniz Usta', 'Ece Nar')", [userId]);
  await query(
    `delete from products where user_id = $1 and (
      (name = 'Kesim' and price_label = '450 ₺') or
      (name = 'Boya' and price_label = '900 ₺') or
      (name = 'Filtre kahve' and price_label = '90 ₺')
    )`,
    [userId],
  );
  await query("delete from staff where user_id = $1 and name in ('Ayşe', 'Mehmet')", [userId]);
  await query(
    "delete from conversations where user_id = $1 and question in ('Yarın 15:00 boş mu?', 'Boya ne kadar?', 'Adresiniz neresi?')",
    [userId],
  );
  await query(
    "delete from knowledge where user_id = $1 and body in ('Boya 900 ₺, yaklaşık 2 saat sürer.', 'Kadıköy, Moda Caddesi No:12', 'Her gün 09:00-19:00, pazar kapalı.')",
    [userId],
  );
  await query(
    "delete from reviews where user_id = $1 and body in ('Çok ilgiliydiler, saçım tam istediğim gibi.', 'Biraz bekledim ama sonuç güzel.')",
    [userId],
  );
  await query("delete from invoices where user_id = $1 and amount_label = '₺1.745' and period_label in ('Ekim 2026', 'Kasım 2026')", [userId]);
  await query(
    `update shop_settings
     set headline = '', about = '', price_note = '', campaign = ''
     where user_id = $1 and about = 'Randevu ve fiyatlar bu sayfada. Aramadan yerini ayır.'`,
    [userId],
  );
  await query("update shop_settings set card_label = '' where user_id = $1 and card_label = 'Kart •••• 4242'", [userId]);
}

export async function listTodayAppointments(userId: string) {
  const start = startOfDay();
  const end = startOfDay(1);
  return query<Appointment>(
    `select id, customer_id, customer_name, phone, service, staff_name, starts_at, status
     from appointments
     where user_id = $1 and starts_at >= $2 and starts_at < $3 and status <> 'iptal'
     order by starts_at`,
    [userId, start.toISOString(), end.toISOString()],
  );
}

export async function listOpenOrders(userId: string) {
  return query<Order>(
    `select id, customer_name, summary, total_label, status, created_at
     from orders where user_id = $1 and status <> 'teslim' order by created_at`,
    [userId],
  );
}

export async function weekCounts(userId: string) {
  const start = startOfDay(-6);
  const messages = await query<{ count: string }>(
    "select count(*)::text as count from conversations where user_id = $1 and created_at >= $2",
    [userId, start.toISOString()],
  );
  const appointments = await query<{ count: string }>(
    "select count(*)::text as count from appointments where user_id = $1 and starts_at >= $2 and status <> 'iptal'",
    [userId, start.toISOString()],
  );
  const visits = await query<{ count: string }>(
    "select count(*)::text as count from customers where user_id = $1 and last_visit >= $2",
    [userId, start.toISOString().slice(0, 10)],
  );
  return {
    messages: Number(messages[0]?.count ?? 0),
    appointments: Number(appointments[0]?.count ?? 0),
    visits: Number(visits[0]?.count ?? 0),
  };
}

export async function pendingSummary(userId: string) {
  const waiting = await query<{ count: string }>(
    "select count(*)::text as count from appointments where user_id = $1 and status = 'bekliyor'",
    [userId],
  );
  const reviews = await query<{ count: string }>(
    "select count(*)::text as count from reviews where user_id = $1 and replied = false",
    [userId],
  );
  return {
    appointments: Number(waiting[0]?.count ?? 0),
    reviews: Number(reviews[0]?.count ?? 0),
  };
}

export async function listAppointments(userId: string, from: Date, to: Date) {
  return query<Appointment>(
    `select id, customer_id, customer_name, phone, service, staff_name, starts_at, status
     from appointments
     where user_id = $1 and starts_at >= $2 and starts_at < $3
     order by starts_at`,
    [userId, from.toISOString(), to.toISOString()],
  );
}

export async function listCustomerAppointments(userId: string, customerId: string) {
  return query<{ id: string; service: string; staff_name: string; starts_at: string; status: string }>(
    `select id, service, staff_name, starts_at, status
     from appointments where user_id = $1 and customer_id = $2
     order by starts_at desc`,
    [userId, customerId],
  );
}

export async function listNextAppointments(userId: string) {
  return query<{ customer_id: string; starts_at: string; service: string }>(
    `select distinct on (customer_id) customer_id, starts_at::text, service
     from appointments
     where user_id = $1 and customer_id is not null and status <> 'iptal' and starts_at >= now()
     order by customer_id, starts_at`,
    [userId],
  );
}

export async function getSettings(userId: string) {
  const rows = await query<ShopSettings>(
    `select open_time, close_time, closed_days, reminder_whatsapp, reminder_sms, card_label,
            headline, about, price_note, campaign, public_slug, address, bank_info, logo_path,
            tax_office, tax_number, notify_appointment, notify_money, notify_expense, notify_credit, notify_subscription
     from shop_settings where user_id = $1`,
    [userId],
  );
  return rows[0];
}

export async function listStaff(userId: string) {
  return query<Staff>("select id, name, available from staff where user_id = $1 order by name", [userId]);
}

export async function listProducts(userId: string) {
  return query<Product>("select id, name, price_label, in_stock from products where user_id = $1 order by name", [userId]);
}

export async function listConversations(userId: string) {
  return query<Conversation>(
    `select id, channel, customer_name, question, answer, taken_over, created_at
     from conversations where user_id = $1 order by created_at desc`,
    [userId],
  );
}

export async function listKnowledge(userId: string) {
  return query<Knowledge>("select id, kind, title, body from knowledge where user_id = $1 order by kind", [userId]);
}

const customerColumns = `id, name, phone, emails, other_contact, contact_person, address, shipping_address,
  tax_office, tax_number, tax_exempt, bank_info, currency, risk_limit_kurus, due_days, discount_percent,
  price_list, opening_balance_kurus, class1, class2, code, staff_ids, image_path, note`;

export async function listCustomers(userId: string) {
  const rows = await query<Customer & { risk_limit_kurus: number | string | null; opening_balance_kurus: number | string; discount_percent: number | string | null; due_days: number | string | null }>(
    `select ${customerColumns} from customers where user_id = $1 order by name`,
    [userId],
  );
  return rows.map(normalizeCustomer);
}

export async function getCustomer(userId: string, customerId: string) {
  const rows = await listCustomers(userId);
  return rows.find((item) => item.id === customerId) ?? null;
}

export type FinanceAccount = {
  id: string;
  kind: "kasa" | "pos" | "kart" | "banka" | "ortak" | "veresiye";
  name: string;
  currency: string;
  balanceKurus: number;
  detail: string;
  movementCount: number;
};

export async function listFinanceAccounts(userId: string): Promise<FinanceAccount[]> {
  const rows = await query<{ id: string; kind: string; name: string; currency: string; balance_kurus: number | string; detail: string; movement_count: number | string }>(
    `select finance_accounts.id, finance_accounts.kind, finance_accounts.name, finance_accounts.currency,
            finance_accounts.balance_kurus, finance_accounts.detail, count(ledger.id)::text as movement_count
     from finance_accounts
     left join ledger on ledger.account_id = finance_accounts.id
     where finance_accounts.user_id = $1
     group by finance_accounts.id
     order by finance_accounts.name`,
    [userId],
  );
  return rows.flatMap((row) => {
    if (row.kind !== "kasa" && row.kind !== "pos" && row.kind !== "kart" && row.kind !== "banka" && row.kind !== "ortak" && row.kind !== "veresiye") return [];
    return [{
      id: row.id,
      kind: row.kind,
      name: row.name,
      currency: row.currency,
      balanceKurus: Number(row.balance_kurus),
      detail: row.detail,
      movementCount: Number(row.movement_count),
    }];
  });
}

export type Credit = {
  id: string;
  name: string;
  kind: string;
  remainingKurus: number;
  remainingInstallments: number;
  nextDue: string;
  schedule: string;
  accountId: string;
  accountName: string;
  currency: string;
  note: string;
  minimumKurus: number | null;
  periodKurus: number;
  lastPaymentId: string | null;
};

export async function listCredits(userId: string): Promise<Credit[]> {
  const rows = await query<{
    id: string;
    name: string;
    kind: string;
    remaining_kurus: number | string;
    remaining_installments: number | string;
    next_due: string | Date;
    schedule: string;
    account_id: string;
    account_name: string;
    currency: string;
    note: string;
    minimum_kurus: number | string | null;
    period_kurus: number | string | null;
  }>(
    `select credits.id, credits.name, credits.kind, credits.remaining_kurus, credits.remaining_installments, credits.next_due,
            credits.schedule, credits.account_id, finance_accounts.name as account_name, finance_accounts.currency, credits.note,
            credits.minimum_kurus, credits.period_kurus
     from credits
     join finance_accounts on finance_accounts.id = credits.account_id
     where credits.user_id = $1
     order by credits.next_due`,
    [userId],
  );
  const payments = rows.length
    ? await query<{ id: string; credit_id: string }>(
        `select distinct on (credit_id) id, credit_id
         from ledger
         where user_id = $1 and credit_id is not null and kind = 'gider' and credit_payment in ('taksit', 'asgari')
         order by credit_id, happened_on desc, created_at desc`,
        [userId],
      )
    : [];
  const lastPayment = new Map(payments.map((row) => [row.credit_id, row.id]));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind || "taksitli",
    remainingKurus: Number(row.remaining_kurus),
    remainingInstallments: Number(row.remaining_installments),
    nextDue: calendarKey(row.next_due),
    schedule: row.schedule,
    accountId: row.account_id,
    accountName: row.account_name,
    currency: row.currency,
    note: row.note,
    minimumKurus: row.minimum_kurus == null ? null : Number(row.minimum_kurus),
    periodKurus: Number(row.period_kurus ?? row.remaining_kurus),
    lastPaymentId: lastPayment.get(row.id) ?? null,
  }));
}

export type Masraf = {
  id: string;
  category: string;
  date: string;
  documentNo: string;
  description: string;
  status: string;
  accountId: string;
  accountName: string;
  amountKurus: number;
  vatRate: number;
  repeatUntil: string;
};

export async function listMasraflar(userId: string): Promise<Masraf[]> {
  const rows = await query<{
    id: string;
    category: string;
    happened_on: string | Date;
    document_no: string;
    description: string;
    status: string;
    account_id: string | null;
    account_name: string | null;
    amount_kurus: number | string;
    vat_rate: number | string;
    repeat_until: string | Date | null;
  }>(
    `select masraflar.id, masraflar.category, masraflar.happened_on, masraflar.document_no, masraflar.description,
            masraflar.status, masraflar.account_id, finance_accounts.name as account_name, masraflar.amount_kurus,
            masraflar.vat_rate, masraflar.repeat_until
     from masraflar
     left join finance_accounts on finance_accounts.id = masraflar.account_id
     where masraflar.user_id = $1
     order by masraflar.happened_on desc`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    date: calendarKey(row.happened_on),
    documentNo: row.document_no,
    description: row.description,
    status: row.status,
    accountId: row.account_id ?? "",
    accountName: row.account_name ?? "",
    amountKurus: Number(row.amount_kurus),
    vatRate: Number(row.vat_rate),
    repeatUntil: row.repeat_until ? calendarKey(row.repeat_until) : "",
  }));
}

export async function listAccountMovements(userId: string, accountId: string) {
  const rows = await query<{ id: string; kind: string; title: string; amount_kurus: number | string; happened_on: string | Date }>(
    `select id, kind, title, amount_kurus, happened_on
     from ledger
     where user_id = $1 and account_id = $2
     order by happened_on asc, created_at asc`,
    [userId, accountId],
  );
  return rows
    .filter((row) => row.kind === "gelir" || row.kind === "gider")
    .map((row) => ({
      id: row.id,
      kind: row.kind as "gelir" | "gider",
      title: row.title,
      amountKurus: Number(row.amount_kurus),
      date: calendarKey(row.happened_on),
    }));
}

export async function listSuppliers(userId: string) {
  const rows = await query<Supplier & { due_days: number | string | null; opening_balance_kurus: number | string }>(
    `select id, name, tax_office, tax_number, tax_exempt, bank_info, currency, due_days, opening_balance_kurus,
      contact_person, emails, address, phone, other_contact, class1, class2, code, note
     from suppliers where user_id = $1 order by name`,
    [userId],
  );
  return rows.map((row) => ({
    ...row,
    tax_exempt: Boolean(row.tax_exempt),
    due_days: row.due_days == null ? null : Number(row.due_days),
    opening_balance_kurus: Number(row.opening_balance_kurus ?? 0),
  }));
}

export async function getSupplier(userId: string, supplierId: string) {
  const rows = await listSuppliers(userId);
  return rows.find((item) => item.id === supplierId) ?? null;
}

export async function listBranches(userId: string, customerId: string) {
  return query<CustomerBranch>(
    "select id, name, address, code from customer_branches where user_id = $1 and customer_id = $2 order by name",
    [userId, customerId],
  );
}

function normalizeCustomer(row: Customer & { risk_limit_kurus: number | string | null; opening_balance_kurus: number | string; discount_percent: number | string | null; due_days: number | string | null }): Customer {
  return {
    ...row,
    tax_exempt: Boolean(row.tax_exempt),
    risk_limit_kurus: row.risk_limit_kurus == null ? null : Number(row.risk_limit_kurus),
    due_days: row.due_days == null ? null : Number(row.due_days),
    discount_percent: row.discount_percent == null ? null : Number(row.discount_percent),
    opening_balance_kurus: Number(row.opening_balance_kurus ?? 0),
  };
}

export async function listCampaigns(userId: string) {
  return query<Campaign>(
    "select id, body, recipient_count, created_at from campaigns where user_id = $1 order by created_at desc",
    [userId],
  );
}

export async function listReviews(userId: string) {
  return query<Review>(
    "select id, author, rating, body, suggestion, replied from reviews where user_id = $1 order by replied, rating desc",
    [userId],
  );
}

export type LedgerRow = {
  id: string;
  kind: "gelir" | "gider";
  title: string;
  amountKurus: number;
  date: string;
  accountName: string;
  currency: string;
};

export function formatMoney(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);
}

export type SaleLine = {
  id: string;
  name: string;
  qty: number;
  unitKurus: number;
  vatRate: number;
  vatKurus: number;
  totalKurus: number;
};

export type Sale = {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  currency: string;
  status: string;
  accountName: string;
  netKurus: number;
  vatKurus: number;
  totalKurus: number;
  lines: SaleLine[];
};

export async function listSales(userId: string): Promise<Sale[]> {
  const sales = await query<{
    id: string;
    title: string;
    customer_id: string | null;
    customer_name: string;
    customer_phone: string | null;
    happened_on: string | Date;
    currency: string;
    status: string;
    account_name: string | null;
    net_kurus: number | string;
    vat_kurus: number | string;
    total_kurus: number | string;
  }>(
    `select sales.id, sales.title, sales.customer_id, sales.customer_name, customers.phone as customer_phone,
            sales.happened_on, sales.currency, sales.status, finance_accounts.name as account_name,
            sales.net_kurus, sales.vat_kurus, sales.total_kurus
     from sales
     left join finance_accounts on finance_accounts.id = sales.account_id
     left join customers on customers.id = sales.customer_id
     where sales.user_id = $1
     order by sales.happened_on desc, sales.title`,
    [userId],
  );
  const lines = await query<{
    id: string;
    sale_id: string;
    name: string;
    qty: number | string;
    unit_kurus: number | string;
    vat_rate: number | string;
    vat_kurus: number | string;
    total_kurus: number | string;
  }>("select id, sale_id, name, qty, unit_kurus, vat_rate, vat_kurus, total_kurus from sale_lines where user_id = $1", [userId]);
  return sales.map((sale) => ({
    id: sale.id,
    title: sale.title,
    customerId: sale.customer_id ?? "",
    customerName: sale.customer_name,
    customerPhone: sale.customer_phone ?? "",
    date: calendarKey(sale.happened_on),
    currency: sale.currency,
    status: sale.status,
    accountName: sale.account_name ?? "",
    netKurus: Number(sale.net_kurus),
    vatKurus: Number(sale.vat_kurus),
    totalKurus: Number(sale.total_kurus),
    lines: lines
      .filter((line) => line.sale_id === sale.id)
      .map((line) => ({
        id: line.id,
        name: line.name,
        qty: Number(line.qty),
        unitKurus: Number(line.unit_kurus),
        vatRate: Number(line.vat_rate),
        vatKurus: Number(line.vat_kurus),
        totalKurus: Number(line.total_kurus),
      })),
  }));
}

export async function getSale(userId: string, saleId: string): Promise<Sale | null> {
  const sales = await query<{
    id: string;
    title: string;
    customer_id: string | null;
    customer_name: string;
    customer_phone: string | null;
    happened_on: string | Date;
    currency: string;
    status: string;
    account_name: string | null;
    net_kurus: number | string;
    vat_kurus: number | string;
    total_kurus: number | string;
  }>(
    `select sales.id, sales.title, sales.customer_id, sales.customer_name, customers.phone as customer_phone,
            sales.happened_on, sales.currency, sales.status, finance_accounts.name as account_name,
            sales.net_kurus, sales.vat_kurus, sales.total_kurus
     from sales
     left join finance_accounts on finance_accounts.id = sales.account_id
     left join customers on customers.id = sales.customer_id
     where sales.user_id = $1 and sales.id = $2`,
    [userId, saleId],
  );
  if (!sales[0]) return null;
  const lines = await query<{
    id: string;
    name: string;
    qty: number | string;
    unit_kurus: number | string;
    vat_rate: number | string;
    vat_kurus: number | string;
    total_kurus: number | string;
  }>("select id, name, qty, unit_kurus, vat_rate, vat_kurus, total_kurus from sale_lines where user_id = $1 and sale_id = $2", [userId, saleId]);

  return {
    id: sales[0].id,
    title: sales[0].title,
    customerId: sales[0].customer_id ?? "",
    customerName: sales[0].customer_name,
    customerPhone: sales[0].customer_phone ?? "",
    date: calendarKey(sales[0].happened_on),
    currency: sales[0].currency,
    status: sales[0].status,
    accountName: sales[0].account_name ?? "",
    netKurus: Number(sales[0].net_kurus),
    vatKurus: Number(sales[0].vat_kurus),
    totalKurus: Number(sales[0].total_kurus),
    lines: lines.map((line) => ({
      id: line.id,
      name: line.name,
      qty: Number(line.qty),
      unitKurus: Number(line.unit_kurus),
      vatRate: Number(line.vat_rate),
      vatKurus: Number(line.vat_kurus),
      totalKurus: Number(line.total_kurus),
    })),
  };
}

export type CariMovement = {
  id: string;
  date: string;
  kind: "devir" | "satis" | "tahsilat" | "odeme";
  kindLabel: string;
  title: string;
  debitKurus: number;
  creditKurus: number;
  balanceKurus: number;
  accountName?: string;
  saleId?: string;
};

export type CustomerStatement = {
  customer: Customer;
  currency: string;
  openingBalanceKurus: number;
  totalSalesKurus: number;
  totalPaidKurus: number;
  currentBalanceKurus: number;
  movements: CariMovement[];
};

export async function getCustomerStatement(userId: string, customerId: string): Promise<CustomerStatement | null> {
  const customer = await getCustomer(userId, customerId);
  if (!customer) return null;

  const [sales, payments] = await Promise.all([
    query<{
      id: string;
      title: string;
      total_kurus: number | string;
      status: string;
      happened_on: string | Date;
      account_name: string | null;
    }>(
      `select sales.id, sales.title, sales.total_kurus, sales.status, sales.happened_on, finance_accounts.name as account_name
       from sales
       left join finance_accounts on finance_accounts.id = sales.account_id
       where sales.user_id = $1 and sales.customer_id = $2
       order by sales.happened_on asc, sales.created_at asc`,
      [userId, customerId],
    ),
    query<{
      id: string;
      title: string;
      amount_kurus: number | string;
      happened_on: string | Date;
      account_name: string | null;
    }>(
      `select ledger.id, ledger.title, ledger.amount_kurus, ledger.happened_on, finance_accounts.name as account_name
       from ledger
       left join finance_accounts on finance_accounts.id = ledger.account_id
       where ledger.user_id = $1 and ledger.customer_id = $2 and ledger.kind = 'gelir'
       order by ledger.happened_on asc, ledger.created_at asc`,
      [userId, customerId],
    ),
  ]);

  type RawItem = {
    date: string;
    sortKey: string;
    kind: "devir" | "satis" | "tahsilat";
    kindLabel: string;
    title: string;
    debitKurus: number;
    creditKurus: number;
    accountName?: string;
    saleId?: string;
  };

  const raw: RawItem[] = [];

  if (customer.opening_balance_kurus !== 0) {
    const isDebt = customer.opening_balance_kurus > 0;
    raw.push({
      date: "",
      sortKey: "0000-00-00_0",
      kind: "devir",
      kindLabel: "Açılış Bakiyesi",
      title: "Açılış Devir Bakiyesi",
      debitKurus: isDebt ? customer.opening_balance_kurus : 0,
      creditKurus: isDebt ? 0 : Math.abs(customer.opening_balance_kurus),
    });
  }

  let totalSales = 0;
  let totalPaid = 0;

  for (const sale of sales) {
    const amount = Number(sale.total_kurus);
    totalSales += amount;
    const date = calendarKey(sale.happened_on);

    raw.push({
      date,
      sortKey: `${date}_1_${sale.id}`,
      kind: "satis",
      kindLabel: "Satış Makbuzu",
      title: sale.title,
      debitKurus: amount,
      creditKurus: 0,
      saleId: sale.id,
      accountName: sale.account_name ?? "",
    });

    if (sale.status === "tahsil") {
      totalPaid += amount;
      raw.push({
        date,
        sortKey: `${date}_2_${sale.id}`,
        kind: "tahsilat",
        kindLabel: "Peşin Tahsilat",
        title: `Tahsil Edildi: ${sale.title}`,
        debitKurus: 0,
        creditKurus: amount,
        saleId: sale.id,
        accountName: sale.account_name ?? "",
      });
    }
  }

  for (const pay of payments) {
    const amount = Number(pay.amount_kurus);
    totalPaid += amount;
    const date = calendarKey(pay.happened_on);
    raw.push({
      date,
      sortKey: `${date}_3_${pay.id}`,
      kind: "tahsilat",
      kindLabel: "Cari Tahsilat",
      title: pay.title,
      debitKurus: 0,
      creditKurus: amount,
      accountName: pay.account_name ?? "",
    });
  }

  raw.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  let running = 0;
  const movements: CariMovement[] = raw.map((item, idx) => {
    running = running + item.debitKurus - item.creditKurus;
    return {
      id: `${item.kind}-${idx}`,
      date: item.date,
      kind: item.kind,
      kindLabel: item.kindLabel,
      title: item.title,
      debitKurus: item.debitKurus,
      creditKurus: item.creditKurus,
      balanceKurus: running,
      accountName: item.accountName,
      saleId: item.saleId,
    };
  });

  return {
    customer,
    currency: customer.currency || "TL",
    openingBalanceKurus: customer.opening_balance_kurus,
    totalSalesKurus: totalSales,
    totalPaidKurus: totalPaid,
    currentBalanceKurus: running,
    movements,
  };
}

export type SupplierStatement = {
  supplier: Supplier;
  currency: string;
  openingBalanceKurus: number;
  totalPaidKurus: number;
  currentBalanceKurus: number;
  movements: CariMovement[];
};

export async function getSupplierStatement(userId: string, supplierId: string): Promise<SupplierStatement | null> {
  const supplier = await getSupplier(userId, supplierId);
  if (!supplier) return null;

  const payments = await query<{
    id: string;
    title: string;
    amount_kurus: number | string;
    happened_on: string | Date;
    account_name: string | null;
  }>(
    `select ledger.id, ledger.title, ledger.amount_kurus, ledger.happened_on, finance_accounts.name as account_name
     from ledger
     left join finance_accounts on finance_accounts.id = ledger.account_id
     where ledger.user_id = $1 and ledger.supplier_id = $2 and ledger.kind = 'gider'
     order by ledger.happened_on asc, ledger.created_at asc`,
    [userId, supplierId],
  );

  type RawItem = {
    date: string;
    sortKey: string;
    kind: "devir" | "odeme";
    kindLabel: string;
    title: string;
    debitKurus: number;
    creditKurus: number;
    accountName?: string;
  };

  const raw: RawItem[] = [];

  if (supplier.opening_balance_kurus !== 0) {
    const isOurDebt = supplier.opening_balance_kurus > 0;
    raw.push({
      date: "",
      sortKey: "0000-00-00_0",
      kind: "devir",
      kindLabel: "Açılış Bakiyesi",
      title: "Açılış Devir Bakiyesi",
      debitKurus: isOurDebt ? 0 : Math.abs(supplier.opening_balance_kurus),
      creditKurus: isOurDebt ? supplier.opening_balance_kurus : 0,
    });
  }

  let totalPaid = 0;
  for (const pay of payments) {
    const amount = Number(pay.amount_kurus);
    totalPaid += amount;
    const date = calendarKey(pay.happened_on);
    raw.push({
      date,
      sortKey: `${date}_1_${pay.id}`,
      kind: "odeme",
      kindLabel: "Tedarikçi Ödemesi",
      title: pay.title,
      debitKurus: amount,
      creditKurus: 0,
      accountName: pay.account_name ?? "",
    });
  }

  raw.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  let running = 0;
  const movements: CariMovement[] = raw.map((item, idx) => {
    running = running + item.creditKurus - item.debitKurus;
    return {
      id: `ted-${idx}`,
      date: item.date,
      kind: item.kind,
      kindLabel: item.kindLabel,
      title: item.title,
      debitKurus: item.debitKurus,
      creditKurus: item.creditKurus,
      balanceKurus: running,
      accountName: item.accountName,
    };
  });

  return {
    supplier,
    currency: supplier.currency || "TL",
    openingBalanceKurus: supplier.opening_balance_kurus,
    totalPaidKurus: totalPaid,
    currentBalanceKurus: running,
    movements,
  };
}

export type CatalogItem = {
  name: string;
  price: string;
  priceKurus: number;
  vatRate: number;
};

export async function listCatalogItems(userId: string): Promise<CatalogItem[]> {
  const [products, lines] = await Promise.all([
    query<{ name: string; price_label: string; price_kurus: number | string | null; vat_rate: number | string | null }>(
      "select name, price_label, price_kurus, vat_rate from products where user_id = $1 order by name",
      [userId],
    ),
    query<{ name: string; unit_kurus: number | string; vat_rate: number | string }>(
      `select distinct on (lower(trim(name))) name, unit_kurus, vat_rate
       from sale_lines
       where user_id = $1
       order by lower(trim(name)), id desc`,
      [userId],
    ),
  ]);

  const map = new Map<string, CatalogItem>();

  for (const line of lines) {
    const kurus = Number(line.unit_kurus);
    const key = line.name.trim().toLocaleLowerCase("tr");
    if (!key || kurus <= 0) continue;
    map.set(key, {
      name: line.name.trim(),
      price: (kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      priceKurus: kurus,
      vatRate: Number(line.vat_rate) || 20,
    });
  }

  for (const p of products) {
    const key = p.name.trim().toLocaleLowerCase("tr");
    if (!key) continue;
    const parsedKurus = Number(p.price_kurus) > 0 ? Number(p.price_kurus) : (parseMoney(p.price_label) ?? 0);
    map.set(key, {
      name: p.name.trim(),
      price: parsedKurus > 0 ? (parsedKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "",
      priceKurus: parsedKurus,
      vatRate: Number(p.vat_rate) || 20,
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function parseMoney(value: string) {
  const amount = parseSignedMoney(value);
  if (amount == null || amount <= 0) return null;
  return amount;
}

export function parseSignedMoney(value: string) {
  const cleaned = value.trim().replace(/\s/g, "").replaceAll("₺", "");
  if (!cleaned || cleaned === "-" || cleaned === "+") return null;
  const negative = cleaned.startsWith("-");
  const digits = negative ? cleaned.slice(1) : cleaned;
  const normalized = digits.includes(",") ? digits.replaceAll(".", "").replace(",", ".") : digits;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  const kurus = Math.round(amount * 100);
  return negative ? -kurus : kurus;
}

function calendarKey(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}-${day}`;
}

export async function listLedger(userId: string): Promise<LedgerRow[]> {
  const rows = await query<{ id: string; kind: string; title: string; amount_kurus: number | string; happened_on: string | Date; account_name: string | null; currency: string | null }>(
    `select ledger.id, ledger.kind, ledger.title, ledger.amount_kurus, ledger.happened_on,
            finance_accounts.name as account_name, finance_accounts.currency
     from ledger
     left join finance_accounts on finance_accounts.id = ledger.account_id
     where ledger.user_id = $1
     order by ledger.happened_on desc, ledger.created_at desc`,
    [userId],
  );
  return rows
    .filter((row) => row.kind === "gelir" || row.kind === "gider")
    .map((row) => ({
      id: row.id,
      kind: row.kind as "gelir" | "gider",
      title: row.title,
      amountKurus: Number(row.amount_kurus),
      date: calendarKey(row.happened_on),
      accountName: row.account_name ?? "",
      currency: row.currency ?? "TL",
    }));
}

export async function listInvoices(userId: string) {
  return query<Invoice>("select id, period_label, amount_label, status from invoices where user_id = $1", [userId]);
}

export async function monthStats(userId: string) {
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const countBetween = async (from: Date, to: Date) => {
    const rows = await query<{ count: string }>(
      `select count(*)::text as count from appointments
       where user_id = $1 and starts_at >= $2 and starts_at < $3 and status <> 'iptal'`,
      [userId, from.toISOString(), to.toISOString()],
    );
    return Number(rows[0]?.count ?? 0);
  };
  const messagesBetween = async (from: Date, to: Date) => {
    const rows = await query<{ count: string }>(
      "select count(*)::text as count from conversations where user_id = $1 and created_at >= $2 and created_at < $3",
      [userId, from.toISOString(), to.toISOString()],
    );
    return Number(rows[0]?.count ?? 0);
  };
  const hours = await query<{ hour: string; count: string }>(
    `select to_char(starts_at, 'HH24') as hour, count(*)::text as count
     from appointments where user_id = $1 and starts_at >= $2 and status <> 'iptal'
     group by 1 order by count(*) desc limit 1`,
    [userId, thisStart.toISOString()],
  );
  return {
    appointments: await countBetween(thisStart, now),
    lastAppointments: await countBetween(lastStart, thisStart),
    messages: await messagesBetween(thisStart, now),
    lastMessages: await messagesBetween(lastStart, thisStart),
    busiestHour: hours[0]?.hour ? `${hours[0].hour}:00` : "—",
  };
}
