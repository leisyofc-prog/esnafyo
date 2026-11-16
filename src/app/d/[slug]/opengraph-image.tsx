import { ImageResponse } from "next/og";
import { getPublicShop, shopSeoTitle } from "@/lib/shop-site";

export const alt = "Dükkân sitesi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getPublicShop(slug, { includeDisabled: true });
  const title = shop ? shopSeoTitle(shop) : "Dükkân sitesi";
  const name = shop?.businessName ?? "Esnafyo";
  const color = shop?.themeColor ?? "#f97316";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fffaf6",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontSize: 28, color: "#64748b" }}>{name}</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: "#0f2744", lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 24, color: "#64748b" }}>Esnafyo</div>
      </div>
    ),
    { ...size },
  );
}
