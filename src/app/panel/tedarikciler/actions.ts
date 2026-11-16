"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { currencies } from "@/lib/currencies";
import { query } from "@/lib/db";
import { parseMoney, parseSignedMoney } from "@/lib/panel";
import { requireFeature } from "@/lib/plan-guard";
import { writeActivity } from "@/lib/activity";

async function userId() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user.id;
}

function refresh() {
  revalidatePath("/panel/tedarikciler");
}

export async function saveSupplier(formData: FormData) {
  const user = await requireFeature("tedarikci");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const existingId = String(formData.get("id") ?? "");
  const supplierId = existingId || randomUUID();
  const dueText = String(formData.get("due") ?? "").trim();
  const due = dueText ? Number(dueText) : null;
  if (dueText && !/^\d+$/.test(dueText)) return;
  const opening = parseSignedMoney(String(formData.get("opening") ?? "")) ?? 0;
  const chosen = String(formData.get("currency"));
  const currency = currencies.includes(chosen as (typeof currencies)[number]) ? chosen : "TL";
  const fields = [
    name,
    String(formData.get("tax_office") ?? "").trim(),
    String(formData.get("tax_number") ?? "").trim(),
    formData.get("tax_exempt") === "on",
    String(formData.get("bank") ?? "").trim(),
    currency,
    due,
    opening,
    String(formData.get("person") ?? "").trim(),
    String(formData.get("emails") ?? "").trim(),
    String(formData.get("address") ?? "").trim(),
    String(formData.get("phone") ?? "").trim(),
    String(formData.get("other") ?? "").trim(),
    String(formData.get("class1") ?? "").trim(),
    String(formData.get("class2") ?? "").trim(),
    String(formData.get("code") ?? "").trim(),
    String(formData.get("note") ?? "").trim(),
  ];

  if (existingId) {
    const owned = await query<{ id: string }>("select id from suppliers where id = $1 and user_id = $2", [supplierId, user]);
    if (!owned[0]) return;
    await query(
      `update suppliers set name=$1, tax_office=$2, tax_number=$3, tax_exempt=$4, bank_info=$5, currency=$6,
        due_days=$7, opening_balance_kurus=$8, contact_person=$9, emails=$10, address=$11, phone=$12,
        other_contact=$13, class1=$14, class2=$15, code=$16, note=$17
       where id=$18 and user_id=$19`,
      [...fields, supplierId, user],
    );
  } else {
    await query(
      `insert into suppliers (
        name, tax_office, tax_number, tax_exempt, bank_info, currency, due_days, opening_balance_kurus,
        contact_person, emails, address, phone, other_contact, class1, class2, code, note, id, user_id
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [...fields, supplierId, user],
    );
  }
  refresh();
  redirect(`/panel/tedarikciler/${supplierId}`);
}

export async function deleteSupplier(formData: FormData) {
  const user = await userId();
  await query("delete from suppliers where id = $1 and user_id = $2", [String(formData.get("id") ?? ""), user]);
  refresh();
}

export async function addSupplierPayment(formData: FormData) {
  const user = await requireFeature("tedarikci");
  const supplierId = String(formData.get("supplier") ?? "");
  const accountId = String(formData.get("account") ?? "");
  const amount = parseMoney(String(formData.get("amount") ?? ""));
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!supplierId || !accountId || amount == null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

  const [supplier, account] = await Promise.all([
    query<{ id: string; name: string }>("select id, name from suppliers where id = $1 and user_id = $2", [supplierId, user]),
    query<{ id: string; name: string; currency: string }>("select id, name, currency from finance_accounts where id = $1 and user_id = $2", [accountId, user]),
  ]);
  if (!supplier[0] || !account[0]) return;

  const title = note ? `Tedarikçi Ödemesi: ${supplier[0].name} (${note})` : `Tedarikçi Ödemesi: ${supplier[0].name}`;
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id, supplier_id) values ($1,$2,'gider',$3,$4,$5,$6,$7)",
    [randomUUID(), user, title, amount, date, accountId, supplierId],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus - $1 where id = $2 and user_id = $3", [amount, accountId, user]);
  await writeActivity({
    userId: user,
    area: "tedarikci",
    action: "Tedarikçiye ödeme yaptı",
    detail: `${supplier[0].name} · ${(amount / 100).toLocaleString("tr-TR")} ${account[0].currency} · ${account[0].name}`,
  });

  revalidatePath(`/panel/tedarikciler/${supplierId}`);
  revalidatePath("/panel/tedarikciler");
  revalidatePath("/panel/gider");
  revalidatePath("/panel/hesaplarim");
  revalidatePath(`/panel/hesaplarim/${accountId}`);
}
