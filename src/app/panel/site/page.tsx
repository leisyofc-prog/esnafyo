import { connection } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, listProducts } from "@/lib/panel";
import { addShopProduct, saveSite, toggleShopProduct } from "../actions";
import { ShopLinkActions } from "@/components/shop-link-actions";
import { ShopVitrin } from "@/components/shop-vitrin";
import { DEFAULT_THEME_COLOR, productPriceLabel, publicShopFromSettings, shopPublicPath, shopPublicUrl } from "@/lib/shop-site";

export const instant = false;

const field = "mt-1 h-10 w-full rounded-lg border border-[#e4e7ec] px-3 text-[13px] font-normal";
const area = "mt-1 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 text-[13px] font-normal";
const label = "block text-[13px] font-semibold";

export default async function SitePage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const [settings, products] = await Promise.all([getSettings(user.id), listProducts(user.id)]);
  if (!settings) return null;
  const shop = publicShopFromSettings({
    userId: user.id,
    businessName: user.business_name,
    ownerName: user.name,
    phone: user.phone,
    settings,
    products,
  });
  const path = shopPublicPath(shop.slug);
  const link = shopPublicUrl(shop.slug);
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 240 });

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#eceff3] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold">Web sitem</h2>
            <p className="mt-1 text-[13px] text-[#98a2b3]">Müşterilerin göreceği dükkân sayfası. Kaydettikten sonra önizleme ve bağlantı güncellenir.</p>
            <p className="mt-2 truncate text-[13px] font-semibold text-[#1e293b]">{link}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${shop.enabled ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#fff1f1] text-[#dc2626]"}`}>
            {shop.enabled ? "Yayında" : "Kapalı"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-start gap-4">
          <ShopLinkActions href={path} />
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Dükkân sitesinin QR kodu" className="mx-auto h-28 w-28 rounded-lg border border-[#eceff3] bg-white p-1" />
            <p className="mt-1 text-[11px] text-[#98a2b3]">Dükkâna as, müşteri okutsun.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form action={saveSite} className="space-y-4">
          <section className="rounded-xl border border-[#eceff3] bg-white p-4">
            <h3 className="text-[15px] font-semibold">Yayın</h3>
            <label className="mt-3 flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="site_enabled" defaultChecked={shop.enabled} />
              Siteyi yayına al
            </label>
            <label className={`${label} mt-3`}>
              Site adresi
              <input name="slug" defaultValue={shop.slug} required className={field} />
            </label>
            <p className="mt-1 text-[12px] text-[#98a2b3]">Adres {path} olur. Harf, rakam ve tire kullan.</p>
            <label className={`${label} mt-3`}>
              Tema rengi
              <input name="theme_color" type="color" defaultValue={shop.themeColor || DEFAULT_THEME_COLOR} className="mt-1 h-10 w-16 cursor-pointer rounded-lg border border-[#e4e7ec] p-1" />
            </label>
          </section>

          <section className="rounded-xl border border-[#eceff3] bg-white p-4">
            <h3 className="text-[15px] font-semibold">Görünüm ve metin</h3>
            <label className={`${label} mt-3`}>Başlık
              <input name="headline" defaultValue={settings.headline} placeholder="Dükkânının öne çıkan cümlesi" className={field} />
            </label>
            <label className={`${label} mt-3`}>Hakkında
              <textarea name="about" defaultValue={settings.about} rows={4} placeholder="Kısa tanıtım yazısı" className={area} />
            </label>
            <label className={`${label} mt-3`}>Kampanya bandı
              <input name="campaign" defaultValue={settings.campaign} placeholder="Örn. Bu hafta ilk tıraş hediye" className={field} />
            </label>
            <label className={`${label} mt-3`}>Fiyat notu
              <input name="price" defaultValue={settings.price_note} placeholder="Örn. Fiyatlara KDV dahildir" className={field} />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={label}>Logo
                <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[13px] font-normal" />
                <span className="mt-1 block text-[12px] font-normal text-[#98a2b3]">JPEG, PNG veya WebP. En fazla 10 MB.</span>
              </label>
              <label className={label}>Kapak görseli
                <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-[13px] font-normal" />
                <span className="mt-1 block text-[12px] font-normal text-[#98a2b3]">JPEG, PNG veya WebP. En fazla 10 MB.</span>
              </label>
            </div>
            {shop.hasCover ? (
              <label className="mt-2 flex items-center gap-2 text-[13px] font-normal">
                <input type="checkbox" name="remove_cover" /> Kapak görselini kaldır
              </label>
            ) : null}
          </section>

          <section className="rounded-xl border border-[#eceff3] bg-white p-4">
            <h3 className="text-[15px] font-semibold">İletişim ve konum</h3>
            <label className={`${label} mt-3`}>Adres
              <textarea name="address" defaultValue={settings.address} rows={2} placeholder="Müşterinin haritada açacağı adres" className={area} />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className={label}>Telefon
                <input name="public_phone" defaultValue={settings.public_phone || user.phone} className={field} />
              </label>
              <label className={label}>WhatsApp
                <input name="whatsapp" defaultValue={settings.whatsapp_number || user.phone} placeholder="90532..." className={field} />
              </label>
              <label className={label}>Instagram
                <input name="instagram" defaultValue={settings.instagram_url} placeholder="https://instagram.com/..." className={field} />
              </label>
              <label className={label}>Facebook
                <input name="facebook" defaultValue={settings.facebook_url} placeholder="https://facebook.com/..." className={field} />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={label}>Açılış
                <input name="open" type="time" defaultValue={settings.open_time} className={field} />
              </label>
              <label className={label}>Kapanış
                <input name="close" type="time" defaultValue={settings.close_time} className={field} />
              </label>
            </div>
            <label className={`${label} mt-3`}>Kapalı günler
              <input name="closed" defaultValue={settings.closed_days} placeholder="Pazar" className={field} />
            </label>
          </section>

          <section className="rounded-xl border border-[#eceff3] bg-white p-4">
            <h3 className="text-[15px] font-semibold">Arama ve paylaşım</h3>
            <label className={`${label} mt-3`}>SEO başlığı
              <input name="seo_title" defaultValue={settings.seo_title} maxLength={80} placeholder="Arama sonuçlarında görünecek başlık" className={field} />
            </label>
            <label className={`${label} mt-3`}>SEO açıklaması
              <textarea name="seo_description" defaultValue={settings.seo_description} maxLength={200} rows={3} placeholder="Kısa açıklama" className={area} />
            </label>
            <p className="mt-2 text-[12px] text-[#98a2b3]">Paylaşım görseli olarak kapak, yoksa logo kullanılır.</p>
          </section>

          <button className="h-10 rounded-lg bg-[#16a34a] px-4 text-[13px] font-semibold text-white">Kaydet</button>
        </form>

        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <section className="rounded-xl border border-[#eceff3] bg-white p-3">
            <h3 className="px-1 text-[15px] font-semibold">Canlı önizleme</h3>
            <div className="mt-3 overflow-hidden rounded-[1.6rem] border border-[#e4e7ec] bg-[#fffaf6]">
              <ShopVitrin shop={shop} preview />
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-[#eceff3] bg-white p-4">
        <h3 className="text-[15px] font-semibold">Sitedeki ürün ve hizmetler</h3>
        <p className="mt-1 text-[13px] text-[#98a2b3]">Satış kataloğundaki kayıtlar burada listelenir. Sitede göstermek istediğini açık tut.</p>
        <form action={addShopProduct} className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <input name="name" required placeholder="Ad, örn. Saç kesimi" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          <input name="price" placeholder="Fiyat" className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]" />
          <button className="h-10 rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">Ekle</button>
        </form>
        {products.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#98a2b3]">Henüz ürün veya hizmet yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f2f4f7]">
            {products.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-[12px] text-[#98a2b3]">{productPriceLabel(item) || "Fiyat yok"}</p>
                </div>
                <form action={toggleShopProduct}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className={`rounded-full px-3 py-1 text-[12px] font-semibold ${item.show_on_site ? "bg-[#ecfdf3] text-[#15803d]" : "bg-[#f2f4f7] text-[#667085]"}`}>
                    {item.show_on_site ? "Sitede görünüyor" : "Gizli"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
