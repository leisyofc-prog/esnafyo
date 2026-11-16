"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { collectSale, deleteSale } from "@/app/panel/actions";
import { whatsappHref } from "@/lib/whatsapp";
import type { Sale } from "@/lib/panel";

type Account = { id: string; name: string; currency: string };

export function SaleBook({ sales, accounts, today }: { sales: Sale[]; accounts: Account[]; today: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(sales[0]?.id ?? null);
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr");
    return sales.filter((item) => text === "" || `${item.title} ${item.customerName}`.toLocaleLowerCase("tr").includes(text));
  }, [query, sales]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Satışlar <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{sales.length}</span></h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Makbuz kes, tahsil edince gelir hesaba işlensin.</p>
        </div>
        <Link href="/panel/satislar/yeni" className="inline-flex h-10 items-center rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">+ Yeni makbuz</Link>
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Makbuz ya da müşteri ara" className="h-10 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13px]" />
      {visible.length === 0 ? (
        <p className="rounded-xl border border-[#eceff3] bg-white px-5 py-12 text-center text-[13px] text-[#98a2b3]">Satış makbuzu yok.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((sale) => (
            <li key={sale.id} className="rounded-xl border border-[#eceff3] bg-white p-4">
              <button type="button" onClick={() => setOpen(open === sale.id ? null : sale.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <span>
                  <span className="block text-[14px] font-semibold">{sale.title}</span>
                  <span className="mt-1 block text-[12px] text-[#98a2b3]">{sale.customerName} · {showDate(sale.date)}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-semibold">{money(sale.totalKurus)} {sale.currency}</span>
                  <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${sale.status === "tahsil" ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#fff7ed] text-[#c2410c]"}`}>
                    {sale.status === "tahsil" ? "Tahsil edildi" : "Tahsil edilecek"}
                  </span>
                </span>
              </button>
              {open === sale.id ? (
                <div className="mt-3 border-t border-[#f2f4f7] pt-3">
                  <ul className="space-y-1 text-[13px]">
                    {sale.lines.map((line) => (
                      <li key={line.id} className="flex justify-between gap-3">
                        <span>{line.name} · {line.qty} × {money(line.unitKurus)} · %{line.vatRate}</span>
                        <span>{money(line.totalKurus)} {sale.currency}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-right text-[12px] text-[#98a2b3]">KDV {money(sale.vatKurus)} {sale.currency}{sale.accountName ? ` · ${sale.accountName}` : ""}</p>
                  
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#f2f4f7] pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/satis-makbuz/${sale.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[12px] font-semibold text-[#1c2430] hover:bg-[#f8fafc]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                        PDF / Yazdır
                      </a>
                      <a
                        href={whatsappHref(sale.customerPhone, makeWhatsAppText(sale))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-[12px] font-semibold text-white hover:bg-[#1ebc59]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp ile Gönder
                      </a>
                    </div>
                    {sale.customerId ? (
                      <Link href={`/panel/musteriler/${sale.customerId}`} className="text-[12px] font-semibold text-[#c2410c] hover:underline">
                        Müşteri Kartına Git →
                      </Link>
                    ) : null}
                  </div>

                  {sale.status === "bekliyor" ? (
                    <form action={collectSale} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-[#fff7ed] p-2.5">
                      <input type="hidden" name="id" value={sale.id} />
                      <label className="text-[12px] font-semibold">Tahsil hesabı
                        <select name="account" required defaultValue="" className="mt-1 block h-9 rounded-lg border border-[#e4e7ec] bg-white px-2 font-normal">
                          <option value="" disabled>Hesap seç</option>
                          {accounts.filter((item) => item.currency === sale.currency).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </label>
                      <label className="text-[12px] font-semibold">Tarih
                        <input name="date" type="date" required defaultValue={today} className="mt-1 block h-9 rounded-lg border border-[#e4e7ec] bg-white px-2 font-normal" />
                      </label>
                      <button className="h-9 rounded-lg bg-[#16a34a] px-3 text-[12px] font-semibold text-white">Tahsil ettim</button>
                    </form>
                  ) : null}
                  <form action={deleteSale} className="mt-3">
                    <input type="hidden" name="id" value={sale.id} />
                    <button className="text-[12px] font-semibold text-[#dc2626]">Makbuzu sil</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function makeWhatsAppText(sale: Sale) {
  const lineTexts = sale.lines
    .map((l) => `• ${l.name} (${l.qty} adet × ${money(l.unitKurus)} ${sale.currency})`)
    .join("\n");
  const statusNote = sale.status === "tahsil" ? "Tahsil edildi" : "Tahsil edilecek (Veresiye / Açık Hesap)";

  return `Sayın ${sale.customerName},

${sale.title} için düzenlenen satış makbuzunuz:
Tarih: ${showDate(sale.date)}
Makbuz No: #${sale.id.slice(0, 8).toUpperCase()}

Kalemler:
${lineTexts}

Ara Toplam: ${money(sale.netKurus)} ${sale.currency}
KDV: ${money(sale.vatKurus)} ${sale.currency}
Genel Toplam: ${money(sale.totalKurus)} ${sale.currency}
Durum: ${statusNote}

Bizi tercih ettiğiniz için teşekkür ederiz!`;
}

function money(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
