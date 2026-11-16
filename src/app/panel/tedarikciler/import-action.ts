"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { customerNameKey } from "@/lib/customer-sheet";
import { ensureSchema, query } from "@/lib/db";
import { listSuppliers } from "@/lib/panel";
import { hasFeature } from "@/lib/plan-access";
import { readSupplierSheet, type SupplierSheetRow } from "@/lib/supplier-sheet";

export type SupplierImportResult = {
  created: number;
  updated: number;
  skipped: string[];
};

export async function importSuppliers(_previous: SupplierImportResult | null, formData: FormData): Promise<SupplierImportResult> {
  const user = await getCurrentUser();
  if (!user) return { created: 0, updated: 0, skipped: ["Önce giriş yap."] };
  if (!hasFeature(user.package_name, "tedarikci")) return { created: 0, updated: 0, skipped: ["Tedarikçiler bu pakette kapalı."] };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { created: 0, updated: 0, skipped: ["Excel dosyası seç."] };
  if (file.size > 5_000_000) return { created: 0, updated: 0, skipped: ["Dosya 5 MB sınırını aşıyor."] };

  await ensureSchema();
  const parsed = await readSupplierSheet(await file.arrayBuffer());
  if ("error" in parsed) return { created: 0, updated: 0, skipped: [parsed.error] };

  const existing = await listSuppliers(user.id);
  const byName = new Map(existing.map((item) => [customerNameKey(item.name), item.id]));
  let created = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    const key = customerNameKey(row.name);
    const current = byName.get(key);
    if (current) {
      await updateSupplier(user.id, current, row);
      updated += 1;
    } else {
      const id = randomUUID();
      await insertSupplier(user.id, id, row);
      byName.set(key, id);
      created += 1;
    }
  }

  revalidatePath("/panel/tedarikciler");
  return { created, updated, skipped: parsed.skipped };
}

function values(row: SupplierSheetRow) {
  return [
    row.name,
    row.taxOffice,
    row.taxNumber,
    row.taxExempt,
    row.bankInfo,
    row.currency,
    row.dueDays,
    row.openingBalanceKurus,
    row.contactPerson,
    row.emails,
    row.address,
    row.phone,
    row.otherContact,
    row.class1,
    row.class2,
    row.code,
    row.note,
  ];
}

async function updateSupplier(userId: string, supplierId: string, row: SupplierSheetRow) {
  await query(
    `update suppliers set name=$1, tax_office=$2, tax_number=$3, tax_exempt=$4, bank_info=$5, currency=$6,
      due_days=$7, opening_balance_kurus=$8, contact_person=$9, emails=$10, address=$11, phone=$12,
      other_contact=$13, class1=$14, class2=$15, code=$16, note=$17
     where id=$18 and user_id=$19`,
    [...values(row), supplierId, userId],
  );
}

async function insertSupplier(userId: string, supplierId: string, row: SupplierSheetRow) {
  await query(
    `insert into suppliers (
      name, tax_office, tax_number, tax_exempt, bank_info, currency, due_days, opening_balance_kurus,
      contact_person, emails, address, phone, other_contact, class1, class2, code, note, id, user_id
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
    [...values(row), supplierId, userId],
  );
}
