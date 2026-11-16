import { mapsLink, whatsappLink, type PublicShop } from "@/lib/shop-site";

export function ShopVitrin({ shop, preview = false }: { shop: PublicShop; preview?: boolean }) {
  const title = shop.headline.trim() || shop.businessName;
  const call = shop.phone ? `tel:${shop.phone}` : "";
  const whatsapp = whatsappLink(shop.whatsapp);
  const map = mapsLink(shop.address);
  const logoSrc = shop.hasLogo ? `/api/d/${shop.slug}/logo` : "";
  const coverSrc = shop.hasCover ? `/api/d/${shop.slug}/kapak` : "";
  const hours = [shop.openTime && shop.closeTime ? `${shop.openTime}–${shop.closeTime}` : "", shop.closedDays ? `Kapalı: ${shop.closedDays}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={preview ? "bg-[#fffaf6] text-[#1e293b]" : "min-h-full bg-[#fffaf6] text-[#1e293b]"} style={{ ["--shop-theme" as string]: shop.themeColor }}>
      {!shop.enabled && preview ? (
        <p className="bg-[#fff1f1] px-4 py-2 text-center text-[12px] font-semibold text-[#dc2626]">Site şu an yayında değil. Kaydedince buradan önizlenir, bağlantı açılmaz.</p>
      ) : null}
      {shop.campaign ? (
        <div className="px-4 py-2 text-center text-[13px] font-semibold text-white" style={{ background: shop.themeColor }}>{shop.campaign}</div>
      ) : null}
      {coverSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverSrc} alt="" className="h-44 w-full object-cover sm:h-56" />
      ) : (
        <div className="h-28 w-full sm:h-36" style={{ background: `linear-gradient(180deg, ${shop.themeColor}, #fffaf6)` }} />
      )}
      <div className="mx-auto max-w-lg px-4 pb-24">
        <div className="-mt-12 flex items-end gap-3">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={`${shop.businessName} logosu`} className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-contain shadow-sm" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white text-2xl font-semibold text-white shadow-sm" style={{ background: shop.themeColor }}>
              {shop.businessName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pb-1">
            <p className="text-[12px] font-semibold" style={{ color: shop.themeColor }}>{shop.businessName}</p>
            <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
          </div>
        </div>

        {shop.about ? <p className="mt-5 whitespace-pre-line text-[15px] leading-6 text-[#475467]">{shop.about}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {call ? (
            <a href={call} className="inline-flex h-10 items-center rounded-full bg-[#1e293b] px-4 text-[13px] font-semibold text-white">Ara</a>
          ) : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold text-white" style={{ background: "#16a34a" }}>WhatsApp</a>
          ) : null}
          {map ? (
            <a href={map} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full border border-[#e4e7ec] bg-white px-4 text-[13px] font-semibold">Haritada aç</a>
          ) : null}
        </div>

        <section className="mt-6 space-y-2 rounded-2xl border border-[#eceff3] bg-white p-4 text-[13px]">
          {hours ? (
            <p><span className="font-semibold">Çalışma saatleri: </span>{hours}</p>
          ) : null}
          {shop.address ? (
            <p><span className="font-semibold">Adres: </span>{map ? <a href={map} target="_blank" rel="noreferrer" className="underline decoration-[#e4e7ec] underline-offset-2">{shop.address}</a> : shop.address}</p>
          ) : null}
          {shop.phone ? <p><span className="font-semibold">Telefon: </span><a href={call}>{shop.phone}</a></p> : null}
          {(shop.instagramUrl || shop.facebookUrl) ? (
            <p className="flex flex-wrap gap-3">
              {shop.instagramUrl ? <a href={shop.instagramUrl} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: shop.themeColor }}>Instagram</a> : null}
              {shop.facebookUrl ? <a href={shop.facebookUrl} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: shop.themeColor }}>Facebook</a> : null}
            </p>
          ) : null}
        </section>

        {shop.products.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-[16px] font-semibold">Ürün ve hizmetler</h2>
            {shop.priceNote ? <p className="mt-1 text-[13px] text-[#98a2b3]">{shop.priceNote}</p> : null}
            <ul className="mt-3 divide-y divide-[#f2f4f7] overflow-hidden rounded-2xl border border-[#eceff3] bg-white">
              {shop.products.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
                  <span className="font-medium">{item.name}</span>
                  {item.priceLabel ? <span className="shrink-0 font-semibold" style={{ color: shop.themeColor }}>{item.priceLabel}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : shop.priceNote ? (
          <p className="mt-6 rounded-2xl border border-[#eceff3] bg-white p-4 text-[14px]">{shop.priceNote}</p>
        ) : null}

        <p className="mt-8 text-center text-[11px] text-[#98a2b3]">Esnafyo ile hazırlandı</p>
      </div>

      {(call || whatsapp) && !preview ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-[#eceff3] bg-white/95 p-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-lg gap-2">
            {call ? <a href={call} className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#1e293b] text-[13px] font-semibold text-white">Ara</a> : null}
            {whatsapp ? <a href={whatsapp} className="flex h-11 flex-1 items-center justify-center rounded-full text-[13px] font-semibold text-white" style={{ background: "#16a34a" }}>WhatsApp</a> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
