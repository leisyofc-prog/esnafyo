import { NextResponse } from "next/server";
import { getStoredFile, shopCoverFileId, shopLogoFileId } from "@/lib/stored-files";
import { getPublicShop } from "@/lib/shop-site";

export async function servePublicShopFile(slug: string, kind: "logo" | "cover") {
  const shop = await getPublicShop(slug);
  if (!shop) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  if (kind === "logo" && !shop.hasLogo) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  if (kind === "cover" && !shop.hasCover) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  const id = kind === "logo" ? shopLogoFileId(shop.userId) : shopCoverFileId(shop.userId);
  const file = await getStoredFile(id, shop.userId);
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=60, must-revalidate",
    },
  });
}
