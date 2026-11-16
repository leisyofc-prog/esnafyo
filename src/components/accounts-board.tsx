"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addFinanceAccount, deleteFinanceAccount } from "@/app/panel/actions";
import { currencies } from "@/lib/currencies";

export type AccountItem = {
  id: string;
  kind: "kasa" | "pos" | "kart" | "banka" | "ortak" | "veresiye";
  name: string;
  currency: string;
  balanceLabel: string;
  detail: string;
  movementCount: number;
};

const groups = [
  { kind: "kasa", title: "Kasa" },
  { kind: "banka", title: "Banka" },
  { kind: "pos", title: "POS" },
  { kind: "kart", title: "Kredi kartı" },
  { kind: "ortak", title: "Ortak" },
  { kind: "veresiye", title: "Veresiye" },
] as const;

export function AccountsBoard({ accounts, debts }: { accounts: AccountItem[]; debts: string[] }) {
  const [open, setOpen] = useState(accounts.length === 0);
  const [kind, setKind] = useState("hepsi");
  const visible = useMemo(() => (kind === "hepsi" ? accounts : accounts.filter((item) => item.kind === kind)), [accounts, kind]);

  return (
    <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">Hesaplarım</h2>
            <span className="rounded-full bg-[#fff4ec] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">{accounts.length} hesap</span>
          </div>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Kasa, banka, POS, kart, ortak ve veresiye hesapların burada durur.</p>
          <p className="mt-2 text-[13px] font-semibold text-[#dc2626]">Toplam borç {debts.join(" · ")}</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">
          + Yeni hesap
        </button>
      </div>

      {open ? (
        <form action={addFinanceAccount} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-4 md:grid-cols-[10rem_1fr_7rem_10rem_auto]">
          <select name="kind" className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[13px]" defaultValue="kasa">
            {groups.map((group) => (
              <option key={group.kind} value={group.kind}>{group.title}</option>
            ))}
          </select>
          <input name="name" required placeholder="Hesap adı" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          <select name="currency" className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[13px]" defaultValue="TL">
            {currencies.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          <input name="balance" inputMode="decimal" placeholder="Bakiye" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          <button className="h-9 rounded-lg bg-[#1e293b] px-3 text-[13px] font-semibold text-white">Kaydet</button>
          <input name="detail" placeholder="IBAN veya kısa not" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px] md:col-span-5" />
        </form>
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-t border-[#f2f4f7] px-5 py-3">
        <FilterChip active={kind === "hepsi"} onClick={() => setKind("hepsi")}>Hepsi</FilterChip>
        {groups.map((group) => (
          <FilterChip key={group.kind} active={kind === group.kind} onClick={() => setKind(group.kind)}>{group.title}</FilterChip>
        ))}
      </div>

      <div className="border-t border-[#f2f4f7]">
        <div className="grid grid-cols-[0.7fr_1.2fr_0.6fr_0.8fr_1fr_auto] px-5 py-3 text-[12px] font-medium text-[#98a2b3]">
          <span>Tür</span>
          <span>Hesap</span>
          <span>Birim</span>
          <span>Bakiye</span>
          <span>Not</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold">Hesap bulunamadı</p>
            <p className="mt-1 text-[13px] text-[#98a2b3]">Kasa, banka veya veresiye hesabını buradan eklersin.</p>
          </div>
        ) : (
          <ul>
            {visible.map((item) => (
              <li key={item.id} className="grid grid-cols-[0.7fr_1.2fr_0.6fr_0.8fr_1fr_auto] items-center gap-2 border-t border-[#f2f4f7] px-5 py-3 text-[13px]">
                <span className="font-semibold text-[#c2410c]">{groups.find((group) => group.kind === item.kind)?.title}</span>
                <Link href={`/panel/hesaplarim/${item.id}`} className="font-medium">{item.name}</Link>
                <span>{item.currency}</span>
                <span>{item.balanceLabel}</span>
                <span className="truncate text-[#98a2b3]">{item.detail || "—"}</span>
            {item.movementCount > 0 ? <span className="text-[12px] text-[#98a2b3]">Hareketi var</span> : (
              <form action={deleteFinanceAccount}>
                <input type="hidden" name="id" value={item.id} />
                <button className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
              </form>
            )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold ${active ? "bg-[#fff4ec] text-[#c2410c]" : "bg-[#f4f6f8] text-[#475467]"}`}>
      {children}
    </button>
  );
}
