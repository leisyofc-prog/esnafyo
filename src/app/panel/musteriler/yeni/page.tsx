import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listStaff } from "@/lib/panel";
import { CustomerForm } from "@/components/customer-form";

export const instant = false;

export default async function NewCustomerPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const staff = await listStaff(user.id);

  return <CustomerForm customer={null} branches={[]} staff={staff.map((item) => ({ id: item.id, name: item.name }))} />;
}
