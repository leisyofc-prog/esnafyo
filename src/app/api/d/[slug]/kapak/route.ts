import { servePublicShopFile } from "@/lib/shop-public-file";

export const instant = false;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return servePublicShopFile(slug, "cover");
}
