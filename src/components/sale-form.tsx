"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addSale } from "@/app/panel/actions";
import type { CatalogItem } from "@/lib/panel";

type Person = { id: string; name: string };
type Account = { id: string; name: string; currency: string };
type Line = { name: string; qty: string; price: string; vat: string };

const emptyLine = (): Line => ({ name: "", qty: "1", price: "", vat: "20" });

export function SaleForm({
  today,
  customers,
  accounts,
  catalog = [],
}: {
  today: string;
  customers: Person[];
  accounts: Account[];
  catalog?: CatalogItem[];
}) {
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [status, setStatus] = useState("bekliyor");
  const [currency, setCurrency] = useState("TL");
  const matching = accounts.filter((item) => item.currency === currency);

  const totals = useMemo(() => {
    return lines.reduce(
      (sum, line) => {
        const qty = Number(line.qty.replace(",", "."));
        const price = Number(line.price.replace(/\./g, "").replace(",", "."));
        const vat = Number(line.vat);
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) return sum;
        const net = qty * price;
        const tax = (net * vat) / 100;
        return { net: sum.net + net, tax: sum.tax + tax, total: sum.total + net + tax };
      },
      { net: 0, tax: 0, total: 0 },
    );
  }, [lines]);

  function update(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function handleNameChange(index: number, name: string) {
    const found = catalog.find((item) => item.name.toLocaleLowerCase("tr") === name.trim().toLocaleLowerCase("tr"));
    if (found) {
      update(index, {
        name,
        price: found.price || lines[index].price,
        vat: String(found.vatRate || lines[index].vat),
      });
    } else {
      update(index, { name });
    }
  }

  function addFromCatalog(item: CatalogItem) {
    setLines((current) => {
      const last = current[current.length - 1];
      const newLine: Line = {
        name: item.name,
        qty: "1",
        price: item.price || "",
        vat: String(item.vatRate || "20"),
      };
      if (last && !last.name && !last.price) {
        return [...current.slice(0, -1), newLine];
      }
      return [...current, newLine];
    });
  }

  return (
    <form action={addSale} className="space-y-4">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <h2 className="text-[15px] font-semibold">Makbuz ve müşteri</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-[13px] font-semibold md:col-span-2">Makbuz adı
            <input name="title" required placeholder="Örn. Saç kesimi" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold">Tarih
            <input name="date" type="date" required defaultValue={today} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
          </label>
          <label className="text-[13px] font-semibold">Para birimi
            <select name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal">
              {["TL", "USD", "EUR", "GBP", "CHF"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-[13px] font-semibold md:col-span-2">Müşteri
            <select name="customer" required defaultValue="" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal">
              <option value="" disabled>Müşteri seç</option>
              {customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
        {customers.length === 0 ? <p className="mt-2 text-[13px] text-[#c2410c]">Önce bir müşteri ekle. <Link href="/panel/musteriler/yeni" className="font-semibold">Müşteri ekle</Link></p> : null}
        <fieldset className="mt-4">
          <legend className="text-[13px] font-semibold">Tahsilat</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-[13px]">
            <label className="inline-flex items-center gap-2"><input type="radio" name="status" value="bekliyor" checked={status === "bekliyor"} onChange={() => setStatus("bekliyor")} /> Tahsil edilecek</label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="status" value="tahsil" checked={status === "tahsil"} onChange={() => setStatus("tahsil")} /> Tahsil edildi</label>
          </div>
        </fieldset>
        {status === "tahsil" ? (
          <label className="mt-3 block text-[13px] font-semibold">Hangi hesaba geçsin
            <select name="account" required defaultValue="" className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal">
              <option value="" disabled>Hesap seç</option>
              {matching.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        ) : null}
        {status === "tahsil" && matching.length === 0 ? <p className="mt-2 text-[13px] text-[#c2410c]">Bu para biriminde hesap yok. <Link href="/panel/hesaplarim" className="font-semibold">Hesap ekle</Link></p> : null}
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">Kalemler</h2>
          <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="text-[13px] font-semibold text-[#c2410c]">+ Kalem ekle</button>
        </div>
        <p className="mt-1 text-[12px] text-[#98a2b3]">Birim fiyat KDV hariç. Toplam KDV dahil hesaplanır.</p>

        {catalog.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-lg bg-[#f8fafc] p-2.5">
            <span className="text-[12px] font-semibold text-[#475467]">Hızlı Seç:</span>
            {catalog.slice(0, 10).map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => addFromCatalog(item)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e4e7ec] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#1c2430] hover:border-[#f97316] hover:bg-[#fff7ed]"
              >
                <span>+</span>
                <span>{item.name}</span>
                {item.price ? <span className="text-[#98a2b3]">({item.price} ₺)</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        <datalist id="catalog-suggestions">
          {catalog.map((item) => (
            <option key={item.name} value={item.name}>
              {item.price ? `${item.price} ₺ (KDV %${item.vatRate})` : item.name}
            </option>
          ))}
        </datalist>

        <ul className="mt-4 space-y-3">
          {lines.map((line, index) => (
            <li key={index} className="grid gap-2 rounded-lg border border-[#f2f4f7] p-3 md:grid-cols-[1.4fr_0.5fr_0.8fr_0.6fr_auto]">
              <input
                value={line.name}
                list="catalog-suggestions"
                onChange={(event) => handleNameChange(index, event.target.value)}
                placeholder="Hizmet ya da ürün adı (listeden seç veya yaz)"
                className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]"
              />
              <input value={line.qty} onChange={(event) => update(index, { qty: event.target.value })} inputMode="decimal" aria-label="Miktar" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <input value={line.price} onChange={(event) => update(index, { price: event.target.value })} inputMode="decimal" placeholder="Birim fiyat" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <select value={line.vat} onChange={(event) => update(index, { vat: event.target.value })} aria-label="KDV" className="h-10 rounded-lg border border-[#e4e7ec] px-2 text-[13px]">
                {[0, 1, 10, 20].map((rate) => <option key={rate} value={rate}>KDV %{rate}</option>)}
              </select>
              {lines.length > 1 ? <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))} className="text-[12px] font-semibold text-[#dc2626]">Sil</button> : <span />}
            </li>
          ))}
        </ul>
        <div className="mt-4 ml-auto max-w-xs space-y-1 text-[13px]">
          <p className="flex justify-between"><span className="text-[#98a2b3]">Ara toplam</span><span>{money(totals.net)} {currency}</span></p>
          <p className="flex justify-between"><span className="text-[#98a2b3]">KDV</span><span>{money(totals.tax)} {currency}</span></p>
          <p className="flex justify-between text-[15px] font-semibold"><span>Genel toplam</span><span>{money(totals.total)} {currency}</span></p>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Link href="/panel/satislar" className="inline-flex h-10 items-center rounded-lg border border-[#e4e7ec] px-4 text-[13px] font-semibold">Vazgeç</Link>
        <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Kaydet</button>
      </div>
    </form>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
