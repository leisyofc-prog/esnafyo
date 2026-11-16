"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeActivity } from "@/lib/activity";

const kinds = new Set(["guncelleme", "bilgilendirme", "kampanya"]);

async function adminId() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?yon=/admin");
  if (user.role !== "admin") redirect("/panel");
  return user.id;
}

export async function addAnnouncement(formData: FormData) {
  await adminId();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const href = String(formData.get("href") ?? "").trim();
  const linkLabel = String(formData.get("link") ?? "").trim();
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !kinds.has(kind)) return;
  await query(
    `insert into announcements (id, title, body, happened_on, kind, href, link_label)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [randomUUID(), title, body, date, kind, href, linkLabel],
  );
  const admin = await getCurrentUser();
  if (admin) await writeActivity({ userId: admin.id, area: "duyuru", action: "Duyuru yayınladı", detail: title });
  revalidatePath("/admin/duyurular");
  revalidatePath("/panel/duyurular");
  revalidatePath("/panel/bildirimler");
}

export async function deleteAnnouncement(formData: FormData) {
  await adminId();
  const id = String(formData.get("id") ?? "");
  await query("delete from announcements where id = $1", [id]);
  const admin = await getCurrentUser();
  if (admin) await writeActivity({ userId: admin.id, area: "duyuru", action: "Duyuruyu kaldırdı", detail: id });
  revalidatePath("/admin/duyurular");
  revalidatePath("/panel/duyurular");
  revalidatePath("/panel/bildirimler");
}
