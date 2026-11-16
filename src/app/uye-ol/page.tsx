import type { Metadata } from "next";
import { site } from "@/content/site";
import { SignupFlow } from "@/components/signup-flow";

export const metadata: Metadata = {
  title: "Üye Ol | Esnafyo",
  description: site.packagesEnabled ? "Esnafyo paneline kayıt ol. Paketini seç, hesabını aç." : "Esnafyo paneline ücretsiz kayıt ol.",
};

export default function SignupPage() {
  return (
    <SignupFlow
      packages={site.pricing.items.map((item) => ({
        name: item.name,
        text: item.text,
        price: item.price,
        period: item.period,
      }))}
    />
  );
}
