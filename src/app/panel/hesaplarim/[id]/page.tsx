import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listAccountMovements, listFinanceAccounts, localKey } from "@/lib/panel";
import { AccountDetail } from "@/components/account-detail";

export const instant = false;

const kindLabel = {
  kasa: "Kasa",
  banka: "Banka",
  pos: "POS",
  kart: "Kredi kartı",
  ortak: "Ortak",
  veresiye: "Veresiye",
};

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "hesaplar");
  const { id } = await params;
  const accounts = await listFinanceAccounts(user.id);
  const account = accounts.find((item) => item.id === id);
  if (!account) notFound();
  const movements = await listAccountMovements(user.id, id);
  const signed = movements.map((item) => (item.kind === "gelir" ? item.amountKurus : -item.amountKurus));
  const opening = account.balanceKurus - signed.reduce((sum, item) => sum + item, 0);
  let running = opening;
  const rows = movements.map((item, index) => {
    running += signed[index];
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      dateLabel: new Date(`${item.date}T00:00:00`).toLocaleDateString("tr-TR"),
      amountLabel: formatAmount(item.amountKurus),
      balanceLabel: formatAmount(running),
    };
  }).reverse();

  return (
    <AccountDetail
      today={localKey(new Date())}
      others={accounts.filter((item) => item.id !== account.id).map((item) => ({ id: item.id, name: item.name, currency: item.currency }))}
      account={{
        id: account.id,
        name: account.name,
        kindLabel: kindLabel[account.kind],
        currency: account.currency,
        balanceLabel: formatAmount(account.balanceKurus),
        detail: account.detail,
        balanceInput: formatAmount(account.balanceKurus),
        canEditBalance: account.movementCount === 0,
      }}
      movements={rows}
    />
  );
}

function formatAmount(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}
