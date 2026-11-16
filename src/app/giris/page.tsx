"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { LanguageMenu } from "@/components/language-menu";

const points = ["Randevuların", "Müşterilerin", "Gelir ve gider", "Hesapların"];

export default function LoginPage() {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Giriş yapılamadı.");
        return;
      }
      window.location.href = new URLSearchParams(window.location.search).get("yon") === "/admin" ? "/admin" : "/panel";
    } catch {
      setError("Giriş yapılamadı. Biraz sonra tekrar dene.");
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
          <p className="inline-flex rounded-full bg-[#f97316] px-3 py-1 text-xs font-semibold tracking-wide">Panele dönüş</p>
          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight lg:mt-5 lg:text-5xl">
            Dükkânın seni
            <span className="mt-1 block text-[#fdba74] lg:mt-2">bekliyor</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed lg:mt-5 lg:text-base">Kayıtlı e-postan ve şifrenle panele gir.</p>
          <ul className="mt-5 space-y-2 lg:mt-8 lg:space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316] text-xs text-white">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full" style={{ background: "rgba(249,115,22,0.28)" }} />
        <div className="pointer-events-none absolute bottom-16 -left-16 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      </section>

      <section className="flex flex-1 flex-col px-5 py-5 sm:px-8 lg:min-h-screen">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:hidden">
            <Logo className="h-6" priority />
          </Link>
          <LanguageMenu />
        </div>

        <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6 lg:py-8">
          <h2 className="text-3xl font-semibold tracking-tight">Panele giriş</h2>
          <p className="mt-2 text-sm text-slate-500">E-postan ve şifren yeterli.</p>
          <label className="mt-6 text-[13px] font-semibold">
            E-posta
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ayse@dukkan.com"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-[#f97316]"
            />
          </label>
          <label className="mt-4 text-[13px] font-semibold">
            Şifre
            <span className="relative mt-2 block">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Şifren"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-16 text-[15px] font-medium outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-[#f97316]"
              />
              <button type="button" className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-slate-500" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Gizle" : "Göster"}
              </button>
            </span>
          </label>
          {error ? <p className="mt-4 rounded-xl bg-[#fff7ed] px-3 py-2 text-sm font-semibold text-[#c2410c]">{error}</p> : null}
          <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#f97316] font-semibold text-white hover:bg-[#ea580c] disabled:opacity-70" disabled={sending}>
            {sending ? "Giriş yapılıyor" : "Giriş yap"}
          </button>
          <p className="mt-6 text-center text-sm text-slate-500">
            Hesabın yok mu? <Link href="/uye-ol" className="font-semibold text-navy">Üye ol</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
