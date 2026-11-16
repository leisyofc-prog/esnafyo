"use server";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { currencies, normalizeCurrency } from "@/lib/currencies";
import { masrafCategories } from "@/lib/masraf-categories";
import { requireFeature } from "@/lib/plan-guard";
import { site } from "@/content/site";
import { creditCycle } from "@/lib/credit-cycle";
import { matchOrCreateCustomer, parseMoney, parseSignedMoney } from "@/lib/panel";
import { writeActivity } from "@/lib/activity";

async function userId() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user.id;
}

function refresh(path: string) {
  revalidatePath(path);
  revalidatePath("/panel");
}

function record(userId: string, area: string, action: string, detail: string) {
  return writeActivity({ userId, area, action, detail });
}

export async function addAppointment(formData: FormData) {
  const id = await userId();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const staff = String(formData.get("staff") ?? "").trim();
  const when = String(formData.get("when") ?? "");
  if (!name || !phone || !service || !staff || !when) return;
  const whenDate = new Date(when);
  const customerId = await matchOrCreateCustomer(id, name, phone, whenDate, true);
  await query(
    `insert into appointments (id, user_id, customer_id, customer_name, phone, service, staff_name, starts_at, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'bekliyor')`,
    [randomUUID(), id, customerId, name, phone, service, staff, whenDate.toISOString()],
  );
  await record(id, "randevu", "Randevu ekledi", `${name} · ${service}`);
  refresh("/panel/randevular");
  refresh("/panel/musteriler");
  refresh(`/panel/musteriler/${customerId}`);
}

export async function setAppointmentStatus(formData: FormData) {
  const id = await userId();
  const appointmentId = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["onayli", "iptal", "bekliyor"].includes(status)) return;
  await query("update appointments set status = $1 where id = $2 and user_id = $3", [status, appointmentId, id]);
  await record(id, "randevu", "Randevu durumu", status);
  refresh("/panel/randevular");
  refresh("/panel/musteriler");
}

export async function postponeAppointment(formData: FormData) {
  const id = await userId();
  const appointmentId = String(formData.get("id") ?? "");
  await query(
    `update appointments
     set starts_at = starts_at + interval '1 day', status = 'bekliyor'
     where id = $1 and user_id = $2`,
    [appointmentId, id],
  );
  refresh("/panel/randevular");
}

export async function saveHours(formData: FormData) {
  const id = await userId();
  await query(
    `update shop_settings set open_time = $1, close_time = $2, closed_days = $3,
      reminder_whatsapp = $4, reminder_sms = $5 where user_id = $6`,
    [
      String(formData.get("open") ?? "09:00"),
      String(formData.get("close") ?? "19:00"),
      String(formData.get("closed") ?? ""),
      formData.get("whatsapp") === "on",
      formData.get("sms") === "on",
      id,
    ],
  );
  refresh("/panel/randevular");
}

export async function toggleStaff(formData: FormData) {
  const id = await userId();
  const staffId = String(formData.get("id") ?? "");
  await query("update staff set available = not available where id = $1 and user_id = $2", [staffId, id]);
  refresh("/panel/randevular");
}

export async function takeOver(formData: FormData) {
  const id = await userId();
  await query("update conversations set taken_over = true where id = $1 and user_id = $2", [
    String(formData.get("id") ?? ""),
    id,
  ]);
  refresh("/panel/asistan");
}

export async function addKnowledge(formData: FormData) {
  const id = await userId();
  const kind = String(formData.get("kind") ?? "sss");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await query("insert into knowledge (id, user_id, kind, title, body) values ($1,$2,$3,$4,$5)", [
    randomUUID(),
    id,
    kind,
    title,
    body,
  ]);
  refresh("/panel/asistan");
}

export async function saveCustomer(formData: FormData) {
  const user = await userId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existingId = String(formData.get("id") ?? "");
  const customerId = existingId || randomUUID();
  const risk = optionalMoney(String(formData.get("risk") ?? ""));
  const opening = parseSignedMoney(String(formData.get("opening") ?? "")) ?? 0;
  const due = optionalInt(String(formData.get("due") ?? ""));
  const discount = optionalPercent(String(formData.get("discount") ?? ""));
  if (risk === "invalid" || due === "invalid" || discount === "invalid") return;
  const chosen = String(formData.get("currency"));
  const currency = currencies.includes(chosen as (typeof currencies)[number]) ? chosen : "TL";
  const staff = formData.getAll("staff").map(String).filter(Boolean).join(",");
  const fields = [
    name,
    String(formData.get("phone") ?? "").trim(),
    String(formData.get("emails") ?? "").trim(),
    String(formData.get("other") ?? "").trim(),
    String(formData.get("person") ?? "").trim(),
    String(formData.get("address") ?? "").trim(),
    formData.get("different_shipping") === "on" ? String(formData.get("shipping") ?? "").trim() : "",
    String(formData.get("tax_office") ?? "").trim(),
    String(formData.get("tax_number") ?? "").trim(),
    formData.get("tax_exempt") === "on",
    String(formData.get("bank") ?? "").trim(),
    currency,
    risk,
    due,
    discount,
    String(formData.get("price_list") ?? "").trim(),
    opening,
    String(formData.get("class1") ?? "").trim(),
    String(formData.get("class2") ?? "").trim(),
    String(formData.get("code") ?? "").trim(),
    staff,
    String(formData.get("note") ?? "").trim(),
  ];

  if (existingId) {
    const owned = await query<{ id: string }>("select id from customers where id = $1 and user_id = $2", [customerId, user]);
    if (!owned[0]) return;
    await query(
      `update customers set name=$1, phone=$2, emails=$3, other_contact=$4, contact_person=$5, address=$6,
        shipping_address=$7, tax_office=$8, tax_number=$9, tax_exempt=$10, bank_info=$11, currency=$12,
        risk_limit_kurus=$13, due_days=$14, discount_percent=$15, price_list=$16, opening_balance_kurus=$17,
        class1=$18, class2=$19, code=$20, staff_ids=$21, note=$22
       where id=$23 and user_id=$24`,
      [...fields, customerId, user],
    );
  } else {
    await query(
      `insert into customers (
        name, phone, emails, other_contact, contact_person, address, shipping_address, tax_office, tax_number,
        tax_exempt, bank_info, currency, risk_limit_kurus, due_days, discount_percent, price_list,
        opening_balance_kurus, class1, class2, code, staff_ids, note, id, user_id, last_visit, visit_count, marketing_ok
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,current_date,0,false)`,
      [...fields, customerId, user],
    );
  }

  await saveCustomerImage(user, customerId, formData);
  await query("delete from customer_branches where customer_id = $1 and user_id = $2", [customerId, user]);
  const branches = parseBranches(String(formData.get("branches") ?? ""));
  for (const branch of branches) {
    await query(
      "insert into customer_branches (id, user_id, customer_id, name, address, code) values ($1,$2,$3,$4,$5,$6)",
      [randomUUID(), user, customerId, branch.name, branch.address, branch.code],
    );
  }
  await query("update appointments set customer_name = $1, phone = $2 where customer_id = $3 and user_id = $4", [name, fields[1], customerId, user]);
  await record(user, "musteri", existingId ? "Müşteriyi güncelledi" : "Müşteri ekledi", name);
  refresh("/panel/musteriler");
  refresh("/panel/randevular");
  redirect(`/panel/musteriler/${customerId}`);
}

export async function deleteCustomer(formData: FormData) {
  const id = await userId();
  const customerId = String(formData.get("id") ?? "");
  await query("delete from customer_branches where customer_id = $1 and user_id = $2", [customerId, id]);
  await query("update appointments set customer_id = null where customer_id = $1 and user_id = $2", [customerId, id]);
  await query("delete from customers where id = $1 and user_id = $2", [customerId, id]);
  await record(id, "musteri", "Müşteriyi sildi", customerId);
  await removeCustomerPhotos(id, customerId);
  refresh("/panel/musteriler");
}

export async function assignCustomerStaff(formData: FormData) {
  const id = await userId();
  const customers = formData.getAll("customer").map(String).filter(Boolean);
  const staff = formData.getAll("staff").map(String).filter(Boolean).join(",");
  for (const customerId of customers) {
    await query("update customers set staff_ids = $1 where id = $2 and user_id = $3", [staff, customerId, id]);
  }
  refresh("/panel/musteriler");
}

export async function addStaff(formData: FormData) {
  const id = await userId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await query("insert into staff (id, user_id, name, available) values ($1,$2,$3,true)", [randomUUID(), id, name]);
  refresh("/panel/musteriler");
  refresh("/panel/randevular");
}

export async function saveSite(formData: FormData) {
  const id = await userId();
  await query(
    "update shop_settings set headline = $1, about = $2, price_note = $3, campaign = $4 where user_id = $5",
    [
      String(formData.get("headline") ?? ""),
      String(formData.get("about") ?? ""),
      String(formData.get("price") ?? ""),
      String(formData.get("campaign") ?? ""),
      id,
    ],
  );
  refresh("/panel/site");
}

export async function addFinanceAccount(formData: FormData) {
  const id = await requireFeature("hesaplar");
  const kind = String(formData.get("kind") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const chosen = String(formData.get("currency") ?? "TL");
  const currency = currencies.includes(chosen as (typeof currencies)[number]) ? chosen : "TL";
  const balance = parseSignedMoney(String(formData.get("balance") ?? "")) ?? 0;
  const detail = String(formData.get("detail") ?? "").trim();
  if (!["kasa", "pos", "kart", "banka", "ortak", "veresiye"].includes(kind) || !name) return;
  await query(
    "insert into finance_accounts (id, user_id, kind, name, currency, balance_kurus, detail) values ($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), id, kind, name, currency, balance, detail],
  );
  await record(id, "hesap", "Hesap açtı", `${name} · ${currency}`);
  refresh("/panel/hesaplarim");
}

export async function deleteFinanceAccount(formData: FormData) {
  const id = await userId();
  const accountId = String(formData.get("id") ?? "");
  const used = await query<{ count: string }>("select count(*)::text as count from ledger where account_id = $1 and user_id = $2", [accountId, id]);
  if (Number(used[0]?.count ?? 0) > 0) return;
  await query("delete from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
  refresh("/panel/hesaplarim");
}

export async function addLedger(formData: FormData) {
  const id = await requireFeature("gelir");
  const kind = String(formData.get("kind") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const date = String(formData.get("date") ?? "");
  const accountId = String(formData.get("account") ?? "");
  if ((kind !== "gelir" && kind !== "gider") || !title || amount == null || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !accountId) return;
  const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
  if (!account[0]) return;
  const delta = kind === "gelir" ? amount : -amount;
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,$3,$4,$5,$6,$7)",
    [randomUUID(), id, kind, title, amount, date, accountId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [delta, accountId, id]);
  await record(id, kind, kind === "gelir" ? "Gelir ekledi" : "Gider ekledi", `${title} · ${(amount / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/gelir");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${accountId}`);
}

export async function transferBetweenAccounts(formData: FormData) {
  const id = await userId();
  const fromId = String(formData.get("from") ?? "");
  const toId = String(formData.get("to") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Hesaplar arası aktarım";
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const date = String(formData.get("date") ?? "");
  if (!fromId || !toId || fromId === toId || amount == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const accounts = await query<{ id: string; currency: string; name: string }>(
    "select id, currency, name from finance_accounts where user_id = $1 and id in ($2, $3)",
    [id, fromId, toId],
  );
  const from = accounts.find((item) => item.id === fromId);
  const to = accounts.find((item) => item.id === toId);
  if (!from || !to || from.currency !== to.currency) return;
  const note = `${title}: ${from.name} → ${to.name}`;
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,'gider',$3,$4,$5,$6), ($7,$2,'gelir',$3,$4,$5,$8)",
    [randomUUID(), id, note, amount, date, fromId, randomUUID(), toId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, fromId, id]);
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [amount, toId, id]);
  await record(id, "hesap", "Hesaplar arası aktardı", `${from.name} → ${to.name} · ${(amount / 100).toLocaleString("tr-TR")} ${from.currency}`);
  refresh("/panel/gelir");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${fromId}`);
  refresh(`/panel/hesaplarim/${toId}`);
}

export async function updateFinanceAccount(formData: FormData) {
  const id = await userId();
  const accountId = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  if (!name) return;
  const used = await query<{ count: string }>("select count(*)::text as count from ledger where account_id = $1 and user_id = $2", [accountId, id]);
  if (Number(used[0]?.count ?? 0) === 0) {
    const balance = parseSignedMoney(String(formData.get("balance") ?? "")) ?? 0;
    await query("update finance_accounts set name = $1, detail = $2, balance_kurus = $3 where id = $4 and user_id = $5", [name, detail, balance, accountId, id]);
  } else {
    await query("update finance_accounts set name = $1, detail = $2 where id = $3 and user_id = $4", [name, detail, accountId, id]);
  }
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${accountId}`);
}

const creditSchedules: Record<string, number> = { aylik: 1, ucaylik: 3, altiaylik: 6, yillik: 12 };
const creditKinds = new Set(["taksitli", "kmh", "avans", "kart"]);

function readCreditForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const remaining = parseMoney(String(formData.get("remaining") ?? ""));
  const periodText = String(formData.get("period") ?? "").trim();
  const period = periodText ? parseMoney(periodText) : remaining;
  const nextDue = String(formData.get("next") ?? "");
  const schedule = String(formData.get("schedule") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!name || !creditKinds.has(kind) || remaining == null || period == null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDue) || !creditSchedules[schedule]) return null;
  const cycle = creditCycle(period, remaining);
  return { name, kind, remaining, nextDue, schedule, accountId, note, ...cycle };
}

export async function addMasraf(formData: FormData) {
  const id = await requireFeature("masraf");
  const category = String(formData.get("category") ?? "").trim();
  const happened = String(formData.get("date") ?? "");
  const documentNo = String(formData.get("document") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const vat = Number(String(formData.get("vat") ?? "0"));
  const repeat = formData.get("repeat") === "on";
  const repeatUntil = String(formData.get("repeat_until") ?? "");
  if (!masrafCategories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(happened) || amount == null) return;
  if (status !== "odendi" && status !== "bekliyor") return;
  if (![0, 1, 10, 20].includes(vat)) return;
  if (status === "odendi" && !accountId) return;
  if (repeat && !/^\d{4}-\d{2}-\d{2}$/.test(repeatUntil)) return;
  if (accountId) {
    const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
    if (!account[0]) return;
  }
  const masrafId = randomUUID();
  let ledgerId: string | null = null;
  if (status === "odendi") {
    ledgerId = randomUUID();
    await query(
      "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,'gider',$3,$4,$5,$6)",
      [ledgerId, id, `Masraf: ${category}`, amount, happened, accountId],
    );
    await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, accountId, id]);
  }
  await query(
    `insert into masraflar (id, user_id, category, happened_on, document_no, description, status, account_id, amount_kurus, vat_rate, ledger_id, series_id, repeat_until, repeat_day)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [masrafId, id, category, happened, documentNo, description, status, accountId || null, amount, vat, ledgerId, repeat ? masrafId : null, repeat ? repeatUntil : null, repeat ? Number(happened.slice(8, 10)) : null],
  );
  await record(id, "masraf", "Masraf ekledi", `${category} · ${(amount / 100).toLocaleString("tr-TR")} TL · ${status}`);
  refresh("/panel/masraflar");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  if (accountId) refresh(`/panel/hesaplarim/${accountId}`);
}

export async function payMasraf(formData: FormData) {
  const id = await requireFeature("masraf");
  const masrafId = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const rows = await query<{ category: string; happened_on: string | Date; amount_kurus: number | string; status: string }>(
    "select category, happened_on, amount_kurus, status from masraflar where id = $1 and user_id = $2",
    [masrafId, id],
  );
  const masraf = rows[0];
  if (!masraf || masraf.status !== "bekliyor") return;
  const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
  if (!account[0]) return;
  const happened = typeof masraf.happened_on === "string" ? masraf.happened_on.slice(0, 10) : dueKey(masraf.happened_on);
  const amount = Number(masraf.amount_kurus);
  const ledgerId = randomUUID();
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,'gider',$3,$4,$5,$6)",
    [ledgerId, id, `Masraf: ${masraf.category}`, amount, happened, accountId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, accountId, id]);
  await query("update masraflar set status = 'odendi', account_id = $1, ledger_id = $2 where id = $3 and user_id = $4", [accountId, ledgerId, masrafId, id]);
  await record(id, "masraf", "Masrafı ödedi", `${masraf.category} · ${(amount / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/masraflar");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${accountId}`);
}

export async function addCredit(formData: FormData) {
  const id = await requireFeature("kredi");
  const credit = readCreditForm(formData);
  if (!credit) return;
  const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2", [credit.accountId, id]);
  if (!account[0]) return;
  await query(
    `insert into credits (id, user_id, name, kind, remaining_kurus, remaining_installments, next_due, schedule, account_id, note, minimum_kurus, period_kurus)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [randomUUID(), id, credit.name, credit.kind, credit.remaining, credit.months, credit.nextDue, credit.schedule, credit.accountId, credit.note, credit.minimum, credit.period],
  );
  await record(id, "kredi", "Kredi ekledi", `${credit.name} · dönem ${(credit.period / 100).toLocaleString("tr-TR")} TL · asgari ${(credit.minimum / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/krediler");
}

export async function updateCredit(formData: FormData) {
  const id = await requireFeature("kredi");
  const creditId = String(formData.get("id") ?? "");
  const credit = readCreditForm(formData);
  if (!credit) return;
  const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2", [credit.accountId, id]);
  if (!account[0]) return;
  await query(
    `update credits set name=$1, kind=$2, remaining_kurus=$3, remaining_installments=$4, next_due=$5, schedule=$6,
      account_id=$7, note=$8, minimum_kurus=$9, period_kurus=$10 where id=$11 and user_id=$12`,
    [credit.name, credit.kind, credit.remaining, credit.months, credit.nextDue, credit.schedule, credit.accountId, credit.note, credit.minimum, credit.period, creditId, id],
  );
  await record(id, "kredi", "Krediyi düzenledi", credit.name);
  refresh("/panel/krediler");
}

export async function payCredit(formData: FormData) {
  const id = await requireFeature("kredi");
  const creditId = String(formData.get("id") ?? "");
  const rows = await query<{ name: string; remaining_kurus: number | string; period_kurus: number | string | null; next_due: string | Date; schedule: string; account_id: string }>(
    "select name, remaining_kurus, period_kurus, next_due, schedule, account_id from credits where id = $1 and user_id = $2",
    [creditId, id],
  );
  const credit = rows[0];
  const months = credit ? creditSchedules[credit.schedule] : undefined;
  if (!credit || !months) return;
  const remaining = Number(credit.remaining_kurus);
  if (remaining <= 0) return;
  const cycle = creditCycle(Number(credit.period_kurus ?? 0), remaining);
  if (cycle.months <= 0) return;
  const amount = parseMoney(String(formData.get("amount") ?? "")) ?? cycle.minimum;
  if (amount <= 0 || amount > remaining) return;
  const due = dueKey(credit.next_due);
  const paidOn = todayKey();
  const nextRemaining = remaining - amount;
  const nextCycle = creditCycle(cycle.period, nextRemaining);
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, credit_id, credit_payment) values ($1,$2,'gider',$3,$4,$5,$6,$7,'taksit')",
    [randomUUID(), id, `Kredi taksiti: ${credit.name}`, amount, paidOn, credit.account_id, creditId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, credit.account_id, id]);
  await query(
    "update credits set remaining_kurus = $1, remaining_installments = $2, next_due = $3, minimum_kurus = $4 where id = $5 and user_id = $6",
    [nextRemaining, nextCycle.months, shiftDue(due, months), nextCycle.minimum, creditId, id],
  );
  await record(id, "kredi", "Taksit ödedi", `${credit.name} · ${(amount / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/krediler");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${credit.account_id}`);
}

export async function payMinimum(formData: FormData) {
  const id = await requireFeature("kredi");
  const creditId = String(formData.get("id") ?? "");
  const rows = await query<{ name: string; remaining_kurus: number | string; period_kurus: number | string | null; account_id: string }>(
    "select name, remaining_kurus, period_kurus, account_id from credits where id = $1 and user_id = $2",
    [creditId, id],
  );
  const credit = rows[0];
  if (!credit) return;
  const remaining = Number(credit.remaining_kurus);
  const cycle = creditCycle(Number(credit.period_kurus ?? 0), remaining);
  if (remaining <= 0 || cycle.minimum <= 0) return;
  const amount = Math.min(cycle.minimum, remaining);
  const nextCycle = creditCycle(cycle.period, remaining - amount);
  const paidOn = todayKey();
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, credit_id, credit_payment) values ($1,$2,'gider',$3,$4,$5,$6,$7,'asgari')",
    [randomUUID(), id, `Asgari ödeme: ${credit.name}`, amount, paidOn, credit.account_id, creditId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, credit.account_id, id]);
  await query(
    "update credits set remaining_kurus = $1, remaining_installments = $2, minimum_kurus = $3 where id = $4 and user_id = $5",
    [remaining - amount, nextCycle.months, nextCycle.minimum, creditId, id],
  );
  await record(id, "kredi", "Asgari ödedi", `${credit.name} · ${(amount / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/krediler");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${credit.account_id}`);
}

export async function deleteCredit(formData: FormData) {
  const id = await userId();
  const creditId = String(formData.get("id") ?? "");
  const used = await query<{ count: string }>("select count(*)::text as count from ledger where credit_id = $1 and user_id = $2", [creditId, id]);
  if (Number(used[0]?.count ?? 0) > 0) return;
  await query("delete from credits where id = $1 and user_id = $2", [creditId, id]);
  await record(id, "kredi", "Krediyi sildi", creditId);
  refresh("/panel/krediler");
}

function todayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dueKey(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}-${day}`;
}

function shiftDue(iso: string, months: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1 + months, day);
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`;
}

export async function deleteLedger(formData: FormData) {
  const id = await userId();
  const entryId = String(formData.get("id") ?? "");
  const rows = await query<{ kind: string; amount_kurus: number | string; account_id: string | null; credit_id: string | null; credit_payment: string | null }>(
    "select kind, amount_kurus, account_id, credit_id, credit_payment from ledger where id = $1 and user_id = $2",
    [entryId, id],
  );
  const entry = rows[0];
  if (!entry) return;
  await query("delete from ledger where id = $1 and user_id = $2", [entryId, id]);
  if (entry.account_id) {
    const amount = Number(entry.amount_kurus);
    const delta = entry.kind === "gelir" ? -amount : amount;
    await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [delta, entry.account_id, id]);
  }
  if (entry.credit_id && entry.kind === "gider" && entry.credit_payment !== "donem") {
    const amount = Number(entry.amount_kurus);
    await query("update credits set remaining_kurus = remaining_kurus + $1 where id = $2 and user_id = $3", [amount, entry.credit_id, id]);
    const credit = await query<{ remaining_kurus: number | string; period_kurus: number | string | null }>(
      "select remaining_kurus, period_kurus from credits where id = $1 and user_id = $2",
      [entry.credit_id, id],
    );
    if (credit[0]) {
      const cycle = creditCycle(Number(credit[0].period_kurus ?? 0), Number(credit[0].remaining_kurus));
      await query(
        "update credits set remaining_installments = $1, minimum_kurus = $2 where id = $3 and user_id = $4",
        [cycle.months, cycle.minimum, entry.credit_id, id],
      );
    }
    refresh("/panel/krediler");
  }
  await record(id, "gelir", "Kaydı sildi", `${entry.kind} · ${(Number(entry.amount_kurus) / 100).toLocaleString("tr-TR")} TL`);
  refresh("/panel/gelir");
  refresh("/panel/gider");
  refresh("/panel/hesaplarim");
  if (entry.account_id) refresh(`/panel/hesaplarim/${entry.account_id}`);
}

export async function changePackage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!site.packagesEnabled) return;
  const name = String(formData.get("package") ?? "");
  if (!name) return;
  await query("update users set package_name = $1 where id = $2", [name, user.id]);
  refresh("/panel/hesap");
}

export async function saveWorkplace(formData: FormData) {
  const id = await userId();
  const business = String(formData.get("business") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const bank = String(formData.get("bank") ?? "").trim();
  if (!business || !phone) return;
  await query("update users set business_name = $1, phone = $2 where id = $3", [business, phone, id]);
  await query("update shop_settings set address = $1, bank_info = $2 where user_id = $3", [address, bank, id]);
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0 && ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 2_000_000) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `logo.${ext}`;
    const dir = path.join(process.cwd(), ".data", "shop-logos", id);
    await mkdir(dir, { recursive: true });
    const existing = await readdir(dir).catch(() => []);
    await Promise.all(existing.filter((name) => name.startsWith("logo.")).map((name) => unlink(path.join(dir, name)).catch(() => undefined)));
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    await query("update shop_settings set logo_path = $1 where user_id = $2", [filename, id]);
  }
  refresh("/panel/hesap");
}

export async function saveSettings(formData: FormData) {
  const id = await userId();
  const section = String(formData.get("section") ?? "");
  if (section === "isletme") {
    const business = String(formData.get("business") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (!business) return;
    await query("update users set business_name = $1, phone = $2 where id = $3", [business, phone, id]);
    await query(
      "update shop_settings set address = $1, tax_office = $2, tax_number = $3 where user_id = $4",
      [String(formData.get("address") ?? "").trim(), String(formData.get("tax_office") ?? "").trim(), String(formData.get("tax_number") ?? "").trim(), id],
    );
  }
  if (section === "kullanici") {
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (!name) return;
    await query("update users set name = $1, phone = $2 where id = $3", [name, phone, id]);
  }
  if (section === "bildirim") {
    await query(
      `update shop_settings set notify_appointment = $1, notify_money = $2, notify_expense = $3, notify_credit = $4, notify_subscription = $5 where user_id = $6`,
      [
        formData.get("appointment") === "on",
        formData.get("money") === "on",
        formData.get("expense") === "on",
        formData.get("credit") === "on",
        formData.get("subscription") === "on",
        id,
      ],
    );
  }
  refresh("/panel/ayarlar");
}

export async function saveCard(formData: FormData) {
  const id = await userId();
  await query("update shop_settings set card_label = $1 where user_id = $2", [
    String(formData.get("card") ?? "").trim() || "Kart",
    id,
  ]);
  refresh("/panel/hesap");
}

function optionalMoney(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = parseMoney(trimmed);
  return amount == null ? "invalid" : amount;
}

function optionalInt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return "invalid";
  return Number(trimmed);
}

function optionalPercent(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) return "invalid";
  return amount;
}

function parseBranches(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const branch = item as { name?: unknown; address?: unknown; code?: unknown };
      const name = String(branch.name ?? "").trim();
      const address = String(branch.address ?? "").trim();
      const code = String(branch.code ?? "").trim();
      if (!name && !address && !code) return [];
      if (!name) return [];
      return [{ name, address, code }];
    });
  } catch {
    return [];
  }
}

function photoDir(user: string) {
  return path.join(process.cwd(), ".data", "customer-photos", user);
}

async function saveCustomerImage(user: string, customerId: string, formData: FormData) {
  if (formData.get("remove_image") === "on") {
    await query("update customers set image_path = '' where id = $1 and user_id = $2", [customerId, user]);
    await removeCustomerPhotos(user, customerId);
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2_000_000) return;
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${customerId}.${ext}`;
  const dir = photoDir(user);
  await mkdir(dir, { recursive: true });
  await removeCustomerPhotos(user, customerId);
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  await query("update customers set image_path = $1 where id = $2 and user_id = $3", [filename, customerId, user]);
}

async function removeCustomerPhotos(user: string, customerId: string) {
  const dir = photoDir(user);
  const files = await readdir(dir).catch(() => []);
  await Promise.all(
    files
      .filter((file) => file.startsWith(`${customerId}.`))
      .map((file) => unlink(path.join(dir, file)).catch(() => undefined)),
  );
}

type SaleLineInput = { name?: unknown; qty?: unknown; price?: unknown; vat?: unknown };

export async function addSale(formData: FormData) {
  const id = await requireFeature("gelir");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const customerId = String(formData.get("customer") ?? "");
  const currency = normalizeCurrency(String(formData.get("currency") ?? "TL"));
  const status = String(formData.get("status") ?? "");
  const accountId = String(formData.get("account") ?? "");
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !currency || (status !== "tahsil" && status !== "bekliyor")) return;
  const customer = await query<{ id: string; name: string }>("select id, name from customers where id = $1 and user_id = $2", [customerId, id]);
  if (!customer[0]) return;
  let parsed: SaleLineInput[] = [];
  try {
    parsed = JSON.parse(String(formData.get("lines") ?? "[]")) as SaleLineInput[];
  } catch {
    return;
  }
  const lines = parsed.flatMap((line) => {
    const name = typeof line.name === "string" ? line.name.trim() : "";
    const qty = typeof line.qty === "number" ? line.qty : Number(String(line.qty ?? "").replace(",", "."));
    const unit = parseMoney(String(line.price ?? ""));
    const vat = Number(line.vat);
    if (!name || !Number.isFinite(qty) || qty <= 0 || unit == null || ![0, 1, 10, 20].includes(vat)) return [];
    const net = Math.round(qty * unit);
    const vatKurus = Math.round((net * vat) / 100);
    return [{ name, qty, unit, vat, vatKurus, total: net + vatKurus, net }];
  });
  if (lines.length === 0) return;
  const net = lines.reduce((sum, line) => sum + line.net, 0);
  const vatKurus = lines.reduce((sum, line) => sum + line.vatKurus, 0);
  const total = net + vatKurus;
  let ledgerId: string | null = null;
  if (status === "tahsil") {
    const account = await query<{ id: string; currency: string }>("select id, currency from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
    if (!account[0] || account[0].currency !== currency) return;
    ledgerId = randomUUID();
    await query(
      "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, customer_id) values ($1,$2,'gelir',$3,$4,$5,$6,$7)",
      [ledgerId, id, `Satış: ${title}`, total, date, accountId, customer[0].id],
    );
    await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [total, accountId, id]);
  }
  const saleId = randomUUID();
  await query(
    `insert into sales (id, user_id, title, customer_id, customer_name, happened_on, currency, status, account_id, net_kurus, vat_kurus, total_kurus, ledger_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [saleId, id, title, customer[0].id, customer[0].name, date, currency, status, status === "tahsil" ? accountId : null, net, vatKurus, total, ledgerId],
  );
  for (const line of lines) {
    await query(
      `insert into sale_lines (id, sale_id, user_id, name, qty, unit_kurus, vat_rate, vat_kurus, total_kurus)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), saleId, id, line.name, line.qty, line.unit, line.vat, line.vatKurus, line.total],
    );
    const existingProduct = await query<{ id: string }>("select id from products where user_id = $1 and lower(name) = $2", [id, line.name.toLowerCase()]);
    if (!existingProduct[0]) {
      await query(
        "insert into products (id, user_id, name, price_label, price_kurus, vat_rate, in_stock) values ($1, $2, $3, $4, $5, $6, true)",
        [randomUUID(), id, line.name, `${(line.unit / 100).toLocaleString("tr-TR")} ₺`, line.unit, line.vat],
      );
    }
  }
  await record(id, "satis", "Satış makbuzu kesti", `${title} · ${customer[0].name} · ${(total / 100).toLocaleString("tr-TR")} ${currency} · ${status === "tahsil" ? "tahsil edildi" : "tahsil edilecek"}`);
  refresh("/panel/satislar");
  refresh("/panel/gelir");
  refresh("/panel/hesaplarim");
  if (accountId) refresh(`/panel/hesaplarim/${accountId}`);
  redirect("/panel/satislar");
}

export async function collectSale(formData: FormData) {
  const id = await requireFeature("gelir");
  const saleId = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const sale = await query<{ id: string; title: string; currency: string; status: string; total_kurus: number | string; customer_id: string | null }>(
    "select id, title, currency, status, total_kurus, customer_id from sales where id = $1 and user_id = $2",
    [saleId, id],
  );
  if (!sale[0] || sale[0].status !== "bekliyor") return;
  const account = await query<{ id: string; currency: string }>("select id, currency from finance_accounts where id = $1 and user_id = $2", [accountId, id]);
  if (!account[0] || account[0].currency !== sale[0].currency) return;
  const total = Number(sale[0].total_kurus);
  const ledgerId = randomUUID();
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, customer_id) values ($1,$2,'gelir',$3,$4,$5,$6,$7)",
    [ledgerId, id, `Satış Tahsilatı: ${sale[0].title}`, total, date, accountId, sale[0].customer_id],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [total, accountId, id]);
  await query("update sales set status = 'tahsil', account_id = $1, ledger_id = $2 where id = $3 and user_id = $4", [accountId, ledgerId, saleId, id]);
  await record(id, "satis", "Satışı tahsil etti", `${sale[0].title} · ${(total / 100).toLocaleString("tr-TR")} ${sale[0].currency}`);
  refresh("/panel/satislar");
  refresh("/panel/gelir");
  refresh("/panel/hesaplarim");
  if (sale[0].customer_id) refresh(`/panel/musteriler/${sale[0].customer_id}`);
  refresh(`/panel/hesaplarim/${accountId}`);
}

export async function addCustomerPayment(formData: FormData) {
  const id = await requireFeature("gelir");
  const customerId = String(formData.get("customer") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!customerId || !accountId || amount == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const [customer, account] = await Promise.all([
    query<{ id: string; name: string }>("select id, name from customers where id = $1 and user_id = $2", [customerId, id]),
    query<{ id: string; name: string; currency: string }>("select id, name, currency from finance_accounts where id = $1 and user_id = $2", [accountId, id]),
  ]);
  if (!customer[0] || !account[0]) return;

  const title = note ? `Cari Tahsilat: ${customer[0].name} (${note})` : `Cari Tahsilat: ${customer[0].name}`;
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, customer_id) values ($1,$2,'gelir',$3,$4,$5,$6,$7)",
    [randomUUID(), id, title, amount, date, accountId, customerId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [amount, accountId, id]);
  await record(id, "musteri", "Müşteriden tahsilat aldı", `${customer[0].name} · ${(amount / 100).toLocaleString("tr-TR")} ${account[0].currency} · ${account[0].name}`);

  refresh(`/panel/musteriler/${customerId}`);
  refresh("/panel/musteriler");
  refresh("/panel/gelir");
  refresh("/panel/hesaplarim");
  refresh(`/panel/hesaplarim/${accountId}`);
}

export async function deleteSale(formData: FormData) {
  const id = await requireFeature("gelir");
  const saleId = String(formData.get("id") ?? "");
  const sale = await query<{ ledger_id: string | null; account_id: string | null; total_kurus: number | string }>(
    "select ledger_id, account_id, total_kurus from sales where id = $1 and user_id = $2",
    [saleId, id],
  );
  if (!sale[0]) return;
  if (sale[0].ledger_id && sale[0].account_id) {
    await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [Number(sale[0].total_kurus), sale[0].account_id, id]);
    await query("delete from ledger where id = $1 and user_id = $2", [sale[0].ledger_id, id]);
  }
  await query("delete from sale_lines where sale_id = $1 and user_id = $2", [saleId, id]);
  await query("delete from sales where id = $1 and user_id = $2", [saleId, id]);
  await record(id, "satis", "Satış makbuzunu sildi", saleId);
  refresh("/panel/satislar");
  refresh("/panel/gelir");
  refresh("/panel/hesaplarim");
  if (sale[0].account_id) refresh(`/panel/hesaplarim/${sale[0].account_id}`);
}
