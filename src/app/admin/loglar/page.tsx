import { connection } from "next/server";
import { listActivityLogs } from "@/lib/activity";
import { AdminLogBook } from "@/components/admin-log-book";

export const instant = false;

export default async function AdminLogsPage() {
  await connection();
  const logs = await listActivityLogs();
  return <AdminLogBook logs={logs} />;
}
