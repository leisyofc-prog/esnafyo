import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { listCatalogItems, listCustomers, listFinanceAccounts, localKey } from "@/lib/panel";
import { SaleForm } from "@/components/sale-form";

export const instant = false;

export default async function NewSalePage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "gelir");
  const [customers, accounts, catalog] = await Promise.all([
    listCustomers(user.id),
    listFinanceAccounts(user.id),
    listCatalogItems(user.id),
  ]);
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-[#98a2b3]"><Link href="/panel/satislar" className="font-semibold text-[#1c2430]">Satışlar</Link> / Yeni makbuz</p>
      <SaleForm
        today={localKey(new Date())}
        customers={customers.map((item) => ({ id: item.id, name: item.name }))}
        accounts={accounts.map((item) => ({ id: item.id, name: item.name, currency: item.currency }))}
        catalog={catalog}
      />
    </div>
  );
}
