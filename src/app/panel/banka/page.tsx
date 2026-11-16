import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listBankConnections, listBankMovements, listBankParties } from "@/lib/bank";
import { listFinanceAccounts } from "@/lib/panel";
import { guardFeature } from "@/lib/plan-guard";
import { BankBoard } from "@/components/bank-board";

export const instant = false;

export default async function BankPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "banka");
  const [connections, movements, accounts, parties] = await Promise.all([
    listBankConnections(user.id),
    listBankMovements(user.id),
    listFinanceAccounts(user.id),
    listBankParties(user.id),
  ]);
  return (
    <BankBoard
      connections={connections}
      movements={movements}
      accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency, kind: item.kind }))}
      parties={parties.map((item) => ({ id: item.id, name: item.name, kind: item.kind }))}
    />
  );
}
