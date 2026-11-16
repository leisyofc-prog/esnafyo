# Esnafyo

Küçük işletmeler için tek sayfalık tanıtım sitesi. Next.js, TypeScript ve Tailwind CSS.

## Çalıştır

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açılır.

## Neyi nereden değiştirirsin

Bütün metinler, fiyatlar, e-posta, Instagram ve WhatsApp numarası tek dosyada:

`src/content/site.ts`

- `whatsappNumber` — başında + olmadan, ülke koduyla. Örnek: `905321112233`. Sitedeki bütün WhatsApp butonları bu numarayı kullanır.
- Paket fiyatları `pricing.items` içinde. Şu an `₺___` olarak duruyor.
- Canlı adres için `url` alanını değiştir ya da `NEXT_PUBLIC_SITE_URL` ortam değişkeni ver. SEO bağlantıları ve paylaşım görseli bu adresi kullanır.

İletişim formu şimdilik yalnızca tarayıcıda çalışır. Gönderince teşekkür mesajı çıkar; bir sunucuya gitmez. Bağlamak için `src/components/contact-form.tsx` içindeki gönderim fonksiyonuna isteği ekle.

## Vercel

Projeyi Vercel'e bağlaman yeterli. Ek ayar yok. Alan adın oturunca Vercel ortam değişkenlerine `NEXT_PUBLIC_SITE_URL` ekle, örneğin `https://esnafyo.com`.
