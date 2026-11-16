import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasFeature, type Feature } from "@/lib/plan-access";

export function guardFeature(packageName: string, feature: Feature) {
  if (!hasFeature(packageName, feature)) redirect(`/panel/hesap?kilit=${feature}`);
}

export async function requireFeature(feature: Feature) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  guardFeature(user.package_name, feature);
  return user.id;
}
