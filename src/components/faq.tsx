"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";

type FaqProps = {
  id: string;
  eyebrow: string;
  title: string;
  items: readonly { question: string; answer: string }[];
};

export function Faq({ id, eyebrow, title, items }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id={id} aria-labelledby="sss-baslik" className="scroll-mt-24 px-5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHeading id="sss-baslik" eyebrow={eyebrow} title={title} />
        <div className="panel mt-8 divide-y divide-slate-100">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `sss-panel-${index}`;
            const buttonId = `sss-buton-${index}`;

            return (
              <div key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-navy"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    {item.question}
                    <span aria-hidden="true" className="text-2xl leading-none font-semibold text-brand-strong">
                      {open ? "–" : "+"}
                    </span>
                  </button>
                </h3>
                {open ? (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-5 leading-relaxed text-ink-soft">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
