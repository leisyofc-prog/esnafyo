import { createSession, verifyPassword } from "@/lib/auth";
import { ensureSchema, query } from "@/lib/db";
import { writeActivity } from "@/lib/activity";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return Response.json({ error: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  await ensureSchema();
  const rows = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email = $1",
    [email],
  );
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    await writeActivity({ userId: user?.id ?? null, area: "giris", action: "Giriş başarısız", detail: email });
    return Response.json({ error: "E-posta veya şifre yanlış." }, { status: 401 });
  }

  await createSession(user.id);
  await writeActivity({ userId: user.id, area: "giris", action: "Giriş yaptı", detail: email });
  return Response.json({ ok: true });
}
