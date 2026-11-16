import { query } from "@/lib/db";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  business: string;
  phone: string;
  packageName: string;
  role: string;
  createdAt: string;
};

export type AdminLead = {
  id: string;
  name: string;
  business: string;
  phone: string;
  sector: string;
  message: string;
  createdAt: string;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  date: string;
  kind: string;
  href: string;
  linkLabel: string;
};

export async function adminCounts() {
  const [users, leads, announcements] = await Promise.all([
    query<{ count: string }>("select count(*)::text as count from users where role <> 'admin'"),
    query<{ count: string }>("select count(*)::text as count from leads"),
    query<{ count: string }>("select count(*)::text as count from announcements"),
  ]);
  return {
    esnaf: Number(users[0]?.count ?? 0),
    leads: Number(leads[0]?.count ?? 0),
    announcements: Number(announcements[0]?.count ?? 0),
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    business_name: string;
    phone: string;
    package_name: string;
    role: string;
    created_at: string | Date;
  }>("select id, name, email, business_name, phone, package_name, role, created_at from users order by created_at desc");
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    business: row.business_name,
    phone: row.phone,
    packageName: row.package_name,
    role: row.role,
    createdAt: typeof row.created_at === "string" ? row.created_at.slice(0, 10) : row.created_at.toISOString().slice(0, 10),
  }));
}

export async function listAdminLeads(): Promise<AdminLead[]> {
  const rows = await query<{
    id: string;
    name: string;
    business_name: string;
    phone: string;
    sector: string;
    message: string;
    created_at: string | Date;
  }>("select id, name, business_name, phone, sector, message, created_at from leads order by created_at desc limit 100");
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    business: row.business_name,
    phone: row.phone,
    sector: row.sector,
    message: row.message,
    createdAt: typeof row.created_at === "string" ? row.created_at.slice(0, 10) : row.created_at.toISOString().slice(0, 10),
  }));
}

export async function listAnnouncements(): Promise<AdminAnnouncement[]> {
  const rows = await query<{
    id: string;
    title: string;
    body: string;
    happened_on: string | Date;
    kind: string;
    href: string;
    link_label: string;
  }>("select id, title, body, happened_on, kind, href, link_label from announcements order by happened_on desc, created_at desc");
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    date: typeof row.happened_on === "string" ? row.happened_on.slice(0, 10) : row.happened_on.toISOString().slice(0, 10),
    kind: row.kind,
    href: row.href,
    linkLabel: row.link_label,
  }));
}
