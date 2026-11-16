import { connection } from "next/server";
import { listAdminLeads } from "@/lib/admin";

export const instant = false;

export default async function AdminMessagesPage() {
  await connection();
  const leads = await listAdminLeads();
  return (
    <section className="rounded-xl border border-[#eceff3] bg-white">
      <div className="border-b border-[#f2f4f7] px-4 py-3">
        <h2 className="text-[15px] font-semibold">
          Mesajlar <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{leads.length}</span>
        </h2>
        <p className="mt-1 text-[13px] text-[#98a2b3]">Sitedeki iletişim formundan gelenler.</p>
      </div>
      {leads.length === 0 ? <p className="px-4 py-12 text-center text-[13px] text-[#98a2b3]">Mesaj yok.</p> : (
        <ul>
          {leads.map((item) => (
            <li key={item.id} className="border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.business} · {item.name}</p>
                <p className="text-[#98a2b3]">{showDate(item.createdAt)}</p>
              </div>
              <p className="mt-1 text-[#98a2b3]">{item.sector} · {item.phone}</p>
              <p className="mt-2 text-[#475467]">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
