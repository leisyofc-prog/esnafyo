import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ShopVitrin } from "@/components/shop-vitrin";
import { site } from "@/content/site";
import { getPublicShop, shopPublicUrl, shopSeoDescription, shopSeoTitle } from "@/lib/shop-site";

export const instant = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) return { title: "Site bulunamadı", robots: { index: false, follow: false } };
  const title = shopSeoTitle(shop);
  const description = shopSeoDescription(shop);
  const url = shopPublicUrl(shop.slug);
  const image = shop.hasCover ? `/api/d/${shop.slug}/kapak` : shop.hasLogo ? `/api/d/${shop.slug}/logo` : `/d/${shop.slug}/opengraph-image`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: shop.businessName,
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicShopPage({ params }: Params) {
  await connection();
  const { slug } = await params;
  const shop = await getPublicShop(slug);
  if (!shop) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.businessName,
    description: shopSeoDescription(shop),
    url: shopPublicUrl(shop.slug),
    telephone: shop.phone || undefined,
    address: shop.address ? { "@type": "PostalAddress", streetAddress: shop.address, addressCountry: "TR" } : undefined,
    openingHours: shop.openTime && shop.closeTime ? `${shop.openTime}-${shop.closeTime}` : undefined,
  };

  return (
    <>
      <ShopVitrin shop={shop} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <span className="sr-only">{site.name}</span>
    </>
  );
}
