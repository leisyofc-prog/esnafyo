"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

type IconName = "home" | "people" | "chat" | "megaphone" | "panel" | "log";

const menu: { title: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    title: "Ana menü",
    items: [
      { href: "/admin", label: "Özet", icon: "home" },
      { href: "/admin/uyeler", label: "Esnaflar", icon: "people" },
      { href: "/admin/mesajlar", label: "Mesajlar", icon: "chat" },
    ],
  },
  {
    title: "İçerik",
    items: [
      { href: "/admin/duyurular", label: "Duyurular", icon: "megaphone" },
      { href: "/admin/loglar", label: "İşlem günlüğü", icon: "log" },
    ],
  },
  {
    title: "Esnaf",
    items: [{ href: "/panel", label: "Esnaf paneli", icon: "panel" }],
  },
];

const titles: Record<string, string> = {
  "/admin": "Özet",
  "/admin/uyeler": "Esnaflar",
  "/admin/mesajlar": "Mesajlar",
  "/admin/duyurular": "Duyurular",
  "/admin/loglar": "İşlem günlüğü",
};

export function AdminShell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(menu.map((group) => [group.title, true])));
  const title = titles[path] ?? "Yönetim";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#1c2430]">
      {open ? <button type="button" className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Menüyü kapat" onClick={() => setOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-[#eceff3] bg-white ${open ? "translate-x-0" : "-translate-x-full"} transition lg:translate-x-0`}>
        <div className="flex h-[60px] items-center px-5">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <Logo className="h-6" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {menu.map((group) => {
            const expanded = groups[group.title] !== false;
            return (
              <div key={group.title} className="mb-3">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setGroups((current) => ({ ...current, [group.title]: !expanded }))}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-left"
                >
                  <span className="text-[10px] font-semibold tracking-[0.14em] text-[#b0b7c3] uppercase">{group.title}</span>
                  <span className="text-base leading-none text-[#98a2b3]">{expanded ? "−" : "+"}</span>
                </button>
                {expanded ? (
                  <ul>
                    {group.items.map((item) => {
                      const active = item.href === "/admin" ? path === "/admin" : item.href !== "/panel" && path.startsWith(item.href);
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13.5px] ${active ? "bg-[#f4f6f8] font-semibold text-[#1c2430]" : "text-[#3f4856] hover:bg-[#f8fafc]"}`}
                          >
                            <MenuIcon name={item.icon} />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="m-3 flex items-center gap-2.5 rounded-xl border border-[#eceff3] px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f6f8] text-[11px] font-semibold text-[#475467]">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-4">{name}</span>
            <span className="block truncate text-[11px] text-[#98a2b3]">{email}</span>
          </span>
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f97316] text-[9px] text-white">✓</span>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-[#eceff3] bg-white px-5">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-lg border border-[#eceff3] px-2.5 py-1 text-sm lg:hidden" onClick={() => setOpen(true)}>
              Menü
            </button>
            <h1 className="text-[16px] font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden items-center gap-2 rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-medium text-[#c2410c] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
              Yönetici
            </p>
            <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#1e293b] text-[11px] font-semibold text-white sm:flex">{initials}</span>
          </div>
        </header>
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}

function MenuIcon({ name }: { name: IconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-[#667085]" aria-hidden="true">
      {name === "home" ? <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /> : null}
      {name === "people" ? <path {...common} d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0" /> : null}
      {name === "chat" ? <path {...common} d="M5 17.5 4 21l3.8-1.4A8.5 8.5 0 1 0 5 17.5z" /> : null}
      {name === "megaphone" ? <path {...common} d="M5 10v4h3l7 4V6L8 10H5zM18 10a3 3 0 0 1 0 4" /> : null}
      {name === "log" ? <path {...common} d="M7 4h8l4 4v12H7zM15 4v4h4M10 12h6M10 16h6" /> : null}
      {name === "panel" ? <path {...common} d="M4 5h16v14H4zM4 9h16M9 9v10" /> : null}
    </svg>
  );
}
