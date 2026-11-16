import { site } from "@/content/site";

export function TrustBar() {
  return (
    <section aria-label="Neden Esnafyo" className="px-5 pt-14 pb-8">
      <ul className="mx-auto grid max-w-4xl grid-cols-2 gap-y-10 md:grid-cols-4">
        {site.trust.map((item) => (
          <li key={item.figure} className="text-center">
            <p className="text-4xl font-semibold tracking-tight text-navy md:text-5xl">{item.figure}</p>
            <p className="mt-2 text-sm text-slate-400">{item.title}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
