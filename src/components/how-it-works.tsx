import Image from "next/image";
import { site } from "@/content/site";

export function HowItWorks() {
  const { steps } = site;

  return (
    <section id={steps.id} aria-labelledby="adimlar-baslik" className="scroll-mt-24 px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <h2 id="adimlar-baslik" className="text-3xl leading-tight font-semibold tracking-tight text-navy md:text-4xl">
            {steps.titleLead}
            <span className="mt-1 block text-brand">{steps.titleAccent}</span>
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{steps.text}</p>
          <ol className="mt-6 space-y-3">
            {steps.items.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-[#f7f9fc] px-4 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-semibold text-navy">{step.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="/uye-ol" className="btn-primary">
              {steps.start}
              <span aria-hidden="true">→</span>
            </a>
            <a href="#hizmetler" className="btn-secondary">
              {steps.more}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <StepVisual />
      </div>
    </section>
  );
}

function StepVisual() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[0_30px_70px_-40px_rgba(15,39,68,0.8)]">
      <Image
        src="/nasil-calisir.png"
        alt="Dört adım: hesabını aç, müşteri ve hesap ekle, günlük işi işle, ayın raporunu al."
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
    </div>
  );
}
