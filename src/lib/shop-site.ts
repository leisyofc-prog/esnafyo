import { site } from "@/content/site";
import { ensureSchema, query } from "@/lib/db";
import { formatMoney, type Product } from "@/lib/panel";

export const DEFAULT_THEME_COLOR = "#f97316";

const reservedSlugs = new Set([
  "admin",
  "api",
  "d",
  "giris",
  "login",
  "panel",
  "robots",
  "sitemap",
  "uye-ol",
]);

export type PublicShopProduct = {
  id: string;
  name: string;
  priceLabel: string;
};

export type PublicShop = {
  userId: string;
  slug: string;
  enabled: boolean;
  businessName: string;
  ownerName: string;
  headline: string;
  about: string;
  priceNote: string;
  campaign: string;
  openTime: string;
  closeTime: string;
  closedDays: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  themeColor: string;
  seoTitle: string;
  seoDescription: string;
  hasLogo: boolean;
  hasCover: boolean;
  products: PublicShopProduct[];
};

export function shopPublicPath(slug: string) {
  return `/d/${slug}`;
}

export function shopPublicUrl(slug: string) {
  return `${site.url.replace(/\/$/, "")}${shopPublicPath(slug)}`;
}

export function isReservedSlug(value: string) {
  return reservedSlugs.has(value);
}

export function normalizeThemeColor(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : DEFAULT_THEME_COLOR;
}

export function digitsOf(value: string) {
  return value.replace(/\D+/g, "");
}

export function whatsappLink(value: string) {
  let digits = digitsOf(value);
  if (digits.length === 11 && digits.startsWith("0")) digits = `90${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("5")) digits = `90${digits}`;
  if (digits.length < 10) return "";
  return `https://wa.me/${digits}`;
}

export function mapsLink(address: string) {
  const trimmed = address.trim();
  if (!trimmed) return "";
  return `https://maps.google.com/?q=${encodeURIComponent(trimmed)}`;
}

export function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("instagram.com") || trimmed.startsWith("www.instagram.com")) return `https://${trimmed.replace(/^www\./, "")}`;
  if (trimmed.startsWith("facebook.com") || trimmed.startsWith("www.facebook.com") || trimmed.startsWith("fb.com")) return `https://${trimmed}`;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  return "";
}

export function productPriceLabel(product: Pick<Product, "price_label" | "price_kurus">) {
  const label = product.price_label.trim();
  if (label) return label;
  if (product.price_kurus > 0) return formatMoney(product.price_kurus);
  return "";
}

export function shopSeoTitle(shop: Pick<PublicShop, "seoTitle" | "headline" | "businessName">) {
  return shop.seoTitle.trim() || shop.headline.trim() || shop.businessName;
}

export function shopSeoDescription(shop: Pick<PublicShop, "seoDescription" | "about" | "businessName">) {
  return shop.seoDescription.trim() || shop.about.trim() || `${shop.businessName} dükkân sitesi.`;
}

function asBoolean(value: unknown, fallback = false) {
  if (value === true || value === "t" || value === "true") return true;
  if (value === false || value === "f" || value === "false") return false;
  return fallback;
}

export async function getPublicShop(slug: string, options?: { includeDisabled?: boolean }): Promise<PublicShop | null> {
  await ensureSchema();
  const clean = slug.trim().toLowerCase();
  if (!clean || isReservedSlug(clean)) return null;
  const rows = await query<{
    user_id: string;
    public_slug: string;
    site_enabled: boolean;
    business_name: string;
    owner_name: string;
    phone: string;
    headline: string;
    about: string;
    price_note: string;
    campaign: string;
    open_time: string;
    close_time: string;
    closed_days: string;
    address: string;
    public_phone: string;
    whatsapp_number: string;
    instagram_url: string;
    facebook_url: string;
    theme_color: string;
    seo_title: string;
    seo_description: string;
    logo_path: string;
    cover_path: string;
  }>(
    `select shop_settings.user_id, shop_settings.public_slug, shop_settings.site_enabled,
            users.business_name, users.name as owner_name, users.phone,
            shop_settings.headline, shop_settings.about, shop_settings.price_note, shop_settings.campaign,
            shop_settings.open_time, shop_settings.close_time, shop_settings.closed_days, shop_settings.address,
            shop_settings.public_phone, shop_settings.whatsapp_number, shop_settings.instagram_url, shop_settings.facebook_url,
            shop_settings.theme_color, shop_settings.seo_title, shop_settings.seo_description,
            shop_settings.logo_path, shop_settings.cover_path
     from shop_settings
     join users on users.id = shop_settings.user_id
     where shop_settings.public_slug = $1`,
    [clean],
  );
  const row = rows[0];
  if (!row) return null;
  const enabled = asBoolean(row.site_enabled, true);
  if (!enabled && !options?.includeDisabled) return null;

  const products = await query<{ id: string; name: string; price_label: string; price_kurus: number | string }>(
    `select id, name, price_label, price_kurus
     from products
     where user_id = $1 and show_on_site = true
     order by name`,
    [row.user_id],
  );

  const phone = (row.public_phone || row.phone || "").trim();
  return {
    userId: row.user_id,
    slug: row.public_slug,
    enabled,
    businessName: row.business_name,
    ownerName: row.owner_name,
    headline: row.headline || "",
    about: row.about || "",
    priceNote: row.price_note || "",
    campaign: row.campaign || "",
    openTime: row.open_time || "09:00",
    closeTime: row.close_time || "19:00",
    closedDays: row.closed_days || "",
    address: row.address || "",
    phone,
    whatsapp: (row.whatsapp_number || phone).trim(),
    instagramUrl: row.instagram_url || "",
    facebookUrl: row.facebook_url || "",
    themeColor: normalizeThemeColor(row.theme_color),
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    hasLogo: Boolean(row.logo_path),
    hasCover: Boolean(row.cover_path),
    products: products.map((item) => ({
      id: item.id,
      name: item.name,
      priceLabel: productPriceLabel({ price_label: item.price_label, price_kurus: Number(item.price_kurus ?? 0) }),
    })),
  };
}

export function publicShopFromSettings(input: {
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  settings: {
    public_slug: string;
    site_enabled: boolean;
    headline: string;
    about: string;
    price_note: string;
    campaign: string;
    open_time: string;
    close_time: string;
    closed_days: string;
    address: string;
    public_phone: string;
    whatsapp_number: string;
    instagram_url: string;
    facebook_url: string;
    theme_color: string;
    seo_title: string;
    seo_description: string;
    logo_path: string;
    cover_path: string;
  };
  products: Product[];
}): PublicShop {
  const settings = input.settings;
  const phone = (settings.public_phone || input.phone || "").trim();
  return {
    userId: input.userId,
    slug: settings.public_slug,
    enabled: settings.site_enabled !== false,
    businessName: input.businessName,
    ownerName: input.ownerName,
    headline: settings.headline || "",
    about: settings.about || "",
    priceNote: settings.price_note || "",
    campaign: settings.campaign || "",
    openTime: settings.open_time || "09:00",
    closeTime: settings.close_time || "19:00",
    closedDays: settings.closed_days || "",
    address: settings.address || "",
    phone,
    whatsapp: (settings.whatsapp_number || phone).trim(),
    instagramUrl: settings.instagram_url || "",
    facebookUrl: settings.facebook_url || "",
    themeColor: normalizeThemeColor(settings.theme_color),
    seoTitle: settings.seo_title || "",
    seoDescription: settings.seo_description || "",
    hasLogo: Boolean(settings.logo_path),
    hasCover: Boolean(settings.cover_path),
    products: input.products
      .filter((item) => item.show_on_site)
      .map((item) => ({ id: item.id, name: item.name, priceLabel: productPriceLabel(item) })),
  };
}
