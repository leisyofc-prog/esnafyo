export const currencies = ["TL", "USD", "EUR", "GBP", "CHF"] as const;

export function normalizeCurrency(value: string) {
  const code = value.trim().toLocaleUpperCase("tr");
  if (!code) return "TL";
  return currencies.includes(code as (typeof currencies)[number]) ? code : null;
}
