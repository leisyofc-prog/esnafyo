"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addBankConnection,
  deleteBankConnection,
  ignoreBankMovement,
  importBankStatement,
  postBankMovement,
  postMatchedBankMovements,
  rematchBankMovements,
  setBankMatch,
  undoBankMovement,
  type BankImportResult,
} from "@/app/panel/banka/actions";
import type { BankConnection, BankMovement } from "@/lib/bank";

type Account = { id: string; name: string; currency: string; kind: string };
type Party = { id: string; name: string; kind: "musteri" | "tedarikci" };

const channelLabel = { havale: "Havale", eft: "EFT", pos: "POS", diger: "Diğer" };

export function BankBoard({
  connections,
  movements,
  accounts,
  parties,
}: {
  connections: BankConnection[];
  movements: BankMovement[];
  accounts: Account[];
  parties: Party[];
}) {
  const [filter, setFilter] = useState<"hepsi" | "eslesen" | "bekleyen" | "islenen">("hepsi");
  const bankAccounts = accounts.filter((item) => item.kind === "banka" || item.kind === "pos");
  const visible = movements.filter((item) => {
    if (filter === "eslesen") return item.status === "bekliyor" && item.matchId;
    if (filter === "bekleyen") return item.status === "bekliyor" && !item.matchId;
    if (filter === "islenen") return item.status === "islendi";
    return item.status !== "yoksay";
  });
  const ready = movements.filter((item) => item.status === "bekliyor" && item.matchId).length;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <h2 className="text-[15px] font-semibold">Banka bağlantısı</h2>
        <p className="mt-1 text-[13px] text-[#98a2b3]">Banka ya da POS hesabını bağla. Dökümdeki gelen havale, EFT ve POS tahsilatı müşteriyle, giden hareket tedarikçiyle eşleşir.</p>
        {bankAccounts.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#c2410c]">Önce Hesaplarım’da bir banka ya da POS hesabı aç. <Link href="/panel/hesaplarim" className="font-semibold">Hesap ekle</Link></p>
        ) : (
          <form action={addBankConnection} className="mt-4 grid gap-2 md:grid-cols-[1fr_1.2fr_1fr_auto]">
            <input name="bank" required placeholder="Banka adı" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="iban" placeholder="TR ile başlayan IBAN" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <select name="account" required defaultValue="" className="h-10 rounded-lg border border-[#e4e7ec] px-2 text-[13px]">
              <option value="" disabled>Hesap seç</option>
              {bankAccounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}
            </select>
            <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Bağla</button>
          </form>
        )}
        <ul className="mt-4 space-y-3">
          {connections.map((item) => <ConnectionCard key={item.id} connection={item} />)}
          {connections.length === 0 ? <li className="text-[13px] text-[#98a2b3]">Bağlı banka yok.</li> : null}
        </ul>
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">Hareketler <span className="ml-1 rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[11px] text-[#c2410c]">{movements.length}</span></h2>
          <div className="flex flex-wrap gap-2">
            <form action={rematchBankMovements}><button className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[12px] font-semibold">Yeniden eşleştir</button></form>
            <form action={postMatchedBankMovements}><button className="h-9 rounded-lg bg-[#16a34a] px-3 text-[12px] font-semibold text-white" disabled={ready === 0}>Eşleşenleri işle ({ready})</button></form>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
          {([["hepsi", "Hepsi"], ["eslesen", "Eşleşen"], ["bekleyen", "Eşleşmeyen"], ["islenen", "İşlenen"]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-full px-3 py-1 ${filter === key ? "bg-[#1e293b] text-white" : "bg-[#f4f6f8] text-[#475467]"}`}>{label}</button>
          ))}
        </div>
        {visible.length === 0 ? <p className="mt-6 text-center text-[13px] text-[#98a2b3]">Gösterilecek hareket yok.</p> : (
          <ul className="mt-4 divide-y divide-[#f2f4f7]">
            {visible.map((item) => <MovementRow key={item.id} item={item} parties={parties} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function ConnectionCard({ connection }: { connection: BankConnection }) {
  const [result, action, pending] = useActionState(importBankStatement, null as BankImportResult | null);
  return (
    <li className="rounded-lg border border-[#f2f4f7] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[14px] font-semibold">{connection.bankName}</p>
          <p className="text-[12px] text-[#98a2b3]">{connection.accountName} · {connection.currency}{connection.iban ? ` · ${connection.iban}` : ""}</p>
        </div>
        <form action={deleteBankConnection}>
          <input type="hidden" name="id" value={connection.id} />
          <button className="text-[12px] font-semibold text-[#dc2626]">Bağlantıyı kaldır</button>
        </form>
      </div>
      <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="connection" value={connection.id} />
        <a href="/api/banka-sablon" className="text-[12px] font-semibold text-[#c2410c]">Şablonu indir</a>
        <input name="file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="text-[12px]" />
        <button className="h-9 rounded-lg bg-[#1e293b] px-3 text-[12px] font-semibold text-white" disabled={pending}>{pending ? "Alınıyor" : "Hareketleri al"}</button>
      </form>
      {result ? <p className="mt-2 text-[12px] text-[#475467]">{result.created} hareket alındı.{result.skipped.length ? ` ${result.skipped.slice(0, 3).join(" ")}` : ""}</p> : null}
    </li>
  );
}

function MovementRow({ item, parties }: { item: BankMovement; parties: Party[] }) {
  const incoming = item.direction === "gelen";
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className={`text-[14px] font-semibold ${incoming ? "text-[#15803d]" : "text-[#dc2626]"}`}>
          {incoming ? "+" : "−"}{money(item.amountKurus)} {item.currency}
          <span className="ml-2 text-[12px] font-medium text-[#98a2b3]">{channelLabel[item.channel]} · {showDate(item.date)} · {item.accountName}</span>
        </p>
        <p className="mt-1 text-[13px] text-[#475467]">{item.counterparty || item.description || "Açıklama yok"}</p>
        {item.description && item.counterparty ? <p className="text-[12px] text-[#98a2b3]">{item.description}</p> : null}
        {item.matchName ? <p className="mt-1 text-[12px] font-semibold text-[#1e293b]">Cari: {item.matchName} · {item.matchKind === "musteri" ? "Müşteri" : "Tedarikçi"}</p> : <p className="mt-1 text-[12px] text-[#c2410c]">Cari eşleşmedi</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {item.status === "bekliyor" ? (
          <form action={setBankMatch} className="flex items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <select name="party" defaultValue={item.matchId ? `${item.matchKind}:${item.matchId}` : ""} className="h-9 max-w-48 rounded-lg border border-[#e4e7ec] px-2 text-[12px]">
              <option value="">Cari seç</option>
              {parties.map((party) => <option key={`${party.kind}:${party.id}`} value={`${party.kind}:${party.id}`}>{party.kind === "musteri" ? "Müşteri" : "Tedarikçi"} · {party.name}</option>)}
            </select>
            <button className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[12px] font-semibold">Kaydet</button>
          </form>
        ) : null}
        {item.status === "bekliyor" && item.matchId ? (
          <form action={postBankMovement}>
            <input type="hidden" name="id" value={item.id} />
            <button className="h-9 rounded-lg bg-[#16a34a] px-3 text-[12px] font-semibold text-white">İşle</button>
          </form>
        ) : null}
        {item.status === "bekliyor" ? (
          <form action={ignoreBankMovement}>
            <input type="hidden" name="id" value={item.id} />
            <button className="h-9 text-[12px] font-semibold text-[#98a2b3]">Yoksay</button>
          </form>
        ) : null}
        {item.status === "islendi" ? (
          <form action={undoBankMovement}>
            <input type="hidden" name="id" value={item.id} />
            <button className="h-9 text-[12px] font-semibold text-[#dc2626]">Geri al</button>
          </form>
        ) : null}
      </div>
    </li>
  );
}

function money(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
