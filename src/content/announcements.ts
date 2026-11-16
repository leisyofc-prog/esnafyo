export type AnnouncementKind = "guncelleme" | "bilgilendirme" | "kampanya";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  /** YYYY-AA-GG */
  date: string;
  kind: AnnouncementKind;
  href?: string;
  linkLabel?: string;
};

/** Duyuru metinlerini buraya ekle. Liste boşken sayfada “Henüz duyuru yok” görünür. */
export const announcements: Announcement[] = [];
