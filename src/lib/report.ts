import { query } from "@/lib/db";
import { listCredits, listFinanceAccounts, listLedger, listMasraflar, listSales } from "@/lib/panel";

const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export type MoneyLine = {
  date: string;
  title: string;
  detail: string;
  amountKurus: number;
  currency: string;
};

export type MonthlyReport = {
  key: string;
  label: string;
  business: string;
  owner: string;
  appointments: { date: string; customer: string; service: string; status: string }[];
  lastAppointmentCount: number;
  income: MoneyLine[];
  expense: MoneyLine[];
  lastIncomeTl: number;
  lastExpenseTl: number;
  sales: { date: string; title: string; customer: string; status: string; amountKurus: number; currency: string }[];
  expenses: { date: string; category: string; description: string; status: string; amountKurus: number }[];
  credits: { name: string; remainingKurus: number; currency: string; nextDue: string; installments: number }[];
  accounts: { name: string; kind: string; currency: string; balanceKurus: number }[];
};

export function reportMonth(value: string | undefined, today: Date) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  const year = match ? Number(match[1]) : today.getFullYear();
  const month = match ? Number(match[2]) : today.getMonth() + 1;
  if (month < 1 || month > 12 || year < 2020 || year > today.getFullYear() + 1) {
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  }
  return { year, month };
}

export function monthChoices(today: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const month = date.getMonth() + 1;
    return {
      key: `${date.getFullYear()}-${String(month).padStart(2, "0")}`,
      label: `${months[date.getMonth()]} ${date.getFullYear()}`,
    };
  });
}

export function moneyText(kurus: number, currency = "TL") {
  const text = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
  return `${text} ${currency}`;
}

export function sumByCurrency(lines: { amountKurus: number; currency: string }[]) {
  const totals = new Map<string, number>();
  for (const line of lines) totals.set(line.currency, (totals.get(line.currency) ?? 0) + line.amountKurus);
  return [...totals.entries()].map(([currency, kurus]) => ({ currency, kurus }));
}

export async function buildMonthlyReport(userId: string, year: number, month: number, business: string, owner: string): Promise<MonthlyReport> {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const previous = new Date(year, month - 2, 1);
  const start = key(from);
  const end = key(to);
  const previousKey = key(previous);
  const [ledger, sales, expenses, credits, accounts, appointments, lastAppointments] = await Promise.all([
    listLedger(userId),
    listSales(userId),
    listMasraflar(userId),
    listCredits(userId),
    listFinanceAccounts(userId),
    query<{ customer_name: string; service: string; starts_at: string | Date; status: string }>(
      `select customer_name, service, starts_at, status from appointments
       where user_id = $1 and starts_at >= $2 and starts_at < $3
       order by starts_at`,
      [userId, from.toISOString(), to.toISOString()],
    ),
    query<{ count: string }>(
      `select count(*)::text as count from appointments
       where user_id = $1 and starts_at >= $2 and starts_at < $3 and status <> 'iptal'`,
      [userId, previous.toISOString(), from.toISOString()],
    ),
  ]);
  const inMonth = (date: string) => date >= start && date < end;
  const inPrevious = (date: string) => date >= previousKey && date < start;
  const income = ledger.filter((item) => item.kind === "gelir" && inMonth(item.date)).map(moneyLine);
  const expense = ledger.filter((item) => item.kind === "gider" && inMonth(item.date)).map(moneyLine);
  return {
    key: start.slice(0, 7),
    label: `${months[month - 1]} ${year}`,
    business,
    owner,
    appointments: appointments.map((item) => ({
      date: formatWhen(item.starts_at),
      customer: item.customer_name,
      service: item.service,
      status: item.status === "onayli" ? "Onaylı" : item.status === "iptal" ? "İptal" : "Onay bekliyor",
    })),
    lastAppointmentCount: Number(lastAppointments[0]?.count ?? 0),
    income,
    expense,
    lastIncomeTl: ledger.filter((item) => item.kind === "gelir" && item.currency === "TL" && inPrevious(item.date)).reduce((sum, item) => sum + item.amountKurus, 0),
    lastExpenseTl: ledger.filter((item) => item.kind === "gider" && item.currency === "TL" && inPrevious(item.date)).reduce((sum, item) => sum + item.amountKurus, 0),
    sales: sales.filter((item) => inMonth(item.date)).map((item) => ({
      date: item.date,
      title: item.title,
      customer: item.customerName,
      status: item.status === "tahsil" ? "Tahsil edildi" : "Tahsil edilecek",
      amountKurus: item.totalKurus,
      currency: item.currency,
    })),
    expenses: expenses.filter((item) => inMonth(item.date)).map((item) => ({
      date: item.date,
      category: item.category,
      description: item.description,
      status: item.status === "odendi" ? "Ödendi" : "Ödenecek",
      amountKurus: item.amountKurus,
    })),
    credits: credits.filter((item) => item.remainingKurus > 0).map((item) => ({
      name: item.name,
      remainingKurus: item.remainingKurus,
      currency: item.currency,
      nextDue: item.nextDue,
      installments: item.remainingInstallments,
    })),
    accounts: accounts.map((item) => ({
      name: item.name,
      kind: item.kind,
      currency: item.currency,
      balanceKurus: item.balanceKurus,
    })),
  };
}

function moneyLine(item: { date: string; title: string; accountName: string; amountKurus: number; currency: string }): MoneyLine {
  return { date: item.date, title: item.title, detail: item.accountName, amountKurus: item.amountKurus, currency: item.currency };
}

function key(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatWhen(value: string | Date) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
