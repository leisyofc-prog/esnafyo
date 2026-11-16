import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { customerPhotoFileId, getStoredFile } from "@/lib/stored-files";

export const instant = false;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  const { id } = await params;
  const [customer] = await query<{ image_path: string }>("select image_path from customers where id = $1 and user_id = $2", [id, user.id]);
  if (!customer) return NextResponse.json({ error: "Müşteri bulunamadı." }, { status: 404 });
  const filename = customer.image_path || "";
  if (!new RegExp(`^${id}\.(jpg|png|webp)$`, "i").test(filename)) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  const file = await getStoredFile(customerPhotoFileId(user.id, id), user.id);
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Cache-Control": "private, no-store",
    },
  });
}
