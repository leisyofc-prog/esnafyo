import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getStoredFile, shopLogoFileId } from "@/lib/stored-files";

export const instant = false;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const [settings] = await query<{ logo_path: string }>("select logo_path from shop_settings where user_id = $1", [user.id]);
  const filename = settings?.logo_path || "";
  if (!/^logo\.(jpg|png|webp)$/i.test(filename)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  const file = await getStoredFile(shopLogoFileId(user.id), user.id);
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Cache-Control": "private, no-store",
    },
  });
}
