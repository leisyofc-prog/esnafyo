import { query } from "@/lib/db";
import { matchMovement, type BankParty } from "@/lib/bank-match";

export type BankConnection = {
  id: string;
  bankName: string;
  iban: string;
  accountId: string;
  accountName: string;
  currency: string;
};

export type BankMovement = {
  id: string;
  connectionId: string;
  date: string;
  direction: "gelen" | "giden";
  channel: "havale" | "eft" | "pos" | "diger";
  amountKurus: number;
  counterparty: string;
  iban: string;
  description: string;
  matchKind: "musteri" | "tedarikci" | "";
  matchId: string;
  matchName: string;
  status: "bekliyor" | "islendi" | "yoksay";
  accountName: string;
  currency: string;
};

export async function listBankConnections(userId: string): Promise<BankConnection[]> {
  const rows = await query<{ id: string; bank_name: string; iban: string; account_id: string; account_name: string; currency: string }>(
    `select bank_connections.id, bank_connections.bank_name, bank_connections.iban, bank_connections.account_id,
            finance_accounts.name as account_name, finance_accounts.currency
     from bank_connections
     join finance_accounts on finance_accounts.id = bank_connections.account_id
     where bank_connections.user_id = $1
     order by bank_connections.bank_name`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    bankName: row.bank_name,
    iban: row.iban,
    accountId: row.account_id,
    accountName: row.account_name,
    currency: row.currency,
  }));
}

export async function listBankMovements(userId: string): Promise<BankMovement[]> {
  const rows = await query<{
    id: string;
    connection_id: string;
    happened_on: string | Date;
    direction: "gelen" | "giden";
    channel: "havale" | "eft" | "pos" | "diger";
    amount_kurus: number | string;
    counterparty_name: string;
    counterparty_iban: string;
    description: string;
    match_kind: "musteri" | "tedarikci" | null;
    match_id: string | null;
    match_name: string;
    status: "bekliyor" | "islendi" | "yoksay";
    account_name: string;
    currency: string;
  }>(
    `select bank_movements.id, bank_movements.connection_id, bank_movements.happened_on, bank_movements.direction,
            bank_movements.channel, bank_movements.amount_kurus, bank_movements.counterparty_name, bank_movements.counterparty_iban,
            bank_movements.description, bank_movements.match_kind, bank_movements.match_id, bank_movements.match_name, bank_movements.status,
            finance_accounts.name as account_name, finance_accounts.currency
     from bank_movements
     join bank_connections on bank_connections.id = bank_movements.connection_id
     join finance_accounts on finance_accounts.id = bank_connections.account_id
     where bank_movements.user_id = $1
     order by bank_movements.happened_on desc, bank_movements.id desc`,
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    connectionId: row.connection_id,
    date: typeof row.happened_on === "string" ? row.happened_on.slice(0, 10) : row.happened_on.toISOString().slice(0, 10),
    direction: row.direction,
    channel: row.channel,
    amountKurus: Number(row.amount_kurus),
    counterparty: row.counterparty_name,
    iban: row.counterparty_iban,
    description: row.description,
    matchKind: row.match_kind ?? "",
    matchId: row.match_id ?? "",
    matchName: row.match_name,
    status: row.status,
    accountName: row.account_name,
    currency: row.currency,
  }));
}

export async function listBankParties(userId: string): Promise<BankParty[]> {
  const customers = await query<{ id: string; name: string; phone: string; bank_info: string }>(
    "select id, name, phone, bank_info from customers where user_id = $1",
    [userId],
  );
  const suppliers = await query<{ id: string; name: string; phone: string; bank_info: string }>(
    "select id, name, phone, bank_info from suppliers where user_id = $1",
    [userId],
  );
  return [
    ...customers.map((item) => ({ id: item.id, name: item.name, phone: item.phone, bankInfo: item.bank_info, kind: "musteri" as const })),
    ...suppliers.map((item) => ({ id: item.id, name: item.name, phone: item.phone, bankInfo: item.bank_info, kind: "tedarikci" as const })),
  ];
}

export function suggestMatch(input: { description: string; counterparty: string; iban: string; direction: "gelen" | "giden" }, parties: BankParty[]) {
  return matchMovement(input, parties);
}
