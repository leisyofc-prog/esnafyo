"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addLedger, deleteLedger } from "@/app/panel/actions";

export type LedgerAccount = { id: string; name: string; currency: string; kind: string };

export type LedgerItem = {
  id: string;
  kind: "gelir" | "gider";
  title: string;
  amountKurus: number;
  amountLabel: string;
  date: string;
  dateLabel: string;
  accountName: string;
  currency: string;
};

export function LedgerBoard({ entries, today, kind, accounts }: { entries: LedgerItem[]; today: string; kind: "gelir" | "gider"; accounts: LedgerAccount[] }) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const label = kind === "gelir" ? "Gelir" : "Gider";
  const tone = kind === "gelir" ? "text-[#15803d]" : "text-[#dc2626]";
  const soft = kind === "gelir" ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#fef2f2] text-[#dc2626]";
  const button = kind === "gelir" ? "bg-[#16a34a]" : "bg-[#dc2626]";

  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr");
    return entries.filter((item) => item.kind === kind && (text === "" || item.title.toLocaleLowerCase("tr").includes(text)));
  }, [entries, kind, query]);

  const currenciesInView = [...new Set(visible.map((item) => item.currency))];
  const total = visible.reduce((sum, item) => sum + item.amountKurus, 0);
  const totalLabel = currenciesInView.length === 1 ? moneyLabel(total, currenciesInView[0]) : "Birden fazla birim";

  function exportCsv() {
    const lines = [
      "Kayıt,Hesap,Tutar,Tarih",
      ...visible.map((item) => [item.title, item.accountName, item.amountLabel, item.dateLabel].map(csvCell).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = kind === "gelir" ? "gelir.csv" : "gider.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <section>
        <Summary label={`Toplam ${label.toLocaleLowerCase("tr")}`} value={visible.length === 0 ? moneyLabel(0, "TL") : totalLabel} tone={tone} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#eceff3] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">{label}</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${soft}`}>
                {visible.length} adet kayıt bulunmaktadır.
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#98a2b3]">{kind === "gelir" ? "Seçtiğin hesabın bakiyesi artar." : "Seçtiğin hesabın bakiyesinden düşer."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13px] font-medium text-[#344054]">
              Dışa aktar
            </button>
            <button type="button" onClick={() => setCreating((value) => !value)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white ${button}`}>
              + Yeni {label.toLocaleLowerCase("tr")}
            </button>
          </div>
        </div>

        {creating ? (
          accounts.length === 0 ? (
            <p className="border-t border-[#f2f4f7] px-5 py-4 text-[13px] text-[#475467]">
              Önce bir hesap ekle. <Link href="/panel/hesaplarim" className="font-semibold text-[#c2410c]">Hesaplarım</Link>
            </p>
          ) : (
            <form action={addLedger} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-4 md:grid-cols-[1fr_11rem_8rem_10rem_auto]">
              <input type="hidden" name="kind" value={kind} />
              <select name="account" required className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[13px]" defaultValue={(accounts.find((item) => item.kind === "kasa") ?? accounts[0])?.id}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>
                ))}
              </select>
              <input name="title" required placeholder="Ne için?" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <input name="amount" required inputMode="decimal" placeholder="Tutar" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <input name="date" required type="date" defaultValue={today} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <button className="h-9 rounded-lg bg-[#1e293b] px-3 text-[13px] font-semibold text-white">Kaydet</button>
            </form>
          )
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#f2f4f7] px-5 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kayıt ara"
            className="h-9 w-56 rounded-lg border border-[#e4e7ec] px-3 text-[13px] outline-none placeholder:text-[#98a2b3] focus:border-[#f97316]"
          />
        </div>

        <div className="border-t border-[#f2f4f7]">
          <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] px-5 py-3 text-[12px] font-medium text-[#98a2b3]">
            <span>Kayıt</span>
            <span>Hesap</span>
            <span>Tutar</span>
            <span>Tarih</span>
            <span />
          </div>
          {visible.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[15px] font-semibold">{label} bulunamadı</p>
              <p className="mt-1 text-[13px] text-[#98a2b3]">Henüz {label.toLocaleLowerCase("tr")} eklemedin.</p>
            </div>
          ) : (
            <ul>
              {visible.map((item) => (
                <li key={item.id} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto] items-center border-t border-[#f2f4f7] px-5 py-3.5 text-[13px]">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-[#475467]">{item.accountName || "—"}</span>
                  <span className={`font-semibold ${tone}`}>{item.amountLabel}</span>
                  <span className="text-[#475467]">{item.dateLabel}</span>
                  <form action={deleteLedger}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-[#eceff3] bg-white px-4 py-3">
      <p className="text-[12px] font-medium text-[#98a2b3]">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function moneyLabel(kurus: number, currency: string) {
  const code = currency === "TL" ? "TRY" : currency;
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: code }).format(kurus / 100);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
