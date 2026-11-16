import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { site } from "@/content/site";
import { listSuppliers } from "@/lib/panel";
import { SupplierBook } from "@/components/supplier-book";

export const instant = false;

export default async function SuppliersPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "tedarikci");
  const suppliers = await listSuppliers(user.id);

  return (
    <SupplierBook
      supportEmail={site.email}
      suppliers={suppliers.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        emails: item.emails,
      }))}
    />
  );
}
