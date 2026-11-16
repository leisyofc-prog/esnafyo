"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { ensureSchema, query } from "@/lib/db";
import { customerNameKey, readCustomerSheet, type CustomerSheetRow } from "@/lib/customer-sheet";
import { listCustomers } from "@/lib/panel";

export type CustomerImportResult = {
  created: number;
  updated: number;
  skipped: string[];
};

export async function importCustomers(_previous: CustomerImportResult | null, formData: FormData): Promise<CustomerImportResult> {
  const user = await getCurrentUser();
  if (!user) return { created: 0, updated: 0, skipped: ["Önce giriş yap."] };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { created: 0, updated: 0, skipped: ["Excel dosyası seç."] };
  if (file.size > 5_000_000) return { created: 0, updated: 0, skipped: ["Dosya 5 MB sınırını aşıyor."] };

  await ensureSchema();
  const parsed = await readCustomerSheet(await file.arrayBuffer());
  if ("error" in parsed) return { created: 0, updated: 0, skipped: [parsed.error] };

  const existing = await listCustomers(user.id);
  const byName = new Map(existing.map((item) => [customerNameKey(item.name), item.id]));
  let created = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    const key = customerNameKey(row.name);
    const current = byName.get(key);
    if (current) {
      await updateCustomer(user.id, current, row);
      updated += 1;
    } else {
      const id = randomUUID();
      await insertCustomer(user.id, id, row);
      byName.set(key, id);
      created += 1;
    }
  }

  revalidatePath("/panel/musteriler");
  return { created, updated, skipped: parsed.skipped };
}

async function updateCustomer(userId: string, customerId: string, row: CustomerSheetRow) {
  await query(
    `update customers set name=$1, phone=$2, emails=$3, other_contact=$4, contact_person=$5, address=$6,
      shipping_address=$7, tax_office=$8, tax_number=$9, tax_exempt=$10, bank_info=$11, currency=$12,
      risk_limit_kurus=$13, due_days=$14, discount_percent=$15, price_list=$16, opening_balance_kurus=$17,
      class1=$18, class2=$19, code=$20, note=$21
     where id=$22 and user_id=$23`,
    [...rowValues(row), customerId, userId],
  );
}

async function insertCustomer(userId: string, customerId: string, row: CustomerSheetRow) {
  await query(
    `insert into customers (
      name, phone, emails, other_contact, contact_person, address, shipping_address, tax_office, tax_number,
      tax_exempt, bank_info, currency, risk_limit_kurus, due_days, discount_percent, price_list,
      opening_balance_kurus, class1, class2, code, note, id, user_id, last_visit, visit_count, marketing_ok
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,current_date,0,false)`,
    [...rowValues(row), customerId, userId],
  );
}

function rowValues(row: CustomerSheetRow) {
  return [
    row.name,
    row.phone,
    row.emails,
    row.otherContact,
    row.contactPerson,
    row.address,
    row.shippingAddress,
    row.taxOffice,
    row.taxNumber,
    row.taxExempt,
    row.bankInfo,
    row.currency,
    row.riskLimitKurus,
    row.dueDays,
    row.discountPercent,
    row.priceList,
    row.openingBalanceKurus,
    row.class1,
    row.class2,
    row.code,
    row.note,
  ];
}
