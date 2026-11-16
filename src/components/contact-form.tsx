"use client";

import { useState } from "react";
import type { ContactContent } from "@/content/site";
import { SectionHeading } from "@/components/section-heading";

export function ContactForm({ content }: { content: ContactContent }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  return (
    <section id={content.id} aria-labelledby="iletisim-baslik" className="scroll-mt-24 bg-[#f7f9fc] px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <SectionHeading id="iletisim-baslik" eyebrow={content.eyebrow} title={content.title} text={content.text} />

        {sent ? (
          <div role="status" className="panel p-8">
            <p className="text-2xl font-extrabold text-navy">{content.success}</p>
            <button type="button" className="btn-secondary mt-6" onClick={() => setSent(false)}>
              {content.another}
            </button>
          </div>
        ) : (
          <form
            className="panel p-5 sm:p-8"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              if (!form.reportValidity()) return;

              const data = new FormData(form);
              setSending(true);
              setError("");

              try {
                const response = await fetch("/api/leads", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: data.get("name"),
                    business: data.get("business"),
                    sector: data.get("sector"),
                    phone: data.get("phone"),
                    message: data.get("message"),
                  }),
                });

                if (!response.ok) {
                  setError("Mesajın kaydedilemedi. Biraz sonra tekrar dene.");
                  return;
                }

                setSent(true);
              } catch {
                setError("Mesajın kaydedilemedi. Biraz sonra tekrar dene.");
              } finally {
                setSending(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={content.fields.name} name="name" autoComplete="name" placeholder={content.placeholders.name} />
              <Field
                label={content.fields.business}
                name="business"
                autoComplete="organization"
                placeholder={content.placeholders.business}
              />
              <label className="block text-sm font-bold text-navy">
                {content.fields.sector}
                <select
                  name="sector"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-navy"
                >
                  <option value="" disabled>
                    {content.placeholders.sector}
                  </option>
                  {content.sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label={content.fields.phone}
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder={content.placeholders.phone}
              />
            </div>
            <label className="mt-4 block text-sm font-bold text-navy">
              {content.fields.message}
              <textarea
                name="message"
                required
                rows={4}
                placeholder={content.placeholders.message}
                className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-navy"
              />
            </label>
            {error ? <p className="mt-4 text-sm font-semibold text-brand-strong">{error}</p> : null}
            <button type="submit" className="btn-primary mt-5 w-full sm:w-auto" disabled={sending}>
              {sending ? "Gönderiliyor" : content.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
  inputMode?: "tel";
}) {
  return (
    <label className="block text-sm font-bold text-navy">
      {label}
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-navy"
      />
    </label>
  );
}
