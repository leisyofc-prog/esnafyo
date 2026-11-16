import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { AnnouncementsBoard } from "@/components/announcements-board";
import { loadNews } from "@/app/panel/duyurular/news";

export const instant = false;

export default async function AnnouncementsPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const news = await loadNews(user.id);
  return <AnnouncementsBoard tab="duyurular" announcements={news.announcements} notices={news.notices} />;
}
