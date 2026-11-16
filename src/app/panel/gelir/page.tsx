import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listFinanceAccounts, listLedger, localKey } from "@/lib/panel";
import { LedgerBoard } from "@/components/ledger-board";

export const instant = false;

export default async function IncomePage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "gelir");
  const [entries, accounts] = await Promise.all([listLedger(user.id), listFinanceAccounts(user.id)]);

  return (
    <LedgerBoard
      kind="gelir"
      today={localKey(new Date())}
      accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency, kind: item.kind }))}
      entries={entries.map((item) => ({
        ...item,
        amountLabel: moneyLabel(item.amountKurus, item.currency),
        dateLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString("tr-TR"),
      }))}
    />
  );
}

function moneyLabel(kurus: number, currency: string) {
  const code = currency === "TL" ? "TRY" : currency;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: code }).format(kurus / 100);
}
