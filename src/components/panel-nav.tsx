"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/panel", label: "Özet" },
  { href: "/panel/randevular", label: "Randevu" },
  { href: "/panel/diger", label: "Diğer" },
];

export function PanelNav() {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white" aria-label="Panel">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {items.map((item) => {
          const active = item.href === "/panel" ? path === "/panel" : path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block py-3 text-center text-xs font-semibold ${active ? "text-brand-strong" : "text-slate-500"}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
