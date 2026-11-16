import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/panel";
import { SettingsTabs } from "@/components/settings-tabs";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const settings = await getSettings(user.id);

  return (
    <SettingsTabs
      business={user.business_name}
      phone={user.phone}
      address={settings?.address ?? ""}
      taxOffice={settings?.tax_office ?? ""}
      taxNumber={settings?.tax_number ?? ""}
      name={user.name}
      email={user.email}
      notifyAppointment={settings?.notify_appointment ?? true}
      notifyMoney={settings?.notify_money ?? true}
      notifyExpense={settings?.notify_expense ?? true}
      notifyCredit={settings?.notify_credit ?? true}
      notifySubscription={settings?.notify_subscription ?? true}
    />
  );
}
