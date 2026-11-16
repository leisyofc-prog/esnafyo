/** Bütün WhatsApp linkleri bu fonksiyondan üretilir. */
export function whatsappHref(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
