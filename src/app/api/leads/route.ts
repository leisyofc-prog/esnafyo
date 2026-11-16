import { randomUUID } from "node:crypto";
import { ensureSchema, query } from "@/lib/db";
import { writeActivity } from "@/lib/activity";

type LeadInput = {
  name?: unknown;
  business?: unknown;
  sector?: unknown;
  phone?: unknown;
  message?: unknown;
};

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export async function POST(request: Request) {
  let body: LeadInput;

  try {
    body = (await request.json()) as LeadInput;
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const name = text(body.name, 120);
  const business = text(body.business, 160);
  const sector = text(body.sector, 80);
  const phone = text(body.phone, 40);
  const message = text(body.message, 2000);

  if (!name || !business || !sector || !phone || !message) {
    return Response.json({ error: "Bütün alanları doldur." }, { status: 400 });
  }

  await ensureSchema();
  await query(
    `insert into leads (id, name, business_name, sector, phone, message)
     values ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), name, business, sector, phone, message],
  );
  await writeActivity({ area: "iletisim", action: "İletişim formu", detail: `${business} · ${name} · ${phone}` });

  return Response.json({ ok: true });
}
