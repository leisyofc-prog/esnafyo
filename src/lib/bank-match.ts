import { customerNameKey } from "@/lib/customer-sheet";

export type BankParty = {
  id: string;
  name: string;
  phone: string;
  bankInfo: string;
  kind: "musteri" | "tedarikci";
};

export type BankMatch = { id: string; kind: "musteri" | "tedarikci"; name: string };

export function detectChannel(text: string) {
  const value = text.toLocaleLowerCase("tr");
  if (value.includes("pos")) return "pos" as const;
  if (value.includes("eft")) return "eft" as const;
  if (value.includes("havale") || value.includes("fast")) return "havale" as const;
  return "diger" as const;
}

export function matchMovement(input: { description: string; counterparty: string; iban: string; direction: "gelen" | "giden" }, parties: BankParty[]): BankMatch | null {
  const haystack = `${input.counterparty} ${input.description} ${input.iban}`;
  const iban = digits(input.iban) || ibanIn(haystack);
  const phone = digits(haystack);
  const counterKey = customerNameKey(input.counterparty);
  let best: { score: number; party: BankParty } | null = null;

  for (const party of parties) {
    let score = 0;
    const partyIban = digits(party.bankInfo);
    if (iban.length >= 10 && partyIban.includes(iban)) score = 100;
    const nameKey = customerNameKey(party.name);
    if (score < 80 && counterKey.length >= 4 && counterKey === nameKey) score = 80;
    const partyPhone = digits(party.phone);
    if (score < 70 && partyPhone.length >= 10 && phone.includes(partyPhone)) score = 70;
    if (score < 60 && nameKey.length >= 4 && customerNameKey(haystack).includes(nameKey)) score = 60;
    if (score === 0) continue;
    const preferred = input.direction === "gelen" ? "musteri" : "tedarikci";
    const better = !best || score > best.score || (score === best.score && party.kind === preferred && best.party.kind !== preferred);
    if (better) best = { score, party };
  }

  return best ? { id: best.party.id, kind: best.party.kind, name: best.party.name } : null;
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function ibanIn(value: string) {
  return value.toUpperCase().match(/TR\d{24}/)?.[0] ?? "";
}
