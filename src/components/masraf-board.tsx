"use client";

import { useState } from "react";
import Link from "next/link";
import { addMasraf, payMasraf } from "@/app/panel/actions";
import { masrafCategories } from "@/lib/masraf-categories";

export type MasrafItem = {
  id: string;
  category: string;
  dateLabel: string;
  documentNo: string;
  description: string;
  status: string;
  accountName: string;
  amountLabel: string;
  vatRate: number;
  repeatUntil: string;
};

type AccountOption = { id: string; name: string; currency: string };

export function MasrafBoard({ items, accounts, today }: { items: MasrafItem[]; accounts: AccountOption[]; today: string }) {
  const [open, setOpen] = useState(items.length === 0);
  const [paid, setPaid] = useState(true);
  const [repeat, setRepeat] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">Masraflar</h2>
            <span className="rounded-full bg-[#fff4ec] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">{items.length} kayıt</span>
          </div>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Kira, aidat, elektrik gibi giderler. Ödenince seçtiğin hesabın bakiyesinden düşer.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center rounded-lg bg-[#dc2626] px-3 text-[13px] font-semibold text-white">
          + Yeni masraf
        </button>
      </div>

      {open ? (
        <form action={addMasraf} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-4 md:grid-cols-2">
          <label className="text-[13px] font-semibold">Masraf kalemi
            <select name="category" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
              {masrafCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-[13px] font-semibold">İşlem tarihi
            <input name="date" required type="date" defaultValue={today} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold">Fiş / belge no
            <input name="document" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold md:col-span-2">Açıklama
            <input name="description" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold">Ödeme durumu
            <select name="status" value={paid ? "odendi" : "bekliyor"} onChange={(event) => setPaid(event.target.value === "odendi")} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
              <option value="odendi">Ödendi</option>
              <option value="bekliyor">Daha sonra ödenecek</option>
            </select>
          </label>
          <label className="text-[13px] font-semibold">Tutar, KDV dahil
            <input name="amount" required inputMode="decimal" placeholder="Örn. 1500,00" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold">KDV oranı
            <select name="vat" defaultValue="0" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
              <option value="0">%0</option>
              <option value="1">%1</option>
              <option value="10">%10</option>
              <option value="20">%20</option>
            </select>
          </label>
          {paid ? (
            accounts.length === 0 ? (
              <p className="text-[13px] text-[#475467]">Ödeme için önce <Link href="/panel/hesaplarim" className="font-semibold text-[#c2410c]">hesap ekle</Link>.</p>
            ) : (
              <label className="text-[13px] font-semibold">Ödenen hesap
                <select name="account" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                  {accounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}
                </select>
              </label>
            )
          ) : null}
          <label className="flex items-center gap-2 text-[13px] font-semibold md:col-span-2">
            <input type="checkbox" name="repeat" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} />
            Tekrarlayan masraf
          </label>
          {repeat ? (
            <label className="text-[13px] font-semibold">Son tekrar tarihi
              <input name="repeat_until" required type="date" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
          ) : null}
          <button className="h-9 w-fit rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>
      ) : null}

      <div className="border-t border-[#f2f4f7]">
        {items.length === 0 ? <p className="px-5 py-12 text-center text-[13px] text-[#98a2b3]">Masraf kaydı yok.</p> : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-3 text-[13px] md:grid-cols-[1fr_0.7fr_0.8fr_0.8fr_auto] md:items-center">
                <span>
                  <span className="block font-semibold">{item.category}</span>
                  <span className="text-[#98a2b3]">{item.description || item.documentNo || "—"}{item.repeatUntil ? ` · ${item.repeatUntil} tarihine kadar tekrar` : ""}</span>
                </span>
                <span>{item.dateLabel}</span>
                <span className="font-semibold text-[#dc2626]">{item.amountLabel}</span>
                <span className={item.status === "odendi" ? "text-[#15803d]" : "text-[#c2410c]"}>{item.status === "odendi" ? item.accountName || "Ödendi" : "Ödenecek"}</span>
                {item.status === "bekliyor" ? (
                  <form action={payMasraf} className="flex gap-2">
                    <select name="account" className="h-9 rounded-lg border border-[#e4e7ec] px-2">
                      {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                    </select>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="h-9 rounded-lg bg-[#dc2626] px-3 font-semibold text-white">Öde</button>
                  </form>
                ) : <span />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
