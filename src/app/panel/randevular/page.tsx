import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDay, formatTime, getSettings, listAppointments, listCustomers, listStaff, localKey, startOfDay } from "@/lib/panel";
import { AppointmentBoard } from "@/components/appointment-board";

export const instant = false;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ gorunum?: string }>;
}) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const week = params.gorunum === "hafta";
  const from = week ? startOfWeek() : startOfDay();
  const to = week ? startOfDay(startOfWeekOffset() + 7) : startOfDay(1);
  const [items, settings, staff, customers] = await Promise.all([
    listAppointments(user.id, from, to),
    getSettings(user.id),
    listStaff(user.id),
    listCustomers(user.id),
  ]);
  const days = week ? Array.from({ length: 7 }, (_, index) => startOfDay(startOfWeekOffset() + index)) : [startOfDay()];
  const slot = new Date();
  slot.setMinutes(0, 0, 0);
  slot.setHours(slot.getHours() + 1);

  return (
    <AppointmentBoard
      week={week}
      when={toDateTimeLocal(slot)}
      openTime={settings?.open_time ?? "09:00"}
      closeTime={settings?.close_time ?? "19:00"}
      closedDays={settings?.closed_days ?? ""}
      whatsapp={settings?.reminder_whatsapp ?? false}
      sms={settings?.reminder_sms ?? false}
      staff={staff.map((person) => ({ id: person.id, name: person.name, available: person.available }))}
      customers={customers.map((item) => ({ id: item.id, name: item.name, phone: item.phone }))}
      days={days.map((day) => {
        const key = localKey(day);
        return {
          key,
          label: formatDay(day),
          items: items
            .filter((item) => localKey(item.starts_at) === key)
            .map((item) => ({
              id: item.id,
              customerId: item.customer_id ?? "",
              time: formatTime(item.starts_at),
              name: item.customer_name,
              phone: item.phone,
              service: item.service,
              staff: item.staff_name,
              status: item.status,
            })),
        };
      })}
    />
  );
}

function toDateTimeLocal(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}T${hour}:00`;
}

function startOfWeekOffset() {
  const today = new Date();
  const day = today.getDay();
  const monday = day === 0 ? -6 : 1 - day;
  return monday;
}

function startOfWeek() {
  return startOfDay(startOfWeekOffset());
}
