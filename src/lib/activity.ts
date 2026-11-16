import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

export async function writeActivity(input: { userId?: string | null; area: string; action: string; detail: string }) {
  try {
    await query(
      "insert into activity_logs (id, user_id, area, action, detail) values ($1,$2,$3,$4,$5)",
      [randomUUID(), input.userId ?? null, input.area, input.action, input.detail.slice(0, 500)],
    );
  } catch {
    // Günlük yazılamazsa asıl işlem durmasın.
  }
}

export type ActivityLog = {
  id: string;
  area: string;
  action: string;
  detail: string;
  createdAt: string;
  name: string;
  business: string;
  email: string;
};

export async function listActivityLogs(): Promise<ActivityLog[]> {
  const rows = await query<{
    id: string;
    area: string;
    action: string;
    detail: string;
    created_at: string | Date;
    name: string | null;
    business_name: string | null;
    email: string | null;
  }>(
    `select activity_logs.id, activity_logs.area, activity_logs.action, activity_logs.detail, activity_logs.created_at,
            users.name, users.business_name, users.email
     from activity_logs
     left join users on users.id = activity_logs.user_id
     order by activity_logs.created_at desc
     limit 300`,
  );
  return rows.map((row) => ({
    id: row.id,
    area: row.area,
    action: row.action,
    detail: row.detail,
    createdAt: typeof row.created_at === "string" ? row.created_at : row.created_at.toISOString(),
    name: row.name ?? "",
    business: row.business_name ?? "",
    email: row.email ?? "",
  }));
}
