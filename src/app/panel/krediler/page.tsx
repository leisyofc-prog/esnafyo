import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listCredits, listFinanceAccounts, localKey } from "@/lib/panel";
import { creditCycle } from "@/lib/credit-cycle";
import { CreditsBoard } from "@/components/credits-board";

export const instant = false;

const kindLabel: Record<string, string> = {
  taksitli: "Taksitli kredi",
  kmh: "KMH",
  avans: "Avans",
  kart: "Kredi kartı",
};

const scheduleLabel: Record<string, string> = {
  aylik: "Her ay",
  ucaylik: "Her 3 ay",
  altiaylik: "Her 6 ay",
  yillik: "Her yıl",
};

export default async function CreditsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "kredi");
  const [credits, accounts] = await Promise.all([listCredits(user.id), listFinanceAccounts(user.id)]);

  return (
    <CreditsBoard
      today={localKey(new Date())}
      accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency }))}
      credits={credits.map((item) => {
        const cycle = creditCycle(item.periodKurus, item.remainingKurus);
        return {
        id: item.id,
        name: item.name,
        kind: item.kind,
        kindLabel: kindLabel[item.kind] ?? "Taksitli kredi",
        remainingLabel: `${item.currency} ${formatAmount(item.remainingKurus)}`,
        remainingInput: formatAmount(item.remainingKurus),
        periodInput: formatAmount(cycle.period),
        minimumInput: formatAmount(cycle.minimum),
        installments: cycle.months,
        nextDue: item.nextDue,
        schedule: item.schedule,
        installmentLabel: cycle.months > 0 ? `${cycle.months} ay kaldı` : "Ay kalmadı",
        installmentAmount: cycle.minimum > 0 ? formatAmount(cycle.minimum) : "",
        minimumLabel: cycle.minimum > 0 ? `${item.currency} ${formatAmount(cycle.minimum)}` : "",
        nextLabel: new Date(`${item.nextDue}T00:00:00`).toLocaleDateString("tr-TR"),
        scheduleLabel: scheduleLabel[item.schedule] ?? item.schedule,
        accountName: item.accountName,
        accountId: item.accountId,
        note: item.note,
        lastPaymentId: item.lastPaymentId,
        closed: item.remainingKurus <= 0 || cycle.months <= 0,
      };
      })}
    />
  );
}

function formatAmount(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}
