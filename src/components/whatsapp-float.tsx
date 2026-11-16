import { WhatsAppGlyph } from "@/components/icons";

export function WhatsAppFloat({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed right-4 bottom-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-[0_12px_30px_-12px_rgba(15,39,68,0.8)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <WhatsAppGlyph className="h-7 w-7" />
    </a>
  );
}
