/**
 * Esnafyo sitesindeki bütün metinler burada.
 * Fiyat, WhatsApp numarası, e-posta ve bağlantıları buradan değiştir.
 */

export const site = {
  name: "Esnafyo",
  /** Paketler ve fiyatlar duruyor. false iken sitede ve panelde kilit yok, her şey ücretsiz. */
  packagesEnabled: false,
  slogan: "Dükkânın internette de açık.",
  /** Canlı alan adın hazır olunca bunu değiştir, ya da NEXT_PUBLIC_SITE_URL ortam değişkeni ver. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://esnafyo.com",
  email: "merhaba@esnafyo.com",
  instagramUrl: "https://instagram.com/esnafyo",
  /**
   * Ülke koduyla yaz, başında + olmasın.
   * Örnek: 905321112233
   * Sitedeki bütün WhatsApp butonları bu numarayı kullanır.
   */
  whatsappNumber: "905551112233",
  whatsappMessages: {
    general: "Merhaba Esnafyo, dükkânım için bilgi almak istiyorum.",
    founder:
      "Merhaba, kurucu müşteri indirimi için yerimi ayırtmak istiyorum.",
    support: "Merhaba Esnafyo, panelde bir konuda yardım istiyorum.",
  },
  seo: {
    title: "Esnafyo | Dükkânın paneli",
    description:
      "Randevu, müşteri, satış, gelir, gider, hesap, banka dökümü, kredi asgarisi ve aylık rapor. Şu an tamamen ücretsiz.",
  },
  nav: [
    { href: "#hizmetler", label: "Hizmetler" },
    { href: "#nasil-calisir", label: "Nasıl Çalışır" },
    { href: "#fiyatlar", label: "Fiyatlar" },
    { href: "#sss", label: "SSS" },
  ],
  header: {
    whatsappLabel: "WhatsApp",
    cta: "Konuşalım",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },
  hero: {
    rotating: ["Randevuyu", "Satışı", "Geliri", "Asgariyi", "Masrafı"],
    fixed: "Dert Etmeyin",
    brand: "Esnafyo Var!",
    text: "Randevu, müşteri, satış makbuzu, gelir, gider, hesap ve kredi asgarisi tek panelde. Şu an tamamen ücretsiz.",
    primary: "Ücretsiz başla",
    primaryHref: "/uye-ol",
    secondary: "Nasıl çalışır",
    secondaryHref: "#nasil-calisir",
  },
  trust: [
    {
      icon: "tag",
      figure: "0 ₺",
      title: "tamamen ücretsiz",
      text: "Kayıt ol, paneli kullan.",
    },
    {
      icon: "calendar",
      figure: "Tek",
      title: "panel",
      text: "Randevudan rapora kadar.",
    },
    {
      icon: "clock",
      figure: "Her ay",
      title: "PDF rapor",
      text: "Ayı seç, indir.",
    },
    {
      icon: "chat",
      figure: "7/24",
      title: "Türkçe destek",
      text: "Takıldığın yerde yazarsın.",
    },
  ],
  references: {
    lead: "Onlarla çalışıyoruz,",
    accent: "dükkânına güç katıyoruz.",
    text: "Sitelerini Vercel, Cloudflare, Supabase ve WordPress ile kuruyoruz. Hız, güvenlik ve içerik aynı yerde durur.",
  },
  partners: [
    { name: "Vercel", src: "/brands/vercel.svg", href: "https://vercel.com" },
    { name: "Cloudflare", src: "/brands/cloudflare.svg", href: "https://www.cloudflare.com" },
    { name: "Supabase", src: "/brands/supabase.svg", href: "https://supabase.com" },
    { name: "WordPress", src: "/brands/wordpress.png", href: "https://wordpress.org" },
  ],
  services: {
    id: "hizmetler",
    titleLead: "Panelde",
    titleAccent: "neler var",
    text: "Söylediğimiz her bölüm panelde duruyor. Kayıt olunca hepsi açık.",
    all: "Ücretsiz başla",
    more: "Panele gir",
    items: [
      { icon: "calendar", title: "Randevu", text: "Gün ve hafta. Müşteriye bağlanır, onay ve erteleme sende." },
      { icon: "chat", title: "Müşteri ve tedarikçi", text: "Kart, telefon ve Excel. Randevu müşteri kartında görünür." },
      { icon: "tag", title: "Satış makbuzu", text: "Kalem, KDV ve tahsil. Tahsil edince gelir seçtiğin hesaba işlenir." },
      { icon: "pin", title: "Gelir, gider, hesap", text: "Kasa, banka, POS ve kart. Gelir yeşil, gider kırmızı. Bakiye birlikte yürür." },
      { icon: "wrench", title: "Banka dökümü", text: "Havale, EFT ve POS satırını yükle. Müşteri veya tedarikçiyle eşleşir." },
      { icon: "clock", title: "Kredi asgarisi", text: "Asgari, dönem borcunun %20’si. Her ay giderde görünür. Ödemeyi sen işaretlersin." },
      { icon: "site", title: "Masraf ve web sitesi", text: "Aidat, kira, fatura. Dükkânının sayfası da aynı panelden." },
      { icon: "more", title: "Aylık rapor", text: "Ayı seç, PDF indir. Gelir, gider, satış, randevu ve hesaplar içinde." },
    ],
  },
  steps: {
    id: "nasil-calisir",
    titleLead: "Nasıl kullanılır?",
    titleAccent: "Dört adım",
    text: "Kurulum beklemeden kayıt olur, dükkânının kayıtlarını işlemeye başlarsın.",
    start: "Ücretsiz başla",
    more: "Özelliklere bak",
    items: [
      {
        title: "Hesabını aç",
        text: "Adın, dükkânın ve e-postan yeter. Şu an ücret yok.",
      },
      {
        title: "Müşteri ve hesap ekle",
        text: "Müşterini, kasanı veya bankanı yaz. Randevu bu müşteriye bağlanır.",
      },
      {
        title: "Günlük işi işle",
        text: "Satış, gelir, gider, masraf ve kredi asgarisi seçtiğin hesaba düşer.",
      },
      {
        title: "Ayın raporunu al",
        text: "Ayı seçip PDF indir. Destek lazımsa panelden yazarsın.",
      },
    ],
  },
  pricing: {
    id: "fiyatlar",
    eyebrow: "Fiyatlar",
    title: "Aylık ücret baştan belli.",
    text: "Paketi görüşmede birlikte seçeriz. Aşağıdaki tutarlar aylıktır, sürpriz fatura çıkmaz.",
    items: [
      {
        name: "Başlangıç",
        text: "Tek sayfalık site ve temel panel",
        price: "₺995",
        period: "aylık",
        popular: false,
        features: [
          "Tek sayfalık web sitesi",
          "Müşteri kartları",
          "Online randevu",
          "İşletme ayarları",
        ],
      },
      {
        name: "Esnaf Paketi",
        text: "Site, randevu ve günlük muhasebe",
        price: "₺1.745",
        period: "aylık",
        popular: true,
        features: [
          "Başlangıçtakilerin hepsi",
          "Gelir ve gider, hesaba işlenir",
          "Kasa ve banka hesapları",
          "Masraflar",
          "Aylık destek",
        ],
      },
      {
        name: "Tam Dijital",
        text: "Muhasebenin tamamı ve rapor",
        price: "₺2.995",
        period: "aylık",
        popular: false,
        features: [
          "Esnaf Paketindeki her şey",
          "Tedarikçiler",
          "Krediler: taksit, KMH, avans, kart",
          "Aylık rapor",
          "Öncelikli destek",
        ],
      },
    ],
    cta: "Bu paketle konuşalım",
  },
  founder: {
    eyebrow: "Kurucu müşteri",
    text: "İlk 10 işletmeye özel kurucu müşteri indirimi. Yerini ayırt.",
    cta: "WhatsApp'tan yer ayırt",
  },
  faq: {
    id: "sss",
    eyebrow: "Sık sorulanlar",
    title: "Merak ettiğini açıkça yanıtlıyoruz.",
    items: [
      {
        question: "Teknik bilgim yok, yapabilir miyim?",
        answer:
          "Evet. Kayıt olursun. Müşteri, randevu, satış ve hesabı panelden eklersin. Takılırsan destek sayfasından yazarsın.",
      },
      {
        question: "Kredi asgarisi ne zaman gidere düşer?",
        answer:
          "Her ay, dönem borcunun %20’si gider olarak görünür. Kalan borç ancak Ödedim veya Asgari ödedim dediğinde azalır.",
      },
      {
        question: "Esnafyo ücretli mi?",
        answer:
          "Şu an tamamen ücretsiz. Randevu, müşteri, satış, gelir, gider, hesap, banka dökümü, kredi ve rapor açık. Kayıt olman yeterli.",
      },
      {
        question: "Alan adı ve hosting kimin adına olur?",
        answer:
          "Alan adı senin adına alınır. Barındırma ve teknik işleri biz yürütürüz. Ayrılmak istersen alan adını sana bırakırız.",
      },
      {
        question: "İstediğim zaman bırakabilir miyim?",
        answer:
          "Evet. Uzun süreli sözleşme yok. Ay bitmeden haber vermen yeterli. Siten ve alan adın sende kalır.",
      },
    ],
  },
  contact: {
    id: "iletisim",
    eyebrow: "İletişim",
    title: "Dükkânını yaz, panele geç.",
    text: "Adın ve işletmen yeterli. İstersen buradan da yaz, dönüşü biz yaparız.",
    submit: "Gönder",
    success: "Teşekkürler, en kısa sürede dönüyoruz",
    another: "Başka bir mesaj yaz",
    fields: {
      name: "Adın",
      business: "İşletme adı",
      sector: "Sektör",
      phone: "Telefon",
      message: "Mesajın",
    },
    placeholders: {
      name: "Ayşe Yılmaz",
      business: "Lale Kuaför",
      phone: "05xx xxx xx xx",
      message: "Randevu sayfası istiyorum, Kadıköy'deyim.",
      sector: "Sektörünü seç",
    },
    sectors: [
      "Kuaför",
      "Berber",
      "Kafe",
      "Restoran",
      "Klinik",
      "Oto servis",
      "Temizlik",
      "Emlak",
      "Diğer",
    ],
  },
  footer: {
    rights: "© 2026 Esnafyo. Tüm hakları saklıdır.",
    blurb: "Esnafyo; randevu, müşteri, satış, gelir, gider, hesap, kredi asgarisi ve aylık raporu tek panelde toplar.",
    services: "Hizmetler",
    packages: "Paketler",
    explore: "Sayfa",
    contact: "İletişim",
    stack: "Altyapımız",
  },
} as const;

export type IconName = (typeof site.trust)[number]["icon"] | (typeof site.services.items)[number]["icon"];
export type NavItem = (typeof site.nav)[number];
export type FaqItem = (typeof site.faq.items)[number];
export type ContactContent = typeof site.contact;
