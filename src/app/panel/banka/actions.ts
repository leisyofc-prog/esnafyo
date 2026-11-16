"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { suggestMatch, listBankParties } from "@/lib/bank";
import { writeActivity } from "@/lib/activity";
import { readBankFile } from "@/lib/bank-sheet";
import { query } from "@/lib/db";
import { requireFeature } from "@/lib/plan-guard";

function refresh() {
  revalidatePath("/panel/banka");
  revalidatePath("/panel/gelir");
  revalidatePath("/panel/gider");
  revalidatePath("/panel/hesaplarim");
}

export async function addBankConnection(formData: FormData) {
  const userId = await requireFeature("banka");
  const bankName = String(formData.get("bank") ?? "").trim();
  const iban = String(formData.get("iban") ?? "").replace(/\s/g, "").toUpperCase();
  const accountId = String(formData.get("account") ?? "");
  if (!bankName || (iban && !/^TR\d{24}$/.test(iban))) return;
  const account = await query<{ id: string }>("select id from finance_accounts where id = $1 and user_id = $2 and kind in ('banka', 'pos')", [accountId, userId]);
  if (!account[0]) return;
  await query(
    "insert into bank_connections (id, user_id, bank_name, iban, account_id) values ($1,$2,$3,$4,$5)",
    [randomUUID(), userId, bankName, iban, accountId],
  );
  await writeActivity({ userId, area: "banka", action: "Banka bağladı", detail: bankName });
  refresh();
}

export async function deleteBankConnection(formData: FormData) {
  const userId = await requireFeature("banka");
  const id = String(formData.get("id") ?? "");
  const posted = await query<{ count: string }>("select count(*)::text as count from bank_movements where connection_id = $1 and user_id = $2 and status = 'islendi'", [id, userId]);
  if (Number(posted[0]?.count ?? 0) > 0) return;
  await query("delete from bank_movements where connection_id = $1 and user_id = $2", [id, userId]);
  await query("delete from bank_connections where id = $1 and user_id = $2", [id, userId]);
  refresh();
}

export type BankImportResult = { created: number; skipped: string[] };

export async function importBankStatement(_previous: BankImportResult | null, formData: FormData): Promise<BankImportResult> {
  const userId = await requireFeature("banka");
  const connectionId = String(formData.get("connection") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return { created: 0, skipped: ["Dosya seç. En fazla 5 MB."] };
  const connection = await query<{ id: string }>("select id from bank_connections where id = $1 and user_id = $2", [connectionId, userId]);
  if (!connection[0]) return { created: 0, skipped: ["Banka bağlantısı bulunamadı."] };
  const parsed = await readBankFile(await file.arrayBuffer(), file.name);
  if ("error" in parsed) return { created: 0, skipped: [parsed.error] };
  const parties = await listBankParties(userId);
  const existing = new Set(
    (await query<{ fingerprint: string }>("select fingerprint from bank_movements where user_id = $1", [userId])).map((row) => row.fingerprint),
  );
  const seen = new Map<string, number>();
  let created = 0;
  for (const row of parsed.rows) {
    const base = `${connectionId}|${row.date}|${row.direction}|${row.amountKurus}|${row.description.slice(0, 180)}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    const fingerprint = `${base}|${count}`;
    if (existing.has(fingerprint)) continue;
    const match = suggestMatch({ description: row.description, counterparty: row.counterparty, iban: row.iban, direction: row.direction }, parties);
    await query(
      `insert into bank_movements (
         id, user_id, connection_id, happened_on, direction, channel, amount_kurus, counterparty_name, counterparty_iban,
         description, match_kind, match_id, match_name, status, fingerprint
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'bekliyor',$14)`,
      [randomUUID(), userId, connectionId, row.date, row.direction, row.channel, row.amountKurus, row.counterparty, row.iban, row.description, match?.kind ?? null, match?.id ?? null, match?.name ?? "", fingerprint],
    );
    existing.add(fingerprint);
    created += 1;
  }
  refresh();
  await writeActivity({ userId, area: "banka", action: "Banka dökümü aldı", detail: `${created} hareket` });
  return { created, skipped: parsed.skipped };
}

export async function rematchBankMovements() {
  const userId = await requireFeature("banka");
  const parties = await listBankParties(userId);
  const rows = await query<{ id: string; description: string; counterparty_name: string; counterparty_iban: string; direction: "gelen" | "giden" }>(
    "select id, description, counterparty_name, counterparty_iban, direction from bank_movements where user_id = $1 and status = 'bekliyor'",
    [userId],
  );
  for (const row of rows) {
    const match = suggestMatch({ description: row.description, counterparty: row.counterparty_name, iban: row.counterparty_iban, direction: row.direction }, parties);
    await query("update bank_movements set match_kind = $1, match_id = $2, match_name = $3 where id = $4 and user_id = $5", [match?.kind ?? null, match?.id ?? null, match?.name ?? "", row.id, userId]);
  }
  refresh();
}

export async function setBankMatch(formData: FormData) {
  const userId = await requireFeature("banka");
  const id = String(formData.get("id") ?? "");
  const party = String(formData.get("party") ?? "");
  const [kind, partyId] = party.split(":");
  if (kind !== "musteri" && kind !== "tedarikci") return;
  const table = kind === "musteri" ? "customers" : "suppliers";
  const found = await query<{ name: string }>(`select name from ${table} where id = $1 and user_id = $2`, [partyId, userId]);
  if (!found[0]) return;
  await query(
    "update bank_movements set match_kind = $1, match_id = $2, match_name = $3 where id = $4 and user_id = $5 and status = 'bekliyor'",
    [kind, partyId, found[0].name, id, userId],
  );
  refresh();
}

export async function postBankMovement(formData: FormData) {
  const userId = await requireFeature("banka");
  const id = String(formData.get("id") ?? "");
  await postOne(userId, id);
  refresh();
}

export async function postMatchedBankMovements() {
  const userId = await requireFeature("banka");
  const rows = await query<{ id: string }>("select id from bank_movements where user_id = $1 and status = 'bekliyor' and match_id is not null", [userId]);
  for (const row of rows) await postOne(userId, row.id);
  refresh();
}

export async function ignoreBankMovement(formData: FormData) {
  const userId = await requireFeature("banka");
  const id = String(formData.get("id") ?? "");
  await query("update bank_movements set status = 'yoksay' where id = $1 and user_id = $2 and status = 'bekliyor'", [id, userId]);
  refresh();
}

export async function undoBankMovement(formData: FormData) {
  const userId = await requireFeature("banka");
  const id = String(formData.get("id") ?? "");
  const row = await query<{ ledger_id: string | null; account_id: string; amount_kurus: number | string; direction: "gelen" | "giden" }>(
    `select bank_movements.ledger_id, bank_connections.account_id, bank_movements.amount_kurus, bank_movements.direction
     from bank_movements
     join bank_connections on bank_connections.id = bank_movements.connection_id
     where bank_movements.id = $1 and bank_movements.user_id = $2 and bank_movements.status = 'islendi'`,
    [id, userId],
  );
  if (!row[0]?.ledger_id) return;
  const delta = row[0].direction === "gelen" ? -Number(row[0].amount_kurus) : Number(row[0].amount_kurus);
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [delta, row[0].account_id, userId]);
  await query("delete from ledger where id = $1 and user_id = $2", [row[0].ledger_id, userId]);
  await query("update bank_movements set status = 'bekliyor', ledger_id = null where id = $1 and user_id = $2", [id, userId]);
  refresh();
  revalidatePath(`/panel/hesaplarim/${row[0].account_id}`);
}

async function postOne(userId: string, id: string) {
  const row = await query<{
    id: string;
    happened_on: string | Date;
    direction: "gelen" | "giden";
    amount_kurus: number | string;
    description: string;
    counterparty_name: string;
    match_name: string;
    account_id: string;
  }>(
    `select bank_movements.id, bank_movements.happened_on, bank_movements.direction, bank_movements.amount_kurus,
            bank_movements.description, bank_movements.counterparty_name, bank_movements.match_name, bank_connections.account_id
     from bank_movements
     join bank_connections on bank_connections.id = bank_movements.connection_id
     where bank_movements.id = $1 and bank_movements.user_id = $2 and bank_movements.status = 'bekliyor' and bank_movements.match_id is not null`,
    [id, userId],
  );
  if (!row[0]) return;
  const amount = Number(row[0].amount_kurus);
  const kind = row[0].direction === "gelen" ? "gelir" : "gider";
  const delta = kind === "gelir" ? amount : -amount;
  const title = row[0].match_name || row[0].counterparty_name || row[0].description || "Banka hareketi";
  const date = typeof row[0].happened_on === "string" ? row[0].happened_on.slice(0, 10) : row[0].happened_on.toISOString().slice(0, 10);
  const ledgerId = randomUUID();
  await query(
    "insert into ledger (id, user_id, kind, title, amount_kurus, happened_on, account_id) values ($1,$2,$3,$4,$5,$6,$7)",
    [ledgerId, userId, kind, title.slice(0, 160), amount, date, row[0].account_id],
  );
  await query("update finance_accounts set balance_kurus = balance_kurus + $1 where id = $2 and user_id = $3", [delta, row[0].account_id, userId]);
  await query("update bank_movements set status = 'islendi', ledger_id = $1 where id = $2 and user_id = $3", [ledgerId, id, userId]);
  await writeActivity({ userId, area: "banka", action: "Banka hareketini işledi", detail: `${title} · ${(amount / 100).toLocaleString("tr-TR")} TL · ${kind}` });
  revalidatePath(`/panel/hesaplarim/${row[0].account_id}`);
}
