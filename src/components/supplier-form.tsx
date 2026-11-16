"use client";

import Link from "next/link";
import { saveSupplier } from "@/app/panel/tedarikciler/actions";
import { currencies } from "@/lib/currencies";

export type SupplierDraft = {
  id: string;
  name: string;
  taxOffice: string;
  taxNumber: string;
  taxExempt: boolean;
  bankInfo: string;
  currency: string;
  due: string;
  opening: string;
  contactPerson: string;
  emails: string;
  address: string;
  phone: string;
  otherContact: string;
  class1: string;
  class2: string;
  code: string;
  note: string;
};

const input = "h-10 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px] outline-none focus:border-[#f97316]";

export function SupplierForm({ supplier }: { supplier: SupplierDraft | null }) {
  return (
    <form action={saveSupplier} className="space-y-4">
      {supplier ? <input type="hidden" name="id" value={supplier.id} /> : null}
      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="İsmi / Unvanı">
            <input name="name" required defaultValue={supplier?.name} className={input} />
          </Field>
          <Field label="Vergi Dairesi">
            <input name="tax_office" defaultValue={supplier?.taxOffice} className={input} />
          </Field>
          <Field label="Vergi / TC Kimlik No">
            <input name="tax_number" defaultValue={supplier?.taxNumber} className={input} />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-[13px] font-semibold">
            <input type="checkbox" name="tax_exempt" defaultChecked={supplier?.taxExempt} /> Vergiden muaf?
          </label>
          <Field label="Banka Bilgileri" hint="Tedarikçinizin banka hesap bilgilerini girebilirsiniz." className="md:col-span-2">
            <textarea name="bank" defaultValue={supplier?.bankInfo} className={`${input} h-20 py-2`} />
          </Field>
          <Field label="Tedarikçi Para Birimi">
            <select name="currency" defaultValue={supplier?.currency || "TL"} className={input}>
              {currencies.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </Field>
          <Field label="Vade (gün)">
            <input name="due" inputMode="numeric" defaultValue={supplier?.due} className={input} />
          </Field>
          <Field label="Açılış Bakiyesi" hint="Tedarikçi size borçlu ise eksi girin.">
            <input name="opening" inputMode="decimal" defaultValue={supplier?.opening} className={input} />
          </Field>
          <Field label="Yetkili Kişi">
            <input name="person" defaultValue={supplier?.contactPerson} className={input} />
          </Field>
          <Field label="E-Posta" hint="Virgül ile ayırarak birden fazla adres girebilirsiniz.">
            <input name="emails" defaultValue={supplier?.emails} className={input} />
          </Field>
          <Field label="Adres" className="md:col-span-2">
            <textarea name="address" defaultValue={supplier?.address} className={`${input} h-20 py-2`} />
          </Field>
          <Field label="Telefon">
            <input name="phone" defaultValue={supplier?.phone} className={input} />
          </Field>
          <Field label="Diğer Erişim Bilgileri" hint="Sabit telefon, faks vb.">
            <input name="other" defaultValue={supplier?.otherContact} className={input} />
          </Field>
          <Field label="Sınıflandırma 1">
            <input name="class1" defaultValue={supplier?.class1} className={input} />
          </Field>
          <Field label="Sınıflandırma 2">
            <input name="class2" defaultValue={supplier?.class2} className={input} />
          </Field>
          <Field label="Kodu" hint="Varsa muhasebe kodu veya barkod girebilirsiniz.">
            <input name="code" defaultValue={supplier?.code} className={input} />
          </Field>
          <Field label="Not" className="md:col-span-2">
            <textarea name="note" defaultValue={supplier?.note} className={`${input} h-24 py-2`} />
          </Field>
        </div>
      </section>
      <div className="flex gap-3">
        <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        <Link href="/panel/tedarikciler" className="inline-flex h-10 items-center text-[13px] font-semibold text-[#475467]">Vazgeç</Link>
      </div>
    </form>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span className="text-[13px] font-semibold">{label}</span>
      {hint ? <span className="mt-0.5 block text-[12px] text-[#98a2b3]">{hint}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
