import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, listInvoices } from "@/lib/panel";
import { featureLabel, type Feature } from "@/lib/plan-access";
import { site } from "@/content/site";
import { AccountTabs } from "@/components/account-tabs";

export const instant = false;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ kilit?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const locked = params.kilit && params.kilit in featureLabel ? featureLabel[params.kilit as Feature] : "";
  const [invoices, settings] = await Promise.all([listInvoices(user.id), getSettings(user.id)]);

  return (
    <AccountTabs
      joined={new Date(user.created_at).toLocaleDateString("tr-TR")}
      email={user.email}
      currentPackage={user.package_name}
      plans={site.pricing.items.map((item) => ({
        name: item.name,
        text: item.text,
        price: item.price,
        period: item.period,
        features: [...item.features],
      }))}
      invoices={invoices.map((item) => ({ id: item.id, period: item.period_label, amount: item.amount_label, status: item.status }))}
      card={settings?.card_label ?? ""}
      business={user.business_name}
      phone={user.phone}
      address={settings?.address ?? ""}
      bank={settings?.bank_info ?? ""}
      hasLogo={Boolean(settings?.logo_path)}
      locked={locked}
    />
  );
}
