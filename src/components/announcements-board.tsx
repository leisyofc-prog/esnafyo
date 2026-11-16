"use client";

import { useState } from "react";
import Link from "next/link";

export type NewsCard = {
  id: string;
  title: string;
  body: string;
  date: string;
  kind: "guncelleme" | "bilgilendirme" | "kampanya";
  href?: string;
  linkLabel?: string;
};

const kindLabel = {
  guncelleme: "Güncelleme",
  bilgilendirme: "Bilgilendirme",
  kampanya: "Kampanya",
} as const;

const kindClass = {
  guncelleme: "bg-[#f4f6f8] text-[#475467]",
  bilgilendirme: "bg-[#eff6ff] text-[#1d4ed8]",
  kampanya: "bg-[#fff7ed] text-[#c2410c]",
} as const;

export function AnnouncementsBoard({
  tab,
  announcements,
  notices,
}: {
  tab: "duyurular" | "bildirimler";
  announcements: NewsCard[];
  notices: NewsCard[];
}) {
  const items = tab === "duyurular" ? announcements : notices;
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b border-[#eceff3] text-[14px]">
        <Tab href="/panel/duyurular" active={tab === "duyurular"} count={announcements.length}>
          Duyurular
        </Tab>
        <Tab href="/panel/bildirimler" active={tab === "bildirimler"} count={notices.length}>
          Bildirimler
        </Tab>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-[#eceff3] bg-white px-5 py-10 text-center text-[13px] text-[#98a2b3]">
          {tab === "duyurular" ? "Henüz duyuru yok." : "Bildirim yok."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} className="rounded-xl border border-[#eceff3] bg-white px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff7ed] text-[13px] font-semibold text-[#c2410c]">
                    {item.title.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold text-[#1c2430]">{item.title}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-[12px] font-medium ${kindClass[item.kind]}`}>{kindLabel[item.kind]}</span>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={open ? "Kapat" : "Aç"}
                          onClick={() => setOpenId(open ? null : item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[#98a2b3] hover:bg-[#f8fafc]"
                        >
                          {open ? "▴" : "▾"}
                        </button>
                      </div>
                    </div>
                    {open ? (
                      <div className="mt-2">
                        {item.body ? <p className="whitespace-pre-line text-[13px] leading-6 text-[#475467]">{item.body}</p> : null}
                        {item.href && item.linkLabel ? (
                          <Link href={item.href} className="mt-2 inline-flex text-[13px] font-semibold text-[#c2410c]">
                            {item.linkLabel} →
                          </Link>
                        ) : null}
                        <p className="mt-3 text-right text-[12px] text-[#98a2b3]">{item.date}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Tab({ href, active, count, children }: { href: string; active: boolean; count: number; children: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2 border-b-2 pb-3 ${active ? "border-[#1e293b] font-semibold text-[#1e293b]" : "border-transparent text-[#98a2b3]"}`}>
      {children}
      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${active ? "bg-[#fff1e6] text-[#c2410c]" : "bg-[#f4f6f8] text-[#98a2b3]"}`}>{count}</span>
    </Link>
  );
}
