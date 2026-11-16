import type { SVGProps } from "react";
import type { IconName } from "@/content/site";

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  switch (name) {
    case "clock":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.2L15 15" />
        </Svg>
      );
    case "wrench":
      return (
        <Svg className={className}>
          <path d="M14.5 6.2a3.2 3.2 0 0 0-4.3 4.2L4.8 15.8a1.6 1.6 0 0 0 2.3 2.3l5.4-5.4a3.2 3.2 0 0 0 4.2-4.3L14.6 10.5 13.4 9.3l2.1-2.1z" />
        </Svg>
      );
    case "tag":
      return (
        <Svg className={className}>
          <path d="M12.2 4.5h5.3v5.3L10.2 17.1a1.8 1.8 0 0 1-2.5 0l-2.8-2.8a1.8 1.8 0 0 1 0-2.5l7.3-7.3z" />
          <circle cx="15.2" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
        </Svg>
      );
    case "chat":
      return (
        <Svg className={className}>
          <path d="M6 16.5 4.8 19l3.2-1.2A8 8 0 1 0 6 16.5z" />
        </Svg>
      );
    case "site":
      return (
        <Svg className={className}>
          <rect x="6" y="3.5" width="12" height="17" rx="2" />
          <path d="M10 18.5h4" />
        </Svg>
      );
    case "calendar":
      return (
        <Svg className={className}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.8v3.2M16 3.8v3.2M4 10h16" />
        </Svg>
      );
    case "pin":
      return (
        <Svg className={className}>
          <path d="M12 20.5s6-5.2 6-9.2a6 6 0 1 0-12 0c0 4 6 9.2 6 9.2z" />
          <circle cx="12" cy="11" r="1.8" />
        </Svg>
      );
    case "more":
      return (
        <Svg className={className}>
          <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </Svg>
      );
  }
}

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 3.2A8.7 8.7 0 0 0 4.6 16.3L3.4 20.8l4.6-1.2a8.7 8.7 0 0 0 4.04 1 8.76 8.76 0 0 0 0-17.52zm0 15.9a7.1 7.1 0 0 1-3.62-.98l-.26-.16-2.73.72.73-2.66-.17-.27a7.14 7.14 0 1 1 6.05 3.35zm3.9-5.34c-.21-.1-1.26-.62-1.46-.69-.2-.07-.34-.1-.48.1-.14.21-.55.7-.67.84-.12.14-.25.16-.46.06-.21-.1-.9-.33-1.71-1.06-.63-.56-1.06-1.26-1.18-1.47-.12-.21-.01-.33.09-.43.1-.1.21-.25.32-.37.1-.12.14-.21.21-.35.07-.14.03-.27-.02-.37-.05-.1-.48-1.16-.66-1.59-.17-.42-.35-.36-.48-.37h-.41c-.14 0-.37.05-.56.27-.2.21-.74.72-.74 1.76s.76 2.04.86 2.18c.1.14 1.49 2.28 3.62 3.2.5.22.9.35 1.2.45.51.16.97.14 1.34.08.41-.06 1.26-.52 1.44-1.02.18-.5.18-.93.12-1.02-.05-.1-.19-.14-.4-.25z"
      />
    </svg>
  );
}

export function InstagramGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
