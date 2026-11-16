import { site } from "@/content/site";

export function References() {
  return (
    <section aria-label="Referanslarımız" className="py-12">
      <h2 className="px-5 text-center text-3xl font-semibold tracking-tight text-navy md:text-4xl">
        {site.references.lead} <span className="text-brand">{site.references.accent}</span>
      </h2>
      <p className="mx-auto mt-4 max-w-2xl px-5 text-center text-sm leading-relaxed text-ink-soft md:text-base">
        {site.references.text}
      </p>
      <div className="logo-marquee mt-10">
        <div className="logo-marquee-track">
          <LogoSet />
          <LogoSet hidden />
        </div>
      </div>
    </section>
  );
}

function LogoSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex min-w-full shrink-0 items-center justify-around gap-16 px-8" aria-hidden={hidden}>
      {site.partners.map((partner) => (
        <li key={`${partner.name}-${hidden ? "loop" : "main"}`} className="flex shrink-0 items-center">
          <a
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={hidden ? undefined : partner.name}
            tabIndex={hidden ? -1 : undefined}
            className="inline-flex items-center"
          >
            <img
              src={partner.src}
              alt=""
              className={partner.name === "Vercel" ? "h-6 w-auto" : "h-9 w-auto"}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
