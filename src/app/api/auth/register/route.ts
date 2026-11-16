import { randomUUID } from "node:crypto";
import { createSession, hashPassword } from "@/lib/auth";
import { ensureSchema, query } from "@/lib/db";
import { writeActivity } from "@/lib/activity";
import { site } from "@/content/site";

const packages = new Set<string>(site.pricing.items.map((item) => item.name));

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = text(body.name, 120);
  const email = text(body.email, 160)?.toLowerCase() ?? null;
  const password = typeof body.password === "string" ? body.password : "";
  const business = text(body.business, 160);
  const phone = text(body.phone, 40);
  const requested = text(body.packageName, 80);
  const packageName = site.packagesEnabled ? requested : "Tam Dijital";

  if (!name || !email || !email.includes("@") || !business || !phone || !packageName) {
    return Response.json({ error: "Bütün alanları doldur." }, { status: 400 });
  }
  if (site.packagesEnabled && !packages.has(packageName)) {
    return Response.json({ error: "Bir paket seç." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Şifre en az 8 karakter olsun." }, { status: 400 });
  }

  await ensureSchema();
  const existing = await query<{ id: string }>("select id from users where email = $1", [email]);
  if (existing.length > 0) {
    return Response.json({ error: "Bu e-posta ile kayıt var. Giriş yap." }, { status: 409 });
  }

  const id = randomUUID();
  await query(
    `insert into users (id, name, email, password_hash, business_name, phone, package_name)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, email, hashPassword(password), business, phone, packageName],
  );
  await createSession(id);
  await writeActivity({ userId: id, area: "giris", action: "Üye oldu", detail: `${business} · ${email}` });
  return Response.json({ ok: true });
}
