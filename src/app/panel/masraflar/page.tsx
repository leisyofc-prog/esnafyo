import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listFinanceAccounts, listMasraflar, localKey } from "@/lib/panel";
import { MasrafBoard } from "@/components/masraf-board";

export const instant = false;

export default async function MasraflarPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "masraf");
  const [items, accounts] = await Promise.all([listMasraflar(user.id), listFinanceAccounts(user.id)]);
  const currencyOf = (accountId: string) => accounts.find((item) => item.id === accountId)?.currency ?? "TL";

  return (
    <MasrafBoard
      today={localKey(new Date())}
      accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency }))}
      items={items.map((item) => ({
        id: item.id,
        category: item.category,
        dateLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString("tr-TR"),
        documentNo: item.documentNo,
        description: item.description,
        status: item.status,
        accountName: item.accountName,
        amountLabel: `${currencyOf(item.accountId)} ${formatAmount(item.amountKurus)}`,
        vatRate: item.vatRate,
        repeatUntil: item.repeatUntil ? new Date(`${item.repeatUntil}T00:00:00`).toLocaleDateString("tr-TR") : "",
      }))}
    />
  );
}

function formatAmount(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}
