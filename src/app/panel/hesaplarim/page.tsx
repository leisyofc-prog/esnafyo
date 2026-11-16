import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listCredits, listFinanceAccounts, listMasraflar } from "@/lib/panel";
import { AccountsBoard } from "@/components/accounts-board";

export const instant = false;

const amount = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AccountsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "hesaplar");
  const [accounts, credits, masraflar] = await Promise.all([listFinanceAccounts(user.id), listCredits(user.id), listMasraflar(user.id)]);
  const debtByCurrency = new Map<string, number>();
  for (const credit of credits) {
    if (credit.remainingKurus <= 0) continue;
    debtByCurrency.set(credit.currency, (debtByCurrency.get(credit.currency) ?? 0) + credit.remainingKurus);
  }
  for (const masraf of masraflar) {
    if (masraf.status !== "bekliyor") continue;
    const currency = accounts.find((item) => item.id === masraf.accountId)?.currency ?? "TL";
    debtByCurrency.set(currency, (debtByCurrency.get(currency) ?? 0) + masraf.amountKurus);
  }
  const debts = [...debtByCurrency.entries()].map(([currency, kurus]) => `${currency} ${amount.format(kurus / 100)}`);

  return (
    <AccountsBoard
      debts={debts.length ? debts : [`TL ${amount.format(0)}`]}
      accounts={accounts.map((item) => ({
        id: item.id,
        kind: item.kind,
        name: item.name,
        currency: item.currency,
        balanceLabel: amount.format(item.balanceKurus / 100),
        detail: item.detail,
        movementCount: item.movementCount,
      }))}
    />
  );
}
