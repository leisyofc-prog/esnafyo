import Link from "next/link";
import { connection } from "next/server";
import { adminCounts, listAdminLeads, listAdminUsers } from "@/lib/admin";
import { listActivityLogs } from "@/lib/activity";

export const instant = false;

export default async function AdminHome() {
  await connection();
  const [counts, users, leads, logs] = await Promise.all([adminCounts(), listAdminUsers(), listAdminLeads(), listActivityLogs()]);
  const esnaf = users.filter((item) => item.role !== "admin").slice(0, 6);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[#0b1f44] p-4 text-white">
        <p className="text-sm text-white/70">Esnafyo yönetim</p>
        <p className="mt-2 text-2xl font-semibold">Dükkânlar, mesajlar ve duyurular</p>
        <p className="mt-2 text-sm text-white/70">Esnaf paneline geçince kendi dükkânının ekranını görürsün.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StatusCard title="Kayıtlı esnaf" value={String(counts.esnaf)} href="/admin/uyeler" />
        <StatusCard title="İletişim mesajı" value={String(counts.leads)} href="/admin/mesajlar" />
        <StatusCard title="Yayındaki duyuru" value={String(counts.announcements)} href="/admin/duyurular" />
        <StatusCard title="İşlem günlüğü" value={String(logs.length)} href="/admin/loglar" />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-xl border border-[#eceff3] bg-white">
          <div className="flex items-center justify-between border-b border-[#f2f4f7] px-4 py-3">
            <h2 className="text-[14px] font-semibold">Son esnaflar</h2>
            <Link href="/admin/uyeler" className="text-[12px] font-semibold text-[#c2410c]">Tümü</Link>
          </div>
          {esnaf.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-[#98a2b3]">Henüz esnaf yok.</p> : (
            <ul>
              {esnaf.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0">
                  <span>
                    <span className="block font-semibold">{item.business}</span>
                    <span className="text-[#98a2b3]">{item.name}</span>
                  </span>
                  <span className="text-[#98a2b3]">{showDate(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-[#eceff3] bg-white">
          <div className="flex items-center justify-between border-b border-[#f2f4f7] px-4 py-3">
            <h2 className="text-[14px] font-semibold">Son mesajlar</h2>
            <Link href="/admin/mesajlar" className="text-[12px] font-semibold text-[#c2410c]">Tümü</Link>
          </div>
          {leads.length === 0 ? <p className="px-4 py-8 text-center text-[13px] text-[#98a2b3]">Formdan mesaj yok.</p> : (
            <ul>
              {leads.slice(0, 6).map((item) => (
                <li key={item.id} className="border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0">
                  <span className="block font-semibold">{item.business}</span>
                  <span className="mt-1 block text-[#475467]">{item.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}

function StatusCard({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-[#eceff3] bg-white p-4">
      <p className="text-[12px] text-[#98a2b3]">{title}</p>
      <p className="mt-1 text-[28px] font-semibold">{value}</p>
    </Link>
  );
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
