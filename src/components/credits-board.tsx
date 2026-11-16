"use client";

import { useState } from "react";
import Link from "next/link";
import { addCredit, deleteCredit, deleteLedger, payCredit, payMinimum, updateCredit } from "@/app/panel/actions";

export type CreditItem = {
  id: string;
  name: string;
  kind: string;
  kindLabel: string;
  remainingLabel: string;
  remainingInput: string;
  periodInput: string;
  minimumInput: string;
  installments: number;
  nextDue: string;
  schedule: string;
  installmentLabel: string;
  nextLabel: string;
  scheduleLabel: string;
  accountName: string;
  accountId: string;
  note: string;
  installmentAmount: string;
  minimumLabel: string;
  lastPaymentId: string | null;
  closed: boolean;
  overdueDays: number | null;
};

type AccountOption = { id: string; name: string; currency: string };

const schedules = [
  { id: "aylik", label: "Her ay" },
  { id: "ucaylik", label: "Her 3 ay" },
  { id: "altiaylik", label: "Her 6 ay" },
  { id: "yillik", label: "Her yıl" },
];

const kinds = [
  { id: "taksitli", label: "Taksitli kredi" },
  { id: "kmh", label: "KMH" },
  { id: "avans", label: "Avans" },
  { id: "kart", label: "Kredi kartı" },
];

export function CreditsBoard({ credits, accounts, today }: { credits: CreditItem[]; accounts: AccountOption[]; today: string }) {
  const [open, setOpen] = useState(credits.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [kind, setKind] = useState("hepsi");
  const visible = kind === "hepsi" ? credits : credits.filter((item) => item.kind === kind);

  return (
    <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold">Krediler</h2>
            <span className="rounded-full bg-[#fff4ec] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">{credits.length} kredi</span>
          </div>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Asgari ödeme, dönem borcunun %20’sidir. Kalan ay, kalan borcun bu asgariye bölünmesiyle bulunur.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">
          + Yeni kredi
        </button>
      </div>

      {open ? (
        accounts.length === 0 ? (
          <p className="border-t border-[#f2f4f7] px-5 py-4 text-[13px] text-[#475467]">
            Önce ödeme yapılacak hesabı ekle. <Link href="/panel/hesaplarim" className="font-semibold text-[#c2410c]">Hesaplarım</Link>
          </p>
        ) : (
          <form action={addCredit} className="grid gap-2 border-t border-[#f2f4f7] px-5 py-4 md:grid-cols-2">
            <label className="text-[13px] font-semibold">Kredi çeşidi
              <select name="kind" defaultValue="taksitli" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                {kinds.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-semibold">Kredi adı
              <input name="name" required className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <label className="text-[13px] font-semibold">Kalan borç tutarı
              <input name="remaining" required inputMode="decimal" placeholder="Örn. 12000,50" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <label className="text-[13px] font-semibold">Dönem borcu
              <input name="period" inputMode="decimal" placeholder="Boşsa kalan borçla aynı" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <p className="text-[12px] text-[#98a2b3] md:col-span-2">Asgari tutar dönem borcunun %20’si olur. Kalan ay da buna göre hesaplanır.</p>
            <label className="text-[13px] font-semibold">Sıradaki ilk taksit tarihi
              <input name="next" required type="date" defaultValue={today} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <label className="text-[13px] font-semibold">Ödeme takvimi
              <select name="schedule" defaultValue="aylik" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                {schedules.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-semibold">Ödediğin hesap
              <select name="account" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                {accounts.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-semibold md:col-span-2">Notlar
              <textarea name="note" className="mt-1 h-20 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
            </label>
            <button className="h-9 w-fit rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
          </form>
        )
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-t border-[#f2f4f7] px-5 py-3">
        <FilterChip active={kind === "hepsi"} onClick={() => setKind("hepsi")}>Hepsi</FilterChip>
        {kinds.map((item) => (
          <FilterChip key={item.id} active={kind === item.id} onClick={() => setKind(item.id)}>{item.label}</FilterChip>
        ))}
      </div>

      <div className="border-t border-[#f2f4f7]">
        {visible.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13px] text-[#98a2b3]">Kredi kaydı yok.</p>
        ) : (
          <ul>
            {visible.map((item) => (
              <li key={item.id} className="border-t border-[#f2f4f7] px-5 py-4 text-[13px]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#c2410c]">{item.kindLabel}</p>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-[#475467]">Kalan borç <span className="font-semibold text-[#dc2626]">{item.remainingLabel}</span> · {item.installmentLabel} · {item.scheduleLabel}</p>
                    <p className="mt-1 text-[#98a2b3]">Sıradaki ödeme {item.nextLabel} · {item.accountName}{item.minimumLabel ? ` · Asgari ${item.minimumLabel} (dönem borcunun %20’si)` : ""}</p>
                    {item.overdueDays ? (
                      <p className="mt-1">
                        <span className="rounded-full bg-[#fff1f1] px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">{item.overdueDays} gündür ödenmiyor</span>
                      </p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-[#98a2b3]">{item.note}</p> : null}
                  </div>
                  {item.closed ? <span className="text-[12px] font-semibold text-[#15803d]">Kapandı</span> : (
                    <form action={payCredit} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <input name="amount" required inputMode="decimal" defaultValue={item.installmentAmount} className="h-9 w-28 rounded-lg border border-[#e4e7ec] px-3" />
                      <button className="h-9 rounded-lg bg-[#dc2626] px-3 font-semibold text-white">Ödedim</button>
                    </form>
                  )}
                  {!item.closed && item.minimumLabel ? (
                    <form action={payMinimum} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <button className="h-9 rounded-lg border border-[#dc2626] px-3 font-semibold text-[#dc2626]">Asgari ödedim · {item.minimumLabel}</button>
                    </form>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-3">
                  <button type="button" onClick={() => setEditing(editing === item.id ? null : item.id)} className="text-[12px] font-semibold text-[#1c2430]">Düzenle</button>
                  {item.lastPaymentId ? (
                    <form action={deleteLedger}>
                      <input type="hidden" name="id" value={item.lastPaymentId} />
                      <button className="text-[12px] font-semibold text-[#98a2b3]">Ödemeyi geri al</button>
                    </form>
                  ) : null}
                  <form action={deleteCredit}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
                  </form>
                </div>
                {editing === item.id ? (
                  <form action={updateCredit} className="mt-3 grid gap-2 rounded-lg bg-[#f8fafc] p-3 md:grid-cols-2">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="text-[13px] font-semibold">Kredi çeşidi
                      <select name="kind" defaultValue={item.kind} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                        {kinds.map((kindItem) => <option key={kindItem.id} value={kindItem.id}>{kindItem.label}</option>)}
                      </select>
                    </label>
                    <label className="text-[13px] font-semibold">Kredi adı
                      <input name="name" required defaultValue={item.name} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
                    </label>
                    <label className="text-[13px] font-semibold">Kalan borç tutarı
                      <input name="remaining" required defaultValue={item.remainingInput} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
                    </label>
                    <label className="text-[13px] font-semibold">Dönem borcu
                      <input name="period" required defaultValue={item.periodInput} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
                    </label>
                    <p className="text-[12px] text-[#98a2b3]">Asgari {item.minimumLabel || "hesaplanır"}. Kalan {item.installmentLabel}.</p>
                    <label className="text-[13px] font-semibold">Sıradaki taksit tarihi
                      <input name="next" required type="date" defaultValue={item.nextDue} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
                    </label>
                    <label className="text-[13px] font-semibold">Ödeme takvimi
                      <select name="schedule" defaultValue={item.schedule} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                        {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.label}</option>)}
                      </select>
                    </label>
                    <label className="text-[13px] font-semibold">Ödediğin hesap
                      <select name="account" defaultValue={item.accountId} className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] px-2 font-normal">
                        {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
                      </select>
                    </label>
                    <label className="text-[13px] font-semibold md:col-span-2">Notlar
                      <textarea name="note" defaultValue={item.note} className="mt-1 h-20 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
                    </label>
                    <button className="h-9 w-fit rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
                  </form>
                ) : null}
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
