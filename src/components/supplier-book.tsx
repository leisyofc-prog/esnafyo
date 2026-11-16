"use client";

import { useActionState } from "react";
import Link from "next/link";
import { deleteSupplier } from "@/app/panel/tedarikciler/actions";
import { importSuppliers, type SupplierImportResult } from "@/app/panel/tedarikciler/import-action";

export type SupplierListItem = {
  id: string;
  name: string;
  phone: string;
  emails: string;
};

export function SupplierBook({ suppliers, supportEmail }: { suppliers: SupplierListItem[]; supportEmail: string }) {
  return (
    <div className="space-y-4">
      <SupplierImport supportEmail={supportEmail} />
      <section className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Tedarikçiler</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-[#98a2b3]">
              {suppliers.length === 0
                ? "Hiç tanımlı tedarikçiniz yok. 'Yeni Tedarikçi Ekle' butonuna tıklayarak ürün/hizmet aldığınız tedarikçilerinizi tanımlayabilirsiniz."
                : `${suppliers.length} tedarikçi kayıtlı.`}
            </p>
          </div>
          <Link href="/panel/tedarikciler/yeni" className="inline-flex h-9 items-center rounded-lg bg-[#f97316] px-3 text-[13px] font-semibold text-white">
            Yeni Tedarikçi Ekle
          </Link>
        </div>
        {suppliers.length > 0 ? (
          <div className="border-t border-[#f2f4f7]">
            <div className="grid grid-cols-[1.2fr_0.8fr_1.2fr_auto] px-5 py-3 text-[12px] font-medium text-[#98a2b3]">
              <span>İsim / Unvan</span>
              <span>Telefon</span>
              <span>E-posta</span>
              <span />
            </div>
            <ul>
              {suppliers.map((item) => (
                <li key={item.id} className="grid grid-cols-[1.2fr_0.8fr_1.2fr_auto] items-center gap-2 border-t border-[#f2f4f7] px-5 py-3 text-[13px]">
                  <Link href={`/panel/tedarikciler/${item.id}`} className="font-medium">{item.name}</Link>
                  <span>{item.phone || "—"}</span>
                  <span className="truncate text-[#475467]">{item.emails || "—"}</span>
                  <form action={deleteSupplier}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-[12px] font-semibold text-[#98a2b3]">Sil</button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SupplierImport({ supportEmail }: { supportEmail: string }) {
  const [result, submit, pending] = useActionState<SupplierImportResult | null, FormData>(importSuppliers, null);

  return (
    <section className="rounded-xl border border-[#eceff3] bg-white p-5 text-[13px] text-[#475467]">
      <a href="/api/tedarikci-sablon" className="inline-flex h-9 items-center rounded-lg border border-[#e4e7ec] px-3 font-semibold text-[#1c2430]">
        Şablonu indir
      </a>
      <p className="mt-4">Tedarikçilerini tek tek tanımlamak uzun sürecekse, yukarıdaki düğmeyle şablon dosyasını bilgisayarına indir.</p>
      <p className="mt-2">Bilgileri şablona kaydettikten sonra, aşağıdaki düğmeyle sisteme yükle.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Şablon üzerindeki kolonları değiştirme.</li>
        <li>Yalnızca Tedarikçi Unvanı zorunlu. Diğer alanlar isteğe bağlı.</li>
        <li>Bakiyesi alanına tedarikçiye olan borcunu yaz. Tedarikçi sana borçluysa eksi rakam yaz.</li>
        <li>Para birimi olarak TL, USD, EUR, GBP veya CHF yaz. Boş bırakırsan TL işlenir.</li>
        <li>Kuruş ayracı olarak nokta yerine virgül kullan. Örneğin 10,50.</li>
        <li>Aynı isimli bir tedarikçi varsa yeni kayıt açılmaz, mevcut kayıt güncellenir.</li>
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
