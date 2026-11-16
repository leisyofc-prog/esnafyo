"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { site } from "@/content/site";
import { hasFeature, type Feature } from "@/lib/plan-access";

type Item = {
  href: string;
  label: string;
  icon: IconName;
  badge?: string;
  feature?: Feature;
};

const menu: { title: string; items: Item[] }[] = [
  {
    title: "Ana menü",
    items: [
      { href: "/panel", label: "Anasayfa", icon: "home" },
      { href: "/panel/randevular", label: "Randevular", icon: "calendar" },
      { href: "/panel/satislar", label: "Satışlar", icon: "receipt", feature: "gelir" },
      { href: "/panel/musteriler", label: "Müşteriler", icon: "people" },
      { href: "/panel/tedarikciler", label: "Tedarikçiler", icon: "truck", feature: "tedarikci" },
      { href: "/panel/site", label: "Web sitem", icon: "globe" },
      { href: "/panel/raporlar", label: "Raporlar", icon: "chart", feature: "rapor" },
    ],
  },
  {
    title: "Muhasebe",
    items: [
      { href: "/panel/hesaplarim", label: "Hesaplarım", icon: "bank", feature: "hesaplar" },
      { href: "/panel/banka", label: "Banka entegrasyonu", icon: "bank", feature: "banka" },
      { href: "/panel/gelir", label: "Gelir", icon: "wallet", feature: "gelir" },
      { href: "/panel/gider", label: "Gider", icon: "down", feature: "gelir" },
      { href: "/panel/krediler", label: "Krediler", icon: "loan", feature: "kredi" },
      { href: "/panel/masraflar", label: "Masraflar", icon: "bill", feature: "masraf" },
    ],
  },
  {
    title: "Bildirimler",
    items: [
      { href: "/panel/duyurular", label: "Duyurular", icon: "megaphone" },
      { href: "/panel/bildirimler", label: "Bildirimler", icon: "bell" },
    ],
  },
  {
    title: "Destek",
    items: [{ href: "/panel/destek", label: "Destek ve yardım", icon: "life" }],
  },
  {
    title: "Hesabım",
    items: [
      { href: "/panel/hesap", label: "Hesap bilgileri", icon: "card" },
      { href: "/panel/ayarlar", label: "Ayarlar", icon: "gear" },
    ],
  },
];

const titles: Record<string, string> = {
  "/panel": "Anasayfa",
  "/panel/randevular": "Randevular",
  "/panel/satislar": "Satışlar",
  "/panel/musteriler": "Müşteriler",
  "/panel/tedarikciler": "Tedarikçiler",
  "/panel/hesaplarim": "Hesaplarım",
  "/panel/banka": "Banka entegrasyonu",
  "/panel/gelir": "Gelir",
  "/panel/gider": "Gider",
  "/panel/krediler": "Krediler",
  "/panel/masraflar": "Masraflar",
  "/panel/site": "Web sitem",
  "/panel/raporlar": "Raporlar",
  "/panel/hesap": "Hesabım",
  "/panel/ayarlar": "Ayarlar",
  "/panel/duyurular": "Duyurular",
  "/panel/bildirimler": "Bildirimler",
  "/panel/destek": "Destek ve yardım",
};

type IconName = "home" | "calendar" | "people" | "truck" | "bank" | "wallet" | "down" | "loan" | "bill" | "receipt" | "globe" | "chat" | "chart" | "megaphone" | "bell" | "life" | "card" | "gear";

const activeLabel: Record<string, string> = {
  "/panel": "Anasayfa",
  "/panel/randevular": "Randevular",
  "/panel/satislar": "Satışlar",
  "/panel/musteriler": "Müşteriler",
  "/panel/tedarikciler": "Tedarikçiler",
  "/panel/hesaplarim": "Hesaplarım",
  "/panel/banka": "Banka entegrasyonu",
  "/panel/gelir": "Gelir",
  "/panel/gider": "Gider",
  "/panel/krediler": "Krediler",
  "/panel/masraflar": "Masraflar",
  "/panel/site": "Web sitem",
  "/panel/raporlar": "Raporlar",
  "/panel/duyurular": "Duyurular",
  "/panel/bildirimler": "Bildirimler",
  "/panel/destek": "Destek ve yardım",
  "/panel/hesap": "Hesap bilgileri",
  "/panel/ayarlar": "Ayarlar",
};

export function PanelShell({
  name,
  business,
  packageName,
  children,
}: {
  name: string;
  business: string;
  packageName: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(menu.map((group) => [group.title, true])));
  const onCustomers = path === "/panel/musteriler" || path.startsWith("/panel/musteriler/");
  const onSuppliers = path === "/panel/tedarikciler" || path.startsWith("/panel/tedarikciler/");
  const onAccounts = path === "/panel/hesaplarim" || path.startsWith("/panel/hesaplarim/");
  const onSales = path === "/panel/satislar" || path.startsWith("/panel/satislar/");
  const title = onCustomers ? "Müşteriler" : onSuppliers ? "Tedarikçiler" : onAccounts ? "Hesaplarım" : onSales ? "Satışlar" : titles[path] ?? "Panel";
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
          <Link href="/panel" onClick={() => setOpen(false)}>
            <Logo className="h-6" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {menu.map((group) => {
            const expanded = groups[group.title] !== false;
            return (
              <div key={group.title} className="mb-3">
                {group.items.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setGroups((current) => ({ ...current, [group.title]: !expanded }))}
                    className="flex w-full items-center justify-between px-2 py-1.5 text-left"
                  >
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-[#b0b7c3] uppercase">{group.title}</span>
                    <span className="text-base leading-none text-[#98a2b3]">{expanded ? "−" : "+"}</span>
                  </button>
                ) : (
                  <p className="px-2 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#b0b7c3] uppercase">{group.title}</p>
                )}
                {expanded ? (
                  <ul>
                    {group.items.map((item) => {
                      const active = onCustomers ? item.href === "/panel/musteriler" : onSuppliers ? item.href === "/panel/tedarikciler" : onAccounts ? item.href === "/panel/hesaplarim" : onSales ? item.href === "/panel/satislar" : activeLabel[path] === item.label;
                      const locked = item.feature ? !hasFeature(packageName, item.feature) : false;
                      if (locked) {
                        return (
                          <li key={item.label}>
                            <Link href={`/panel/hesap?kilit=${item.feature}`} onClick={() => setOpen(false)} className="flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13.5px] text-[#98a2b3]">
                              <MenuIcon name={item.icon} />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                              <span className="text-[10px] font-semibold">Kilitli</span>
                            </Link>
                          </li>
                        );
                      }
                      return (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13.5px] ${active ? "bg-[#f4f6f8] font-semibold text-[#1c2430]" : "text-[#3f4856] hover:bg-[#f8fafc]"}`}
                          >
                            <MenuIcon name={item.icon} />
                            <span className={`min-w-0 flex-1 truncate ${item.href === "/panel/gelir" ? "text-[#15803d]" : item.href === "/panel/gider" ? "text-[#dc2626]" : ""}`}>{item.label}</span>
                            {item.badge ? (
                              <span className="rounded-md bg-[#fff1e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#c2410c]">{item.badge}</span>
                            ) : null}
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
            <span className="block truncate text-[11px] text-[#98a2b3]">{business}</span>
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
              {site.packagesEnabled ? packageName : "Tamamen ücretsiz"}
            </p>
            <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#1e293b] text-[11px] font-semibold text-white sm:flex">{initials}</span>
            <Link href="/panel/hesap" className="text-sm font-medium">
              Hesabım <span className="text-[#98a2b3]">▾</span>
            </Link>
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
      {name === "calendar" ? <path {...common} d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /> : null}
      {name === "people" ? <path {...common} d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0" /> : null}
      {name === "truck" ? <path {...common} d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /> : null}
      {name === "bank" ? <path {...common} d="M4 10h16M6 10v7M10 10v7M14 10v7M18 10v7M3 17h18M4 10 12 4l8 6" /> : null}
      {name === "wallet" ? <path {...common} d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 13h4M4 7l2-3h10" /> : null}
      {name === "down" ? <path {...common} d="M12 4v12M7 12l5 5 5-5M5 20h14" /> : null}
      {name === "loan" ? <path {...common} d="M5 7h14v12H5zM8 7V5h8v2M8 12h8M8 16h5" /> : null}
      {name === "bill" ? <path {...common} d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6" /> : null}
      {name === "receipt" ? <path {...common} d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21zM10 8h4M10 12h4" /> : null}
      {name === "globe" ? <path {...common} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" /> : null}
      {name === "chat" ? <path {...common} d="M5 17.5 4 21l3.8-1.4A8.5 8.5 0 1 0 5 17.5z" /> : null}
      {name === "chart" ? <path {...common} d="M5 19V9M12 19V5M19 19v-7" /> : null}
      {name === "megaphone" ? <path {...common} d="M5 10v4h3l7 4V6L8 10H5zM18 10a3 3 0 0 1 0 4" /> : null}
      {name === "bell" ? <path {...common} d="M6 16h12l-1.2-2.2V10a4.8 4.8 0 0 0-9.6 0v3.8L6 16zM10 18a2 2 0 0 0 4 0" /> : null}
      {name === "life" ? <path {...common} d="M12 21a8 8 0 0 0 8-8c0-4-3-6-4.5-7.5L12 8l-3.5-2.5C7 7 4 9 4 13a8 8 0 0 0 8 8z" /> : null}
      {name === "card" ? <path {...common} d="M4 7h16v10H4zM4 11h16" /> : null}
      {name === "gear" ? <path {...common} d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM12 3.5v2M12 18.5v2M4.8 6.2l1.5 1.5M17.7 16.3l1.5 1.5M3.5 12h2M18.5 12h2M4.8 17.8l1.5-1.5M17.7 7.7l1.5-1.5" /> : null}
    </svg>
  );
}
