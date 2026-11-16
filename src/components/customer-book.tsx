"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { assignCustomerStaff, deleteCustomer } from "@/app/panel/actions";
import { importCustomers, type CustomerImportResult } from "@/app/panel/musteriler/import-action";

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  emails: string;
  nextAppointment: string;
};

type Person = { id: string; name: string };

function CustomerImport({ supportEmail }: { supportEmail: string }) {
  const [result, submit, pending] = useActionState<CustomerImportResult | null, FormData>(importCustomers, null);

  return (
    <section className="rounded-xl border border-[#eceff3] bg-white p-5 text-[13px] text-[#475467]">
      <a href="/api/musteri-sablon" className="inline-flex h-9 items-center rounded-lg border border-[#e4e7ec] px-3 font-semibold text-[#1c2430]">
        Şablonu indir
      </a>
      <p className="mt-4">Mevcut müşterilerini tek tek tanımlamak uzun sürecekse, yukarıdaki düğmeyle şablon dosyasını bilgisayarına indir.</p>
      <p className="mt-2">Müşteri bilgilerini şablona kaydettikten sonra, aşağıdaki düğmeyle sisteme yükle.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Şablon üzerindeki kolonları değiştirme.</li>
        <li>Yalnızca Müşteri Unvanı zorunlu. Diğer alanlar isteğe bağlı.</li>
        <li>Bakiyesi alanına müşterinin sana olan borcunu yaz. Senden alacaklıysa eksi rakam yaz.</li>
        <li>Para birimi olarak TL, USD, EUR, GBP veya CHF yaz. Boş bırakırsan TL işlenir.</li>
        <li>Kuruş ayracı olarak nokta yerine virgül kullan. Örneğin 10,50.</li>
        <li>Aynı isimli bir müşteri varsa yeni kayıt açılmaz, mevcut kayıt güncellenir.</li>
      </ul>
      <form action={submit} className="mt-4 flex flex-wrap items-center gap-2">
        <input name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="text-[13px]" />
        <button disabled={pending} className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 font-semibold text-white">
          {pending ? "Yükleniyor" : "Excel yükle"}
        </button>
      </form>
      {result ? (
        <p className="mt-3 text-[#1c2430]">
          {result.created} yeni kayıt, {result.updated} güncelleme.
          {result.skipped.length ? ` Atlanan: ${result.skipped.slice(0, 5).join(" ")}` : ""}
        </p>
      ) : null}
      <p className="mt-3 text-[12px] text-[#98a2b3]">Takıldığın bir yer olursa dosyayı {supportEmail} adresine gönder.</p>
    </section>
  );
}

export function CustomerBook({ customers, staff, supportEmail }: { customers: CustomerListItem[]; staff: Person[]; supportEmail: string }) {
  const [bulk, setBulk] = useState(false);

  return (
    <div className="space-y-4">
      <CustomerImport supportEmail={supportEmail} />
      <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Müşteriler</h2>
            <p className="mt-1 text-[13px] text-[#98a2b3]">{customers.length} kişi kayıtlı. İletişim ve cari bilgileri burada durur.</p>
          </div>
          <Link href="/panel/musteriler/yeni" className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">
            + Yeni müşteri
          </Link>
        </div>
        <div className="border-t border-[#f2f4f7]">
          <div className="grid grid-cols-[1.2fr_0.8fr_1.2fr_auto] px-5 py-3 text-[12px] font-medium text-[#98a2b3]">
            <span>İsim / Unvan</span>
            <span>Cep telefonu</span>
            <span>Sıradaki randevu</span>
            <span />
          </div>
          {customers.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-[15px] font-semibold">Müşteri bulunamadı</p>
              <p className="mt-1 text-[13px] text-[#98a2b3]">İletişim kartını kaydetmek için yeni müşteri ekle.</p>
            </div>
          ) : (
            <ul>
              {customers.map((item) => (
                <li key={item.id} className="grid grid-cols-[1.2fr_0.8fr_1.2fr_auto] items-center gap-2 border-t border-[#f2f4f7] px-5 py-3 text-[13px]">
                  <Link href={`/panel/musteriler/${item.id}`} className="font-medium">{item.name}</Link>
                  <span>{item.phone || "—"}</span>
                  <span className="truncate text-[#475467]">{item.nextAppointment || item.emails || "Randevu yok"}</span>
                  <form action={deleteCustomer}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="toplu-atama" className="rounded-xl border border-[#eceff3] bg-white p-5">
        <button type="button" onClick={() => setBulk((value) => !value)} className="text-[13px] font-semibold text-[#c2410c]">
          Bu atama işlemini toplu olarak yapmak için tıklayın.
        </button>
        {bulk ? (
          <form action={assignCustomerStaff} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[13px] font-semibold">Müşteriler</p>
              <div className="mt-2 space-y-2">
                {customers.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-[13px]">
                    <input type="checkbox" name="customer" value={item.id} /> {item.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold">Yetkili çalışanlar</p>
              {staff.length === 0 ? <p className="mt-2 text-[13px] text-[#98a2b3]">Henüz çalışan yok. Müşteri kartından ekleyebilirsin.</p> : (
                <div className="mt-2 space-y-2">
                  {staff.map((person) => (
                    <label key={person.id} className="flex items-center gap-2 text-[13px]">
                      <input type="checkbox" name="staff" value={person.id} /> {person.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button className="h-10 w-fit rounded-lg bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Seçilenlere uygula</button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
