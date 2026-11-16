import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { preparePanel } from "@/lib/panel";
import { PanelShell } from "@/components/panel-shell";

export const instant = false;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  await preparePanel(user);

  return (
    <PanelShell name={user.name} business={user.business_name} packageName={user.package_name}>
      {children}
    </PanelShell>
  );
}
