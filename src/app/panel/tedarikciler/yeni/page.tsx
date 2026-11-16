import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { SupplierForm } from "@/components/supplier-form";

export const instant = false;

export default async function NewSupplierPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "tedarikci");
  return <SupplierForm supplier={null} />;
}
