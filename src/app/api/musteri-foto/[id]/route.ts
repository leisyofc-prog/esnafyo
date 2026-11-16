import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

const types: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await params;
  const rows = await query<{ image_path: string }>("select image_path from customers where id = $1 and user_id = $2", [id, user.id]);
  const filename = rows[0]?.image_path ?? "";
  if (!/^[0-9a-f-]+\.(jpg|png|webp)$/i.test(filename)) return new Response(null, { status: 404 });
  const file = path.join(process.cwd(), ".data", "customer-photos", user.id, filename);
  const bytes = await readFile(file).catch(() => null);
  if (!bytes) return new Response(null, { status: 404 });
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return new Response(bytes, { headers: { "Content-Type": types[ext] ?? "application/octet-stream", "Cache-Control": "private, no-store" } });
}
