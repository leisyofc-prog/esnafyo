import { site } from "@/content/site";
import { SectionHeading } from "@/components/section-heading";

export function Pricing() {
  const { pricing } = site;

  return (
    <section id={pricing.id} aria-labelledby="fiyatlar-baslik" className="scroll-mt-24 bg-[#f7f9fc] px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading id="fiyatlar-baslik" eyebrow={pricing.eyebrow} title={pricing.title} text={pricing.text} align="split" />
        <ul className="mt-10 grid items-stretch gap-4 lg:grid-cols-3">
          {pricing.items.map((plan) => (
            <li
              key={plan.name}
              className={`reveal flex flex-col rounded-3xl border bg-white p-6 ${
                plan.popular ? "border-brand shadow-[0_24px_50px_-32px_rgba(249,115,22,0.7)]" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-navy">{plan.name}</h3>
                {plan.popular ? (
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-brand-strong">
                    En Popüler
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {plan.text}
              </p>
              <p className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-navy">{plan.price}</span>
                <span className="mb-1 text-sm font-medium text-ink-soft">
                  {plan.period}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm font-medium text-navy">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-brand">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#iletisim"
                className={`mt-8 ${plan.popular ? "btn-primary" : "btn-secondary"}`}
              >
                {pricing.cta}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
