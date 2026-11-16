import { site } from "@/content/site";
import { whatsappHref } from "@/lib/whatsapp";

export const instant = false;

export default function SupportPage() {
  const href = whatsappHref(site.whatsappNumber, site.whatsappMessages.support);

  return (
    <section className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center">
      <SupportMark />
      <h2 className="mt-6 text-[16px] font-semibold text-[#1c2430]">Nasıl yardımcı olabiliriz?</h2>
      <p className="mt-2 max-w-sm text-[13px] leading-6 text-[#98a2b3]">
        Henüz destek talebin yok. Bir sorun olursa buradan yazarsın. Esnafyo ekibi kısa sürede döner.
      </p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex items-center gap-2 text-[13px] font-medium text-[#475467] hover:text-[#1c2430]">
        <HeadsetIcon />
        WhatsApp’tan yaz
      </a>
    </section>
  );
}

function SupportMark() {
  return (
    <svg width="148" height="120" viewBox="0 0 148 120" fill="none" aria-hidden="true">
      <circle cx="78" cy="58" r="46" fill="#fff7ed" />
      <path d="M18 28c18-16 46-10 52 12 2 8-2 16-10 20l-8 14-6-16c-16 0-30-12-28-30z" fill="#ffedd5" />
      <path d="M70 22c22-8 48 8 48 32 0 10-6 18-16 22l4 16-18-10c-20 2-38-10-38-30 0-14 8-26 20-30z" fill="#f97316" />
      <path d="M86 46h22M86 56h16" stroke="#fff7ed" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 44h16M28 52h10" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 18l2 5 5 1-5 2-2 5-2-5-5-2 5-1 2-5z" fill="#fdba74" />
      <path d="M124 24l1.5 3.5 3.5 1-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1 1.5-3.5z" fill="#f97316" />
      <path d="M118 78l1 2.5 2.5.8-2.5 1-1 2.5-1-2.5-2.5-1 2.5-.8 1-2.5z" fill="#fdba74" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5V8a5 5 0 0 1 10 0v.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.8" y="8.2" width="2.6" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11.6" y="8.2" width="2.6" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.8 12.2v.4a1.6 1.6 0 0 1-1.6 1.6H8.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
