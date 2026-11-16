import { connection } from "next/server";
import { listAdminUsers } from "@/lib/admin";
import { AdminUserBook } from "@/components/admin-user-book";

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  const users = await listAdminUsers();
  return <AdminUserBook users={users} />;
}
