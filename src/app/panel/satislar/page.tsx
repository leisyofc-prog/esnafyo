import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listSales, listFinanceAccounts, localKey } from "@/lib/panel";
import { SaleBook } from "@/components/sale-book";

export const instant = false;

export default async function SalesPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "gelir");
  const [sales, accounts] = await Promise.all([listSales(user.id), listFinanceAccounts(user.id)]);
  return (
    <SaleBook
      sales={sales}
      today={localKey(new Date())}
      accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency }))}
    />
  );
}
