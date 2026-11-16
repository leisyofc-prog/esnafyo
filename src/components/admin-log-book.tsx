"use client";

import { useMemo, useState } from "react";
import type { ActivityLog } from "@/lib/activity";

const areas = ["hepsi", "giris", "randevu", "musteri", "satis", "gelir", "gider", "hesap", "masraf", "kredi", "banka", "duyuru", "iletisim"] as const;

const areaLabel: Record<string, string> = {
  hepsi: "Hepsi",
  giris: "Giriş",
  randevu: "Randevu",
  musteri: "Müşteri",
  satis: "Satış",
  gelir: "Gelir",
  gider: "Gider",
  hesap: "Hesap",
  masraf: "Masraf",
  kredi: "Kredi",
  banka: "Banka",
  duyuru: "Duyuru",
  iletisim: "İletişim",
};

export function AdminLogBook({ logs }: { logs: ActivityLog[] }) {
  const [area, setArea] = useState<(typeof areas)[number]>("hepsi");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr");
    return logs.filter((item) => {
      if (area !== "hepsi" && item.area !== area) return false;
      if (!text) return true;
      return `${item.business} ${item.name} ${item.email} ${item.action} ${item.detail}`.toLocaleLowerCase("tr").includes(text);
    });
  }, [area, logs, query]);

  return (
    <section className="rounded-xl border border-[#eceff3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f2f4f7] px-4 py-3">
        <h2 className="text-[15px] font-semibold">
          İşlem günlüğü <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{visible.length}</span>
        </h2>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dükkân, işlem veya ayrıntı ara" className="h-9 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px] md:w-72" />
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-[#f2f4f7] px-4 py-3">
        {areas.map((item) => (
          <button key={item} type="button" onClick={() => setArea(item)} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold ${area === item ? "bg-[#fff4ec] text-[#c2410c]" : "bg-[#f4f6f8] text-[#475467]"}`}>
            {areaLabel[item]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="px-4 py-12 text-center text-[13px] text-[#98a2b3]">Bu filtrede kayıt yok. Yeni işlemler buraya düşer.</p> : (
        <ul>
          {visible.map((item) => (
            <li key={item.id} className="grid gap-1 border-b border-[#f2f4f7] px-4 py-3 text-[13px] last:border-0 md:grid-cols-[9.5rem_1.1fr_0.9fr_1.4fr] md:items-start">
              <span className="text-[#98a2b3]">{when(item.createdAt)}</span>
              <span>
                <span className="block font-semibold">{item.business || "Sistem"}</span>
                <span className="text-[#98a2b3]">{item.name}{item.email ? ` · ${item.email}` : ""}</span>
              </span>
              <span>
                <span className="rounded-md bg-[#f4f6f8] px-1.5 py-0.5 text-[11px] font-semibold text-[#475467]">{areaLabel[item.area] ?? item.area}</span>
                <span className="mt-1 block font-semibold">{item.action}</span>
              </span>
              <span className="text-[#475467]">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
