import { site } from "@/content/site";

export type Feature = "gelir" | "hesaplar" | "masraf" | "tedarikci" | "kredi" | "rapor" | "banka";

const rank: Record<string, number> = {
  "Başlangıç": 0,
  "Esnaf Paketi": 1,
  "Tam Dijital": 2,
};

const need: Record<Feature, number> = {
  gelir: 1,
  hesaplar: 1,
  masraf: 1,
  tedarikci: 2,
  kredi: 2,
  rapor: 2,
  banka: 2,
};

export const featureLabel: Record<Feature, string> = {
  gelir: "Gelir ve gider",
  hesaplar: "Hesaplarım",
  masraf: "Masraflar",
  tedarikci: "Tedarikçiler",
  kredi: "Krediler",
  rapor: "Raporlar",
  banka: "Banka entegrasyonu",
};

export function hasFeature(packageName: string, feature: Feature) {
  if (!site.packagesEnabled) return true;
  return (rank[packageName] ?? 0) >= need[feature];
}
