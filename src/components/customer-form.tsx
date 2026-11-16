"use client";

import { useState } from "react";
import Link from "next/link";
import { addStaff, saveCustomer } from "@/app/panel/actions";
import { currencies } from "@/lib/currencies";

export type CustomerDraft = {
  id: string;
  name: string;
  phone: string;
  emails: string;
  otherContact: string;
  contactPerson: string;
  address: string;
  shippingAddress: string;
  taxOffice: string;
  taxNumber: string;
  taxExempt: boolean;
  bankInfo: string;
  currency: string;
  risk: string;
  due: string;
  discount: string;
  priceList: string;
  opening: string;
  class1: string;
  class2: string;
  code: string;
  note: string;
  staffIds: string[];
  image: boolean;
};

type Branch = { name: string; address: string; code: string };
type Person = { id: string; name: string };

const input = "h-10 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px] outline-none focus:border-[#f97316]";

export function CustomerForm({ customer, branches, staff }: { customer: CustomerDraft | null; branches: Branch[]; staff: Person[] }) {
  const [shipping, setShipping] = useState(Boolean(customer?.shippingAddress));
  const [rows, setRows] = useState<Branch[]>(branches.length ? branches : []);
  const selected = new Set(customer?.staffIds ?? []);

  return (
    <div className="space-y-4">
    <form action={saveCustomer} className="space-y-4">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      <input type="hidden" name="branches" value={JSON.stringify(rows)} />

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="İsmi / Unvanı">
            <input name="name" required defaultValue={customer?.name} className={input} />
          </Field>
          <Field label="Resim Ekle">
            <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-[13px]" />
            {customer?.image ? (
              <span className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/musteri-foto/${customer.id}`} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <label className="flex items-center gap-2 text-[13px] text-[#475467]">
                  <input type="checkbox" name="remove_image" /> Resmi kaldır
                </label>
              </span>
            ) : null}
          </Field>
          <Field label="E-Posta" hint="Virgül ile ayırarak birden fazla adres girebilirsiniz.">
            <input name="emails" defaultValue={customer?.emails} className={input} />
          </Field>
          <Field label="Cep Telefonu">
            <input name="phone" defaultValue={customer?.phone} className={input} />
          </Field>
          <Field label="Diğer Erişim Bilgileri" hint="Sabit telefon, faks vb.">
            <input name="other" defaultValue={customer?.otherContact} className={input} />
          </Field>
          <Field label="Yetkili Kişi">
            <input name="person" defaultValue={customer?.contactPerson} className={input} />
          </Field>
          <Field label="Adres" className="md:col-span-2">
            <textarea name="address" defaultValue={customer?.address} className={`${input} h-20 py-2`} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold md:col-span-2">
            <input type="checkbox" name="different_shipping" checked={shipping} onChange={(event) => setShipping(event.target.checked)} />
            Farklı sevk adresi ekle
          </label>
          {shipping ? (
            <Field label="Sevk adresi" className="md:col-span-2">
              <textarea name="shipping" defaultValue={customer?.shippingAddress} className={`${input} h-20 py-2`} />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Vergi Dairesi">
            <input name="tax_office" defaultValue={customer?.taxOffice} className={input} />
          </Field>
          <Field label="Vergi / TC Kimlik No">
            <input name="tax_number" defaultValue={customer?.taxNumber} className={input} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" name="tax_exempt" defaultChecked={customer?.taxExempt} /> Vergiden muaf?
          </label>
          <Field label="Banka Bilgileri" hint="Müşterinizin banka hesap bilgilerini girebilirsiniz." className="md:col-span-2">
            <textarea name="bank" defaultValue={customer?.bankInfo} className={`${input} h-20 py-2`} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Müşteri Para Birimi">
            <select name="currency" defaultValue={customer?.currency || "TL"} className={input}>
              {currencies.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </Field>
          <Field label="Açık Hesap Risk Limiti">
            <input name="risk" inputMode="decimal" defaultValue={customer?.risk} placeholder="Boş bırakılabilir" className={input} />
          </Field>
          <Field label="Vadesi (gün)">
            <input name="due" inputMode="numeric" defaultValue={customer?.due} className={input} />
          </Field>
          <Field label="Sabit İskonto (%)">
            <input name="discount" inputMode="decimal" defaultValue={customer?.discount} className={input} />
          </Field>
          <Field label="Özel Fiyat Listesi" hint="Boş bırakırsan özel fiyat uygulanmaz.">
            <input name="price_list" defaultValue={customer?.priceList} placeholder="Özel fiyat uygulanmasın" className={input} />
          </Field>
          <Field label="Açılış Bakiyesi" hint="Müşteri sizden alacaklı ise eksi girin.">
            <input name="opening" inputMode="decimal" defaultValue={customer?.opening} className={input} />
          </Field>
          <Field label="Sınıflandırma 1">
            <input name="class1" defaultValue={customer?.class1} className={input} />
          </Field>
          <Field label="Sınıflandırma 2">
            <input name="class2" defaultValue={customer?.class2} className={input} />
          </Field>
          <Field label="Kodu" hint="Varsa muhasebe kodu veya barkod girebilirsiniz.">
            <input name="code" defaultValue={customer?.code} className={input} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <h2 className="text-[13px] font-semibold">Yetkili Çalışanlar</h2>
        <p className="mt-1 text-[12px] text-[#98a2b3]">Dilerseniz bu müşteriyi sadece seçtiğiniz çalışanların görmesini sağlayabilirsiniz.</p>
        <p className="mt-1 text-[12px]">
          <Link href="/panel/musteriler#toplu-atama" className="font-semibold text-[#c2410c]">Bu atama işlemini toplu olarak yapmak için tıklayın.</Link>
        </p>
        {staff.length === 0 ? <p className="mt-3 text-[13px] text-[#98a2b3]">Henüz çalışan yok. Aşağıdan ekleyebilirsin.</p> : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {staff.map((person) => (
              <label key={person.id} className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" name="staff" value={person.id} defaultChecked={selected.has(person.id)} />
                {person.name}
              </label>
            ))}
          </div>
        )}
        <Field label="Not" className="mt-4">
          <textarea name="note" defaultValue={customer?.note} className={`${input} h-24 py-2`} />
        </Field>
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-5">
        <h2 className="text-[13px] font-semibold">Şubeler</h2>
        <p className="mt-1 text-[12px] text-[#98a2b3]">Bu müşterinizin birden fazla şubesi varsa, her şube adresini burada ayrı ayrı ekleyebilirsiniz. Satış ekranında dilediğiniz şubeyi seçerek işlem yapabilirsiniz. Şubelere yaptığınız satışların carisi bu müşteriye yansıyacaktır.</p>
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-[#f2f4f7] p-3 md:grid-cols-[1fr_1.4fr_0.7fr_auto]">
              <input value={row.name} onChange={(event) => updateRow(index, "name", event.target.value)} placeholder="Şube Adı" className={input} />
              <input value={row.address} onChange={(event) => updateRow(index, "address", event.target.value)} placeholder="Adresi" className={input} />
              <input value={row.code} onChange={(event) => updateRow(index, "code", event.target.value)} placeholder="Şube Kodu, isteğe bağlı" className={input} />
              <button type="button" onClick={() => setRows(rows.filter((_, item) => item !== index))} className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows([...rows, { name: "", address: "", code: "" }])} className="mt-3 text-[13px] font-semibold text-[#c2410c]">
          Yeni Şube Ekleyin
        </button>
      </section>

      <div className="flex gap-3">
        <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        <Link href="/panel/musteriler" className="inline-flex h-10 items-center text-[13px] font-semibold text-[#475467]">Vazgeç</Link>
      </div>
    </form>
    <form action={addStaff} className="rounded-xl border border-[#eceff3] bg-white p-5">
      <h2 className="text-[13px] font-semibold">Çalışan ekle</h2>
      <div className="mt-3 flex gap-2">
        <input name="name" placeholder="Çalışan adı" className={input} />
        <button className="h-10 rounded-lg bg-[#1e293b] px-3 text-[13px] font-semibold text-white">Ekle</button>
      </div>
    </form>
    </div>
  );

  function updateRow(index: number, key: keyof Branch, value: string) {
    setRows(rows.map((row, item) => (item === index ? { ...row, [key]: value } : row)));
  }
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
