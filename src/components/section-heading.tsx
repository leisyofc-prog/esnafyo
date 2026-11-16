export function SectionHeading({
  id,
  eyebrow,
  title,
  text,
  align = "left",
}: {
  id: string;
  eyebrow: string;
  title: string;
  text?: string;
  align?: "left" | "split";
}) {
  return (
    <div className={align === "split" ? "grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end" : "max-w-2xl"}>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-navy/70 uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-3 text-3xl leading-[1.15] font-semibold tracking-tight text-navy md:text-[2.65rem]">
          {title}
        </h2>
      </div>
      {text ? <p className="max-w-md text-base leading-relaxed text-ink-soft lg:pb-1">{text}</p> : null}
    </div>
  );
}
