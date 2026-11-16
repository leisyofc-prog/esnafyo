import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/panel";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const settings = await getSettings(user.id);
  const filename = settings?.logo_path ?? "";
  if (!/^logo\.(jpg|png|webp)$/i.test(filename)) return new Response(null, { status: 404 });
  const bytes = await readFile(path.join(process.cwd(), ".data", "shop-logos", user.id, filename)).catch(() => null);
  if (!bytes) return new Response(null, { status: 404 });
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return new Response(bytes, { headers: { "Content-Type": types[ext] ?? "application/octet-stream", "Cache-Control": "private, no-store" } });
}
