"use client";

import { useState } from "react";

export function ShopLinkActions({ href }: { href: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">
        Siteyi görüntüle
      </a>
      <button type="button" onClick={copy} className="inline-flex h-10 items-center rounded-lg border border-[#e4e7ec] bg-white px-4 text-[13px] font-semibold">
        {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      </button>
    </div>
  );
}
