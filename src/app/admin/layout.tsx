import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/giris?yon=/admin");
  if (user.role !== "admin") redirect("/panel");
  return <AdminShell name={user.name} email={user.email}>{children}</AdminShell>;
}
