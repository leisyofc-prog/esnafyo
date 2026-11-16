import { announcements } from "@/content/announcements";
import type { NewsCard } from "@/components/announcements-board";
import { listAnnouncements } from "@/lib/admin";
import { formatMoney, listAppointments, listCredits, listMasraflar, localKey, startOfDay } from "@/lib/panel";

function showDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export async function loadNews(userId: string) {
  const [appointments, credits, expenses] = await Promise.all([
    listAppointments(userId, startOfDay(0), startOfDay(14)),
    listCredits(userId),
    listMasraflar(userId),
  ]);

  const notices: NewsCard[] = [
    ...appointments
      .filter((item) => item.status === "bekliyor")
      .map((item) => ({
        id: `randevu-${item.id}`,
        title: `${item.customer_name} randevusu onay bekliyor`,
        body: item.service,
        date: showDate(localKey(item.starts_at)),
        kind: "bilgilendirme" as const,
        href: "/panel/randevular",
        linkLabel: "Randevuya git",
      })),
    ...expenses
      .filter((item) => item.status === "bekliyor")
      .map((item) => ({
        id: `masraf-${item.id}`,
        title: `${item.category} henüz ödenmedi`,
        body: item.description || formatMoney(item.amountKurus),
        date: showDate(item.date),
        kind: "guncelleme" as const,
        href: "/panel/masraflar",
        linkLabel: "Masrafa git",
      })),
    ...credits
      .filter((item) => item.remainingKurus > 0 && item.remainingInstallments > 0)
      .map((item) => ({
        id: `kredi-${item.id}`,
        title: `${item.name} için ödeme bekleniyor`,
        body: `Sıradaki tarih ${showDate(item.nextDue)}.`,
        date: showDate(item.nextDue),
        kind: "bilgilendirme" as const,
        href: "/panel/krediler",
        linkLabel: "Krediye git",
      })),
  ];

  const published = await listAnnouncements();
  const source = published.length > 0 ? published : announcements.map((item) => ({ ...item, href: item.href ?? "", linkLabel: item.linkLabel ?? "" }));

  return {
    announcements: source.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      date: showDate(item.date),
      kind: (item.kind === "guncelleme" || item.kind === "kampanya" ? item.kind : "bilgilendirme") as "guncelleme" | "bilgilendirme" | "kampanya",
      href: item.href || undefined,
      linkLabel: item.linkLabel || undefined,
    })),
    notices,
  };
}
