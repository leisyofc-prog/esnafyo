"use client";

import { useState } from "react";
import { changePackage, saveCard, saveWorkplace } from "@/app/panel/actions";
import { site } from "@/content/site";

type Plan = { name: string; text: string; price: string; period: string; features: string[] };
type Invoice = { id: string; period: string; amount: string; status: string };

export function AccountTabs({
  joined,
  email,
  currentPackage,
  plans,
  invoices,
  card,
  business,
  phone,
  address,
  bank,
  hasLogo,
  locked,
}: {
  joined: string;
  email: string;
  currentPackage: string;
  plans: Plan[];
  invoices: Invoice[];
  card: string;
  business: string;
  phone: string;
  address: string;
  bank: string;
  hasLogo: boolean;
  locked?: string;
}) {
  const [tab, setTab] = useState<"abonelik" | "odeme" | "isyeri">("abonelik");
  const active = plans.find((item) => item.name === currentPackage) ?? plans[0];

  return (
    <div className="space-y-4">
      {locked ? <p className="rounded-xl border border-[#ffedd5] bg-[#fff7ed] px-4 py-3 text-[13px] text-[#c2410c]">{locked} bu pakette kapalı. Aşağıdan paketi değiştirince açılır.</p> : null}
      <div className="flex gap-6 border-b border-[#eceff3] text-[14px]">
        <TabButton active={tab === "abonelik"} onClick={() => setTab("abonelik")}>{site.packagesEnabled ? "Aboneliğim" : "Hesabım"}</TabButton>
        {site.packagesEnabled ? <TabButton active={tab === "odeme"} onClick={() => setTab("odeme")}>Ödeme bilgilerim</TabButton> : null}
        <TabButton active={tab === "isyeri"} onClick={() => setTab("isyeri")}>İşyeri bilgilerim</TabButton>
      </div>

      {tab === "abonelik" && !site.packagesEnabled ? (
        <section className="rounded-xl border border-[#eceff3] bg-white p-5">
          <h2 className="text-[15px] font-semibold">Tamamen ücretsiz</h2>
          <p className="mt-2 text-[13px] text-[#475467]">Panelin bütün bölümleri açık. Ücret ve paket seçimi şu an yok. {joined} tarihinden beri üyesin. {email}</p>
        </section>
      ) : null}

      {tab === "abonelik" && site.packagesEnabled ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-xl border border-[#eceff3] bg-white p-5">
            <h2 className="text-[15px] font-semibold">Aboneliğim</h2>
            <p className="mt-1 text-[13px] text-[#98a2b3]">Mevcut paketin ve faturaların burada.</p>
            <div className="mt-4 rounded-lg border border-[#eceff3] p-4">
              <p className="font-semibold">{active.name} kullanıyorsun</p>
              <p className="mt-1 text-[13px] text-[#475467]">{joined} tarihinden beri üyesin. {email}</p>
            </div>
            <div className="mt-4 space-y-2">
              {plans.map((item) => (
                <form key={item.name} action={changePackage}>
                  <input type="hidden" name="package" value={item.name} />
                  <button className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-[13px] ${item.name === currentPackage ? "border-[#f97316] bg-[#fff7ed]" : "border-[#e4e7ec] bg-white"}`}>
                    <span>
                      <span className="block font-semibold">{item.name}</span>
                      <span className="text-[#98a2b3]">{item.text}</span>
                    </span>
                    <span className="font-semibold">{item.price}</span>
                  </button>
                </form>
              ))}
            </div>
            <h3 className="mt-5 text-[13px] font-semibold">Faturalar</h3>
            {invoices.length === 0 ? <p className="mt-2 text-[13px] text-[#98a2b3]">Henüz fatura yok.</p> : (
              <ul className="mt-2 divide-y divide-[#f2f4f7]">
                {invoices.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2 text-[13px]">
                    <span>{item.period}</span>
                    <span className="font-semibold">{item.amount} · {item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <aside className="rounded-xl bg-[#1e293b] p-5 text-white">
            <p className="text-[13px] text-white/70">Seçili paket</p>
            <h2 className="mt-2 text-xl font-semibold">{active.name}</h2>
            <p className="mt-2 text-[13px] text-white/80">{active.text}</p>
            <ul className="mt-4 space-y-2 text-[13px]">
              {active.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <p className="mt-5 text-2xl font-semibold">{active.price} <span className="text-[13px] font-normal text-white/70">/ {active.period}</span></p>
          </aside>
        </div>
      ) : null}

      {tab === "odeme" ? (
        <section className="rounded-xl border border-[#eceff3] bg-white p-5">
          <h2 className="text-[15px] font-semibold">Ödeme bilgilerim</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Kart notunu burada tutarsın. Kart numarası kaydedilmez.</p>
          <form action={saveCard} className="mt-4 flex max-w-lg gap-2">
            <input name="card" defaultValue={card} placeholder="Örn. İş bankası, sonu 4242" className="h-10 min-w-0 flex-1 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
            <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Kaydet</button>
          </form>
        </section>
      ) : null}

      {tab === "isyeri" ? (
        <form action={saveWorkplace} className="rounded-xl border border-[#eceff3] bg-white p-5">
          <h2 className="text-[15px] font-semibold">İşyeri bilgilerim</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Fiş ve müşteriye giden bilgiler buradan gelir.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-[13px] font-semibold">Ticari ünvan
              <input name="business" required defaultValue={business} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <label className="text-[13px] font-semibold">Telefon
              <input name="phone" required defaultValue={phone} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
            </label>
            <label className="text-[13px] font-semibold md:col-span-2">Adres
              <textarea name="address" defaultValue={address} className="mt-1 h-20 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
            </label>
            <label className="text-[13px] font-semibold md:col-span-2">Banka hesap bilgisi
              <textarea name="bank" defaultValue={bank} className="mt-1 h-20 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
            </label>
            <label className="text-[13px] font-semibold">Logo
              <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full font-normal" />
              <span className="mt-1 block text-[12px] font-normal text-[#98a2b3]">JPEG, PNG veya WebP. En fazla 10 MB.</span>
            </label>
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/api/isletme-logo" alt="İşyeri logosu" className="h-16 w-16 rounded-lg object-contain" />
            ) : null}
          </div>
          <button className="mt-4 h-10 rounded-lg bg-[#16a34a] px-4 text-[13px] font-semibold text-white">Güncelle</button>
        </form>
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={`border-b-2 pb-2 font-semibold ${active ? "border-[#f97316] text-[#c2410c]" : "border-transparent text-[#667085]"}`}>
      {children}
    </button>
  );
}
