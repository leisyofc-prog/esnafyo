"use client";

import { useState } from "react";
import { saveSettings } from "@/app/panel/actions";

export function SettingsTabs({
  business,
  phone,
  address,
  taxOffice,
  taxNumber,
  name,
  email,
  notifyAppointment,
  notifyMoney,
  notifyExpense,
  notifyCredit,
  notifySubscription,
}: {
  business: string;
  phone: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  name: string;
  email: string;
  notifyAppointment: boolean;
  notifyMoney: boolean;
  notifyExpense: boolean;
  notifyCredit: boolean;
  notifySubscription: boolean;
}) {
  const [tab, setTab] = useState<"isletme" | "kullanici" | "bildirim">("isletme");

  return (
    <div className="space-y-4">
      <div className="flex gap-6 overflow-x-auto border-b border-[#eceff3] text-[14px]">
        <Tab active={tab === "isletme"} onClick={() => setTab("isletme")}>İşletme bilgileri</Tab>
        <Tab active={tab === "kullanici"} onClick={() => setTab("kullanici")}>Kullanıcı bilgileri</Tab>
        <Tab active={tab === "bildirim"} onClick={() => setTab("bildirim")}>Bildirim tercihleri</Tab>
      </div>

      {tab === "isletme" ? (
        <form action={saveSettings} className="rounded-xl border border-[#eceff3] bg-white p-5">
          <input type="hidden" name="section" value="isletme" />
          <h2 className="text-[15px] font-semibold">İşletme bilgileri</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Dükkânının resmi bilgileri.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="İşletme ünvanı" name="business" defaultValue={business} required />
            <Field label="Telefon" name="phone" defaultValue={phone} />
            <Field label="Vergi / TC kimlik no" name="tax_number" defaultValue={taxNumber} />
            <Field label="Vergi dairesi" name="tax_office" defaultValue={taxOffice} />
            <label className="text-[13px] font-semibold md:col-span-2">Adres
              <textarea name="address" defaultValue={address} className="mt-1 h-20 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 font-normal" />
            </label>
          </div>
          <button className="mt-4 h-10 rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>
      ) : null}

      {tab === "kullanici" ? (
        <form action={saveSettings} className="rounded-xl border border-[#eceff3] bg-white p-5">
          <input type="hidden" name="section" value="kullanici" />
          <h2 className="text-[15px] font-semibold">Kullanıcı bilgileri</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Panele giren kişinin bilgileri.</p>
          <div className="mt-4 grid max-w-xl gap-3">
            <Field label="Adın" name="name" defaultValue={name} required />
            <label className="text-[13px] font-semibold">E-posta
              <input value={email} readOnly className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] bg-[#f8fafc] px-3 font-normal text-[#667085]" />
            </label>
            <Field label="Telefon" name="phone" defaultValue={phone} />
          </div>
          <button className="mt-4 h-10 rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>
      ) : null}

      {tab === "bildirim" ? (
        <form action={saveSettings} className="rounded-xl border border-[#eceff3] bg-white p-5">
          <input type="hidden" name="section" value="bildirim" />
          <h2 className="text-[15px] font-semibold">Bildirim tercihleri</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Açık olanlar paneldeki ilgili uyarılar için durur.</p>
          <div className="mt-4 divide-y divide-[#f2f4f7]">
            <Toggle name="appointment" label="Randevu" defaultChecked={notifyAppointment} />
            <Toggle name="money" label="Gelir ve gider" defaultChecked={notifyMoney} />
            <Toggle name="expense" label="Masraf" defaultChecked={notifyExpense} />
            <Toggle name="credit" label="Kredi" defaultChecked={notifyCredit} />
            <Toggle name="subscription" label="Abonelik" defaultChecked={notifySubscription} />
          </div>
          <button className="mt-4 h-10 rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>
      ) : null}
    </div>
  );
}

function Field({ label, name, defaultValue, required }: { label: string; name: string; defaultValue: string; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold">{label}
      <input name={name} required={required} defaultValue={defaultValue} className="mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 font-normal" />
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between py-3 text-[14px]">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-5 w-5 accent-[#f97316]" />
    </label>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 border-b-2 pb-2 font-semibold ${active ? "border-[#f97316] text-[#c2410c]" : "border-transparent text-[#667085]"}`}>
      {children}
    </button>
  );
}
