import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/content/site";

export const alt = "Esnafyo — Dükkânın internette de açık.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const font = await readFile(join(process.cwd(), "assets/Nunito-ExtraBold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFF8F1",
          padding: "72px",
          fontFamily: "Nunito",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              border: "6px solid #1E293B",
              background: "#FFF8F1",
              display: "flex",
              alignItems: "flex-end",
              overflow: "hidden",
            }}
          >
            <div style={{ width: "100%", height: 34, background: "#F97316", display: "flex" }} />
          </div>
          <div style={{ marginLeft: 22, fontSize: 52, fontWeight: 800, color: "#1E293B" }}>
            {site.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              fontWeight: 800,
              color: "#1E293B",
              maxWidth: 980,
            }}
          >
            {site.slogan}
          </div>
          <div style={{ marginTop: 24, fontSize: 32, fontWeight: 800, color: "#C2410C" }}>
            Site, randevu, satış ve muhasebe. Şu an ücretsiz.
          </div>
        </div>
        <div style={{ display: "flex", width: 280, height: 18 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: 22,
                height: 18,
                background: index % 2 === 0 ? "#F97316" : "#FFF8F1",
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Nunito", data: font, weight: 800, style: "normal" }],
    },
  );
}
