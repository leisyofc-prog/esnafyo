"use client";

import { useEffect, useId, useRef, useState } from "react";

const languages = [
  { id: "tr", label: "Türkiye" },
  { id: "en", label: "English" },
  { id: "ar", label: "العربية" },
  { id: "ru", label: "Русский" },
  { id: "de", label: "Deutsch" },
  { id: "fr", label: "Français" },
  { id: "es", label: "Español" },
  { id: "it", label: "Italiano" },
] as const;

type LanguageId = (typeof languages)[number]["id"];

export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<LanguageId>("tr");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = languages.find((language) => language.id === current) ?? languages[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-1.5 text-navy hover:bg-slate-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Dil: ${selected.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Flag id={selected.id} />
        <Chevron open={open} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Dil seç"
          className="absolute top-11 left-0 z-50 max-h-80 w-44 overflow-auto rounded-xl border border-slate-100 bg-white py-1.5 shadow-[0_16px_40px_-24px_rgba(15,39,68,0.45)]"
        >
          {languages.map((language) => {
            const active = language.id === current;
            return (
              <li key={language.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${active ? "bg-slate-50 font-semibold text-navy" : "text-slate-700 hover:bg-slate-50"}`}
                  onClick={() => {
                    setCurrent(language.id);
                    document.documentElement.lang = language.id;
                    setOpen(false);
                  }}
                >
                  <Flag id={language.id} />
                  {language.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Flag({ id }: { id: LanguageId }) {
  return (
    <svg viewBox="0 0 20 14" className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" aria-hidden="true">
      {id === "tr" ? (
        <>
          <rect width="20" height="14" fill="#E30A17" />
          <circle cx="8.2" cy="7" r="3.1" fill="#fff" />
          <circle cx="9.1" cy="7" r="2.45" fill="#E30A17" />
          <polygon points="11.2,7 13.4,6.3 12.2,8.1 12.2,5.9 13.4,7.7" fill="#fff" />
        </>
      ) : null}
      {id === "en" ? (
        <>
          <rect width="20" height="14" fill="#012169" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#fff" strokeWidth="2.4" />
          <path d="M0 0 L20 14 M20 0 L0 14" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M10 0 V14 M0 7 H20" stroke="#fff" strokeWidth="4" />
          <path d="M10 0 V14 M0 7 H20" stroke="#C8102E" strokeWidth="2" />
        </>
      ) : null}
      {id === "ar" ? (
        <>
          <rect width="20" height="4.67" fill="#006C35" />
          <rect y="4.67" width="20" height="4.66" fill="#fff" />
          <rect y="9.33" width="20" height="4.67" fill="#000" />
        </>
      ) : null}
      {id === "ru" ? (
        <>
          <rect width="20" height="4.67" fill="#fff" />
          <rect y="4.67" width="20" height="4.66" fill="#0039A6" />
          <rect y="9.33" width="20" height="4.67" fill="#D52B1E" />
        </>
      ) : null}
      {id === "de" ? (
        <>
          <rect width="20" height="4.67" fill="#000" />
          <rect y="4.67" width="20" height="4.66" fill="#DD0000" />
          <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
        </>
      ) : null}
      {id === "fr" ? (
        <>
          <rect width="6.67" height="14" fill="#0055A4" />
          <rect x="6.67" width="6.66" height="14" fill="#fff" />
          <rect x="13.33" width="6.67" height="14" fill="#EF4135" />
        </>
      ) : null}
      {id === "es" ? (
        <>
          <rect width="20" height="14" fill="#AA151B" />
          <rect y="3.5" width="20" height="7" fill="#F1BF00" />
        </>
      ) : null}
      {id === "it" ? (
        <>
          <rect width="6.67" height="14" fill="#009246" />
          <rect x="6.67" width="6.66" height="14" fill="#fff" />
          <rect x="13.33" width="6.67" height="14" fill="#CE2B37" />
        </>
      ) : null}
    </svg>
  );
}
