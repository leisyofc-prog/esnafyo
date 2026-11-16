import { site } from "@/content/site";

export function FounderBand({ href }: { href: string }) {
  return (
    <section className="px-5 py-4" aria-label={site.founder.eyebrow}>
      <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-3xl border border-orange-100 bg-orange-50/70 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-strong uppercase">{site.founder.eyebrow}</p>
          <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-navy md:text-3xl">{site.founder.text}</p>
        </div>
        <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary shrink-0">
          {site.founder.cta}
        </a>
      </div>
    </section>
  );
}
