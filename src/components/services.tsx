import { site } from "@/content/site";
import { Icon } from "@/components/icons";

export function Services() {
  const { services } = site;

  return (
    <section id={services.id} aria-labelledby="hizmetler-baslik" className="scroll-mt-24 bg-[#f7f9fc] px-5 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="hizmetler-baslik" className="text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              {services.titleLead} <span className="text-brand">{services.titleAccent}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft md:text-base">{services.text}</p>
          </div>
          <a href="/uye-ol" className="btn-primary shrink-0">
            {services.all}
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.items.map((item) => (
            <li key={item.title} className="flex flex-col rounded-3xl border border-slate-200/80 bg-white px-5 py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-brand-strong">
                <Icon name={item.icon} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
