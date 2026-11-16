import { site } from "@/content/site";
import { Logo } from "@/components/logo";
import { InstagramGlyph, WhatsAppGlyph } from "@/components/icons";

const serviceLinks = site.services.items.slice(0, 4).map((item) => ({
  href: "#hizmetler",
  label: item.title,
}));

const packageLinks = site.pricing.items.map((item) => ({
  href: "#fiyatlar",
  label: item.name,
}));

const pageLinks = [
  ...(site.packagesEnabled ? site.nav : site.nav.filter((link) => link.href !== "#fiyatlar")),
  { href: "#iletisim", label: "İletişim" },
];

export function Footer({ whatsappHref }: { whatsappHref: string }) {
  return (
    <footer className="border-t border-slate-200 bg-white px-5 pt-12 pb-28 text-navy">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-6">
          <Logo className="h-6" />
          <div className="flex items-center gap-4 text-slate-500">
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-navy">
              <InstagramGlyph className="h-5 w-5" />
            </a>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-navy">
              <WhatsAppGlyph className="h-5 w-5" />
            </a>
          </div>
        </div>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">{site.footer.blurb}</p>

        <div className={`mt-12 grid grid-cols-2 gap-8 ${site.packagesEnabled ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          <LinkColumn title={site.footer.services} links={serviceLinks} />
          {site.packagesEnabled ? (
            <LinkColumn title={site.footer.packages} links={packageLinks} />
          ) : (
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">Ücret</p>
              <p className="mt-4 text-sm font-semibold text-navy">Tamamen Ücretsiz</p>
            </div>
          )}
          <LinkColumn title={site.footer.explore} links={pageLinks} />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{site.footer.contact}</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-navy">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-navy">
                  WhatsApp’tan yaz
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{site.footer.stack}</p>
            {site.partners.map((partner) => (
              <a key={partner.name} href={partner.href} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>
                <img src={partner.src} alt="" className={partner.name === "Vercel" ? "h-4 w-auto" : "h-5 w-auto"} />
              </a>
            ))}
          </div>
          <a href="#hizmetler" className="text-sm font-medium text-navy hover:text-brand-strong">
            Hizmetlere git →
          </a>
        </div>

        <p className="mt-8 text-xs text-slate-400">{site.footer.rights}</p>
      </div>
    </footer>
  );
}

function LinkColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="text-sm text-slate-600 hover:text-navy">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
