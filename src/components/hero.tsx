import { site } from "@/content/site";
import { RotatingLine } from "@/components/rotating-line";

export function Hero() {
  return (
    <section className="hero-grid px-5 pt-16 pb-6 md:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl md:text-7xl">
          <RotatingLine lines={site.hero.rotating} />
          <span className="mt-1 block text-navy">{site.hero.fixed}</span>
          <span className="mt-1 block text-brand underline decoration-brand/30 decoration-[3px] underline-offset-[10px]">
            {site.hero.brand}
          </span>
        </h1>
        {!site.packagesEnabled ? (
          <p className="mx-auto mt-6 inline-flex rounded-full bg-[#fff7ed] px-4 py-1.5 text-sm font-semibold text-[#c2410c]">
            Tamamen Ücretsiz
          </p>
        ) : null}
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
          {site.hero.text}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={site.packagesEnabled ? "#iletisim" : site.hero.primaryHref} className="btn-primary w-full sm:w-auto">
            {site.packagesEnabled ? "Konuşalım" : site.hero.primary}
            <span aria-hidden="true">→</span>
          </a>
          <a href={site.hero.secondaryHref} className="btn-secondary w-full sm:w-auto">
            <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[9px] text-white">
              ▶
            </span>
            {site.hero.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}
