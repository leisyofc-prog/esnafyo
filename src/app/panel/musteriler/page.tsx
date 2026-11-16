import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/content/site";
import { formatTime, listCustomers, listNextAppointments, listStaff } from "@/lib/panel";
import { CustomerBook } from "@/components/customer-book";

export const instant = false;

export default async function CustomersPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const [customers, staff, upcoming] = await Promise.all([listCustomers(user.id), listStaff(user.id), listNextAppointments(user.id)]);
  const nextByCustomer = new Map(upcoming.map((item) => [item.customer_id, item]));

  return (
    <CustomerBook
      supportEmail={site.email}
      staff={staff.map((item) => ({ id: item.id, name: item.name }))}
      customers={customers.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        emails: item.emails,
        nextAppointment: (() => {
          const next = nextByCustomer.get(item.id);
          if (!next) return "";
          return `${new Date(next.starts_at).toLocaleDateString("tr-TR")} ${formatTime(next.starts_at)} · ${next.service}`;
        })(),
      }))}
    />
  );
}
