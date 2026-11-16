"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/content/site";
import { Logo } from "@/components/logo";
import { WhatsAppGlyph } from "@/components/icons";
import { LanguageMenu } from "@/components/language-menu";

type HeaderProps = {
  links: readonly NavItem[];
  whatsappHref: string;
  whatsappLabel: string;
  cta: string;
  openMenu: string;
  closeMenu: string;
};

export function Header({
  links,
  whatsappHref,
  whatsappLabel,
  cta,
  openMenu,
  closeMenu,
}: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <Logo priority className="h-6" />
          </Link>
          <LanguageMenu />
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Sayfa bölümleri">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href.startsWith("#") ? `/${link.href}` : link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy sm:inline-flex"
          >
            <WhatsAppGlyph className="h-4 w-4 text-[#128C7E]" />
            {whatsappLabel}
          </a>
          <Link href="/uye-ol" className="hidden text-sm font-semibold text-navy sm:inline">
            Üye Ol
          </Link>
          <a href="/#iletisim" className="btn-primary hidden min-h-10 px-4 text-sm sm:inline-flex">
            {cta}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-navy md:hidden"
            aria-expanded={open}
            aria-controls="mobil-menu"
            aria-label={open ? closeMenu : openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true" className="flex w-4 flex-col gap-1">
              <span className={`block h-0.5 w-full bg-current transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-full bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-full bg-current transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobil-menu" className="border-t border-slate-100 bg-white px-5 py-3 md:hidden" aria-label="Sayfa bölümleri">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href.startsWith("#") ? `/${link.href}` : link.href}
                  className="block rounded-xl px-2 py-3 text-base font-medium text-navy"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/uye-ol" className="mt-2 block rounded-xl px-2 py-3 text-base font-semibold text-navy" onClick={() => setOpen(false)}>
            Üye Ol
          </Link>
          <a href={whatsappHref} className="mt-2 inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-slate-600">
            <WhatsAppGlyph className="h-4 w-4 text-[#128C7E]" />
            {whatsappLabel}
          </a>
        </nav>
      ) : null}
    </header>
  );
}
