import { connection } from "next/server";
import { addAnnouncement, deleteAnnouncement } from "@/app/admin/duyurular/actions";
import { listAnnouncements } from "@/lib/admin";

export const instant = false;

const kindLabel: Record<string, string> = {
  guncelleme: "Güncelleme",
  bilgilendirme: "Bilgilendirme",
  kampanya: "Kampanya",
};

export default async function AdminAnnouncementsPage() {
  await connection();
  const items = await listAnnouncements();
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <form action={addAnnouncement} className="grid gap-2 rounded-xl border border-[#eceff3] bg-white p-4 md:grid-cols-2">
        <div className="border-b border-[#f2f4f7] pb-3 md:col-span-2">
          <h2 className="text-[15px] font-semibold">Yeni duyuru</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Yayınlayınca esnaf panelindeki Duyurular listesine düşer.</p>
        </div>
        <label className="text-[13px] font-semibold">Başlık
          <input name="title" required className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
        </label>
        <label className="text-[13px] font-semibold">Tür
          <select name="kind" defaultValue="bilgilendirme" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
            <option value="bilgilendirme">Bilgilendirme</option>
            <option value="guncelleme">Güncelleme</option>
            <option value="kampanya">Kampanya</option>
          </select>
        </label>
        <label className="text-[13px] font-semibold md:col-span-2">Metin
          <textarea name="body" className="mt-1 h-24 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
        </label>
        <label className="text-[13px] font-semibold">Tarih
          <input name="date" type="date" required defaultValue={date} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
        </label>
        <label className="text-[13px] font-semibold">Bağlantı yazısı
          <input name="link" placeholder="İsteğe bağlı" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
        </label>
        <label className="text-[13px] font-semibold md:col-span-2">Bağlantı
          <input name="href" placeholder="/panel veya https://" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
        </label>
        <button className="h-10 w-fit rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Yayınla</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="border-b border-[#f2f4f7] px-4 py-3">
          <h2 className="text-[15px] font-semibold">Yayındaki duyurular <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{items.length}</span></h2>
        </div>
        {items.length === 0 ? <p className="px-4 py-12 text-center text-[13px] text-[#98a2b3]">Henüz duyuru yok.</p> : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0">
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="text-[#98a2b3]">{kindLabel[item.kind] ?? item.kind} · {showDate(item.date)}</span>
                  {item.body ? <span className="mt-1 block text-[#475467]">{item.body}</span> : null}
                </span>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="text-[12px] font-semibold text-[#dc2626]">Kaldır</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
