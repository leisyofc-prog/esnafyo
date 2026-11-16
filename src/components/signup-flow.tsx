"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageMenu } from "@/components/language-menu";
import { site } from "@/content/site";

type PackageChoice = {
  name: string;
  text: string;
  price: string;
  period: string;
};

const points = ["Web siten", "Randevu ve müşteri", "Gelir, gider, hesaplar", "Satış makbuzu"];

export function SignupFlow({ packages }: { packages: readonly PackageChoice[] }) {
  const [step, setStep] = useState<1 | 2>(site.packagesEnabled ? 1 : 2);
  const [selected, setSelected] = useState(packages[1]?.name ?? packages[0]?.name ?? "");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const chosen = packages.find((item) => item.name === selected) ?? packages[0];

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          business: data.get("business"),
          phone: data.get("phone"),
          email: data.get("email"),
          password: data.get("password"),
          packageName: selected,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Kayıt tamamlanamadı.");
        return;
      }
      window.location.href = "/panel";
    } catch {
      setError("Kayıt tamamlanamadı. Biraz sonra tekrar dene.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="signup-shell">
      <section className="signup-hero">
        <Link href="/" className="relative z-10 hidden w-fit rounded-xl bg-white px-3 py-2 lg:inline-flex">
          <Logo className="h-6" priority />
        </Link>
        <div className="relative z-10 max-w-md lg:mt-auto lg:pb-8">
          <p className="inline-flex rounded-full bg-[#f97316] px-3 py-1 text-xs font-semibold tracking-wide text-white">
            {site.packagesEnabled ? "Paketinle başla" : "Tamamen Ücretsiz"}
          </p>
          <h1 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight lg:mt-5 lg:text-5xl">
            Dükkânını dijitale
            <span className="mt-1 block text-[#fdba74] lg:mt-2">açalım</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75 lg:mt-5 lg:text-base">
            Site, randevu, müşteri ve muhasebe tek panelde. Kayıt olunca hemen girersin.
          </p>
          <ul className="mt-5 space-y-2 lg:mt-8 lg:space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#fdba74]">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#f97316]/30" />
        <div className="pointer-events-none absolute bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
      </section>

      <section className="flex flex-1 flex-col px-5 py-5 sm:px-8 lg:min-h-screen">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden">
            <Logo className="h-6" priority />
          </Link>
          <LanguageMenu />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 lg:py-8">
          {step === 1 && site.packagesEnabled ? (
            <div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Hangi paketi kullanmak istiyorsun?</h2>
              <p className="mt-2 text-sm text-slate-500">Sana uygun olanı seç. Sonra hesabını açarsın.</p>
              <div className="mt-6 space-y-3">
                {packages.map((item) => {
                  const active = item.name === selected;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelected(item.name)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left ${active ? "border-[#f97316] bg-[#fff7ed]" : "border-slate-200 bg-white"}`}
                    >
                      <span>
                        <span className="block font-semibold">{item.name}</span>
                        <span className="mt-1 block text-sm text-slate-500">{item.text}</span>
                      </span>
                      <span className="text-sm font-semibold">{item.price}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#f97316] text-base font-semibold text-white hover:bg-[#ea580c]" onClick={() => setStep(2)}>
                Devam et
              </button>
            </div>
          ) : (
            <form onSubmit={register}>
              <h2 className="text-3xl font-semibold tracking-tight">Hesabını aç</h2>
              <p className="mt-2 text-sm text-slate-500">
                {site.packagesEnabled && chosen ? `${chosen.name} · ${chosen.price} / ${chosen.period}` : "Bilgilerini yaz, paneline geç."}
              </p>
              <div className="mt-6 grid gap-4">
                <Field label="Adın" name="name" autoComplete="name" placeholder="Ayşe Yılmaz" />
                <Field label="İşletme adı" name="business" autoComplete="organization" placeholder="Lale Kuaför" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Telefon" name="phone" type="tel" autoComplete="tel" placeholder="05xx xxx xx xx" />
                  <Field label="E-posta" name="email" type="email" autoComplete="email" placeholder="ayse@dukkan.com" />
                </div>
                <label className="text-[13px] font-semibold">
                  Şifre
                  <span className="relative mt-2 block">
                    <input
                      name="password"
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="En az 8 karakter"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-16 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-[#f97316]"
                    />
                    <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-slate-500" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? "Gizle" : "Göster"}
                    </button>
                  </span>
                </label>
              </div>
              {error ? <p className="mt-4 rounded-xl bg-[#fff7ed] px-3 py-2 text-sm font-semibold text-[#c2410c]">{error}</p> : null}
              <div className="mt-6 flex gap-3">
                {site.packagesEnabled ? (
                  <button type="button" className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold" onClick={() => setStep(1)}>
                    Geri
                  </button>
                ) : null}
                <button type="submit" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#f97316] font-semibold text-white hover:bg-[#ea580c] disabled:opacity-70" disabled={sending}>
                  {sending ? "Kaydediliyor" : "Panele gir"}
                </button>
              </div>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">
            Hesabın var mı? <Link href="/giris" className="font-semibold text-navy">Giriş yap</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="text-[13px] font-semibold">
      {label}
      <input
        name={name}
        required
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-[#f97316]"
      />
    </label>
  );
}
