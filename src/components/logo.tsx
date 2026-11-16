import Image from "next/image";

export function Logo({
  className = "h-8",
  priority = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.webp"
      alt="Esnafyo"
      width={930}
      height={163}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}
