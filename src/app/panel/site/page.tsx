import { connection } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/panel";
import { site } from "@/content/site";
import { saveSite } from "../actions";

export const instant = false;

export default async function SitePage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const settings = await getSettings(user.id);
  const link = `${site.url.replace(/\/$/, "")}/d/${settings?.public_slug ?? "dukkan"}`;
  const qr = await QRCode.toDataURL(link, { margin: 1, width: 240 });

  return (
    <main>
      <h1 className="text-2xl font-semibold text-navy">Web sitem</h1>
      <form action={saveSite} className="mt-4 space-y-2 rounded-2xl bg-white p-4">
        <input name="headline" defaultValue={settings?.headline} placeholder="Başlık" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <textarea name="about" defaultValue={settings?.about} placeholder="Kısa metin" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <input name="price" defaultValue={settings?.price_note} placeholder="Fiyat satırı" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <input name="campaign" defaultValue={settings?.campaign} placeholder="Kampanya bandı" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button className="btn-primary w-full">Kaydet</button>
      </form>
      <div className="mt-4 rounded-2xl bg-white p-4 text-center">
        <a href={link} className="text-sm font-semibold text-navy">{link}</a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="Dükkân sitesinin QR kodu" className="mx-auto mt-4 h-40 w-40" />
        <p className="mt-2 text-xs text-slate-500">Bunu dükkâna as. Müşteri okutunca siteye gider.</p>
      </div>
    </main>
  );
}
