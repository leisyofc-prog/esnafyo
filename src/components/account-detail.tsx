"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addLedger, deleteLedger, transferBetweenAccounts, updateFinanceAccount } from "@/app/panel/actions";

type Account = {
  id: string;
  name: string;
  kindLabel: string;
  currency: string;
  balanceLabel: string;
  detail: string;
  balanceInput: string;
  canEditBalance: boolean;
};

type Movement = {
  id: string;
  kind: "gelir" | "gider";
  title: string;
  dateLabel: string;
  amountLabel: string;
  balanceLabel: string;
};

type OtherAccount = { id: string; name: string; currency: string };

export function AccountDetail({
  account,
  movements,
  others,
  today,
}: {
  account: Account;
  movements: Movement[];
  others: OtherAccount[];
  today: string;
}) {
  const [panel, setPanel] = useState<"giris" | "cikis" | "aktarim" | "guncelle" | null>(null);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr");
    if (!text) return movements;
    return movements.filter((item) => item.title.toLocaleLowerCase("tr").includes(text));
  }, [movements, query]);
  const sameCurrency = others.filter((item) => item.currency === account.currency);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold text-[#98a2b3]">{account.kindLabel}</p>
            <h2 className="mt-1 text-xl font-semibold">{account.name}</h2>
            <p className="mt-1 text-[13px] text-[#475467]">Bakiye: <span className="font-semibold text-[#1c2430]">{account.currency} {account.balanceLabel}</span></p>
            {account.detail ? <p className="mt-1 text-[13px] text-[#98a2b3]">{account.detail}</p> : null}
          </div>
          <Link href="/panel/hesaplarim" className="text-[13px] font-semibold text-[#475467]">Hesaplara dön</Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton active={panel === "guncelle"} onClick={() => setPanel(panel === "guncelle" ? null : "guncelle")}>Güncelle</ActionButton>
          <ActionButton active={panel === "giris"} onClick={() => setPanel(panel === "giris" ? null : "giris")} tone="green">Hesaba para girişi</ActionButton>
          <ActionButton active={panel === "cikis"} onClick={() => setPanel(panel === "cikis" ? null : "cikis")} tone="red">Hesaptan para çıkışı</ActionButton>
          <ActionButton active={panel === "aktarim"} onClick={() => setPanel(panel === "aktarim" ? null : "aktarim")}>Hesaplar arası aktarım</ActionButton>
        </div>
        {panel === "giris" || panel === "cikis" ? (
          <form action={addLedger} className="mt-4 grid gap-2 md:grid-cols-[1fr_9rem_10rem_auto]">
            <input type="hidden" name="kind" value={panel === "giris" ? "gelir" : "gider"} />
            <input type="hidden" name="account" value={account.id} />
            <input name="title" required placeholder="Açıklama" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="amount" required inputMode="decimal" placeholder="Tutar" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="date" required type="date" defaultValue={today} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <button className={`h-9 rounded-lg px-3 text-[13px] font-semibold text-white ${panel === "giris" ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}>Kaydet</button>
          </form>
        ) : null}
        {panel === "aktarim" ? (
          sameCurrency.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#98a2b3]">Aynı para biriminde başka hesap yok.</p>
          ) : (
            <form action={transferBetweenAccounts} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_9rem_10rem_auto]">
              <input type="hidden" name="from" value={account.id} />
              <select name="to" className="h-9 rounded-lg border border-[#e4e7ec] px-2 text-[13px]">
                {sameCurrency.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <input name="title" placeholder="Açıklama" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <input name="amount" required inputMode="decimal" placeholder="Tutar" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <input name="date" required type="date" defaultValue={today} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
              <button className="h-9 rounded-lg bg-[#1e293b] px-3 text-[13px] font-semibold text-white">Aktar</button>
            </form>
          )
        ) : null}
        {panel === "guncelle" ? (
          <form action={updateFinanceAccount} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_9rem_auto]">
            <input type="hidden" name="id" value={account.id} />
            <input name="name" required defaultValue={account.name} className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="detail" defaultValue={account.detail} placeholder="Not veya IBAN" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <input name="balance" defaultValue={account.balanceInput} disabled={!account.canEditBalance} placeholder="Açılış bakiyesi" className="h-9 rounded-lg border border-[#e4e7ec] px-3 text-[13px] disabled:bg-[#f4f6f8]" />
            <button className="h-9 rounded-lg bg-[#1e293b] px-3 text-[13px] font-semibold text-white">Kaydet</button>
          </form>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="text-[15px] font-semibold">Hesap hareketleri</h2>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ara" className="h-9 w-56 rounded-lg border border-[#e4e7ec] px-3 text-[13px] outline-none focus:border-[#f97316]" />
        </div>
        <div className="border-t border-[#f2f4f7]">
          <div className="grid grid-cols-[0.7fr_1.4fr_0.8fr_0.8fr_0.8fr_auto] px-5 py-3 text-[12px] font-medium text-[#98a2b3]">
            <span>Tarih</span>
            <span>Açıklama</span>
            <span>Giriş</span>
            <span>Çıkış</span>
            <span>Bakiye</span>
            <span />
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#98a2b3]">Bu hesapta hareket yok.</p>
          ) : (
            <ul>
              {visible.map((item) => (
                <li key={item.id} className="grid grid-cols-[0.7fr_1.4fr_0.8fr_0.8fr_0.8fr_auto] items-center gap-2 border-t border-[#f2f4f7] px-5 py-3 text-[13px]">
                  <span>{item.dateLabel}</span>
                  <span className="font-medium">{item.title}</span>
                  <span className="font-semibold text-[#15803d]">{item.kind === "gelir" ? item.amountLabel : "—"}</span>
                  <span className="font-semibold text-[#dc2626]">{item.kind === "gider" ? item.amountLabel : "—"}</span>
                  <span>{item.balanceLabel}</span>
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

function ActionButton({ children, active, onClick, tone }: { children: string; active: boolean; onClick: () => void; tone?: "green" | "red" }) {
  const color = tone === "green" ? "bg-[#16a34a] text-white" : tone === "red" ? "bg-[#dc2626] text-white" : active ? "bg-[#1e293b] text-white" : "border border-[#e4e7ec] bg-white";
  return (
    <button type="button" onClick={onClick} className={`h-9 rounded-lg px-3 text-[13px] font-semibold ${color}`}>
      {children}
    </button>
  );
}
