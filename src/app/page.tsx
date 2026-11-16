import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { References } from "@/components/references";
import { TrustBar } from "@/components/trust-bar";
import { Services } from "@/components/services";
import { HowItWorks } from "@/components/how-it-works";
import { Pricing } from "@/components/pricing";
import { FreeBand } from "@/components/free-band";
import { FounderBand } from "@/components/founder-band";
import { Faq } from "@/components/faq";
import { ContactForm } from "@/components/contact-form";
import { Footer } from "@/components/footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";

export default function Home() {
  const generalWhatsapp = whatsappHref(site.whatsappNumber, site.whatsappMessages.general);
  const founderWhatsapp = whatsappHref(site.whatsappNumber, site.whatsappMessages.founder);

  return (
    <>
      <a href="#icerik" className="skip-link">
        İçeriğe geç
      </a>
      <Header
        links={site.packagesEnabled ? site.nav : site.nav.filter((link) => link.href !== "#fiyatlar")}
        whatsappHref={generalWhatsapp}
        whatsappLabel={site.header.whatsappLabel}
        cta={site.header.cta}
        openMenu={site.header.openMenu}
        closeMenu={site.header.closeMenu}
      />
      <main id="icerik">
        <Hero />
        <References />
        <TrustBar />
        <Services />
        <HowItWorks />
        {site.packagesEnabled ? <Pricing /> : <FreeBand />}
        {site.packagesEnabled ? <FounderBand href={founderWhatsapp} /> : null}
        <Faq
          id={site.faq.id}
          eyebrow={site.faq.eyebrow}
          title={site.faq.title}
          items={site.faq.items}
        />
        <ContactForm content={site.contact} />
      </main>
      <Footer whatsappHref={generalWhatsapp} />
      <WhatsAppFloat href={generalWhatsapp} label="WhatsApp'tan yaz" />
    </>
  );
}
