import { creditCycle } from "@/lib/credit-cycle";
import { query } from "@/lib/db";
import { listCredits, listFinanceAccounts, type Credit } from "@/lib/panel";

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export type MonthlySummaryCategory = {
  name: string;
  amountKurus: number;
};

export type MonthlyCreditPayment = {
  id: string;
  date: string;
  name: string;
  kindLabel: string;
  amountKurus: number;
  currency: string;
  accountName: string;
};

export type MonthlyCreditItem = {
  id: string;
  name: string;
  due: string;
  overdueDays: number | null;
  remainingKurus: number;
  currency: string;
};

export type DailyBalancePoint = {
  date: string;
  day: number;
  balanceKurus: number;
};

export type MonthlyAsgariStatus = "odendi" | "kismen" | "odenmedi";

export type MonthlyAsgariLine = {
  id: string;
  name: string;
  due: string;
  minimumKurus: number;
  paidKurus: number;
  remainingKurus: number;
  status: MonthlyAsgariStatus;
  overdueDays: number | null;
  currency: string;
};

export type MonthlyAsgariSummary = {
  dueKurus: number;
  paidKurus: number;
  remainingKurus: number;
  items: MonthlyAsgariLine[];
};

export type MonthlyKasaSummary = {
  key: string;
  label: string;
  kasaNames: string[];
  incomeKurus: number;
  expenseKurus: number;
  netKurus: number;
  startBalanceKurus: number;
  endBalanceKurus: number;
  currentBalanceKurus: number;
  categories: MonthlySummaryCategory[];
  creditPayments: MonthlyCreditPayment[];
  overdueCredits: MonthlyCreditItem[];
  dueThisMonth: MonthlyCreditItem[];
  dailyBalances: DailyBalancePoint[];
  asgari: MonthlyAsgariSummary;
};

export function istanbulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseSummaryMonth(value: string | undefined) {
  const todayKey = istanbulDateKey();
  const fallbackYear = Number(todayKey.slice(0, 4));
  const fallbackMonth = Number(todayKey.slice(5, 7));
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  const year = match ? Number(match[1]) : fallbackYear;
  const month = match ? Number(match[2]) : fallbackMonth;
  if (month < 1 || month > 12 || year < 2020 || year > fallbackYear + 1) {
    return { year: fallbackYear, month: fallbackMonth, key: todayKey.slice(0, 7) };
  }
  return { year, month, key: `${year}-${String(month).padStart(2, "0")}` };
}

function calendarKey(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${value.getUTCFullYear()}-${month}-${day}`;
}

function expenseCategory(title: string, creditPayment: string | null) {
  if (creditPayment === "taksit" || creditPayment === "asgari" || creditPayment === "donem") return "Kredi ödemesi";
  if (title.startsWith("Masraf: ")) return title.slice("Masraf: ".length).trim() || "Masraf";
  return "Diğer";
}

function paymentKindLabel(value: string) {
  if (value === "asgari") return "Asgari ödedim";
  return "Ödedim";
}

function isClosedCredit(remainingKurus: number, periodKurus: number) {
  const cycle = creditCycle(periodKurus, remainingKurus);
  return remainingKurus <= 0 || cycle.months <= 0;
}

function overdueDays(nextDue: string, closed: boolean, today: string) {
  if (closed || nextDue >= today) return null;
  const from = Date.UTC(Number(nextDue.slice(0, 4)), Number(nextDue.slice(5, 7)) - 1, Number(nextDue.slice(8, 10)));
  const to = Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10)));
  return Math.round((to - from) / 86_400_000);
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthBounds(year: number, month: number) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  return {
    key,
    startKey: `${key}-01`,
    endKey: `${key}-${String(lastDayOfMonth(year, month)).padStart(2, "0")}`,
  };
}

export function creditAsgariKurus(credit: { minimumKurus: number | null; periodKurus: number; remainingKurus: number }) {
  const stored = credit.minimumKurus;
  if (stored != null && stored > 0) return Math.min(stored, Math.max(0, credit.remainingKurus));
  return creditCycle(credit.periodKurus, credit.remainingKurus).minimum;
}

export function buildMonthlyAsgariSummary(
  credits: Credit[],
  payments: { creditId: string | null; amountKurus: number }[],
  endKey: string,
  today: string,
): MonthlyAsgariSummary {
  const paidByCredit = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.creditId) continue;
    paidByCredit.set(payment.creditId, (paidByCredit.get(payment.creditId) ?? 0) + payment.amountKurus);
  }

  const items: MonthlyAsgariLine[] = [];
  for (const credit of credits) {
    if (isClosedCredit(credit.remainingKurus, credit.periodKurus)) continue;
    if (credit.nextDue > endKey) continue;
    const minimumKurus = creditAsgariKurus(credit);
    if (minimumKurus <= 0) continue;
    const paidKurus = Math.min(paidByCredit.get(credit.id) ?? 0, minimumKurus);
    const remainingKurus = Math.max(0, minimumKurus - paidKurus);
    items.push({
      id: credit.id,
      name: credit.name,
      due: credit.nextDue,
      minimumKurus,
      paidKurus,
      remainingKurus,
      status: paidKurus >= minimumKurus ? "odendi" : paidKurus > 0 ? "kismen" : "odenmedi",
      overdueDays: overdueDays(credit.nextDue, false, today),
      currency: credit.currency,
    });
  }
  items.sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name, "tr"));
  return {
    dueKurus: items.reduce((sum, item) => sum + item.minimumKurus, 0),
    paidKurus: items.reduce((sum, item) => sum + item.paidKurus, 0),
    remainingKurus: items.reduce((sum, item) => sum + item.remainingKurus, 0),
    items,
  };
}

export async function loadMonthlyAsgariSummary(userId: string, year: number, month: number) {
  const { startKey, endKey } = monthBounds(year, month);
  const today = istanbulDateKey();
  const [credits, paymentRows] = await Promise.all([
    listCredits(userId),
    query<{ credit_id: string | null; amount_kurus: number | string }>(
      `select credit_id, amount_kurus
       from ledger
       where user_id = $1
         and credit_payment in ('taksit', 'asgari')
         and happened_on >= $2 and happened_on <= $3`,
      [userId, startKey, endKey],
    ),
  ]);
  return buildMonthlyAsgariSummary(
    credits,
    paymentRows.map((row) => ({ creditId: row.credit_id, amountKurus: Number(row.amount_kurus) })),
    endKey,
    today,
  );
}

export async function buildMonthlyKasaSummary(userId: string, year: number, month: number): Promise<MonthlyKasaSummary> {
  const { key, startKey, endKey } = monthBounds(year, month);
  const today = istanbulDateKey();
  const trendEnd = today.startsWith(key) ? today : endKey;

  const [accounts, credits, kasaRows, paymentRows] = await Promise.all([
    listFinanceAccounts(userId),
    listCredits(userId),
    query<{
      kind: string;
      title: string;
      amount_kurus: number | string;
      happened_on: string | Date;
      credit_payment: string | null;
    }>(
      `select ledger.kind, ledger.title, ledger.amount_kurus, ledger.happened_on, ledger.credit_payment
       from ledger
       join finance_accounts on finance_accounts.id = ledger.account_id
       where ledger.user_id = $1 and finance_accounts.kind = 'kasa'
         and (finance_accounts.currency = 'TL' or finance_accounts.currency = 'TRY')
         and ledger.kind in ('gelir', 'gider')
       order by ledger.happened_on, ledger.created_at`,
      [userId],
    ),
    query<{
      id: string;
      title: string;
      amount_kurus: number | string;
      happened_on: string | Date;
      credit_payment: string;
      credit_id: string | null;
      credit_name: string | null;
      account_name: string | null;
      currency: string | null;
    }>(
      `select ledger.id, ledger.title, ledger.amount_kurus, ledger.happened_on, ledger.credit_payment, ledger.credit_id,
              credits.name as credit_name, finance_accounts.name as account_name, finance_accounts.currency
       from ledger
       left join credits on credits.id = ledger.credit_id
       left join finance_accounts on finance_accounts.id = ledger.account_id
       where ledger.user_id = $1
         and ledger.credit_payment in ('taksit', 'asgari')
         and ledger.happened_on >= $2 and ledger.happened_on <= $3
       order by ledger.happened_on, ledger.created_at`,
      [userId, startKey, endKey],
    ),
  ]);

  const kasaAccounts = accounts.filter((account) => account.kind === "kasa" && (account.currency === "TL" || account.currency === "TRY"));
  const currentBalanceKurus = kasaAccounts.reduce((sum, account) => sum + account.balanceKurus, 0);

  const movements = kasaRows.map((row) => {
    const date = calendarKey(row.happened_on);
    const amount = Number(row.amount_kurus);
    const signed = row.kind === "gelir" ? amount : -amount;
    return {
      date,
      kind: row.kind,
      title: row.title,
      amount,
      signed,
      creditPayment: row.credit_payment,
    };
  });

  const afterStart = movements.filter((row) => row.date >= startKey);
  const inMonth = afterStart.filter((row) => row.date <= endKey);
  const afterMonth = movements.filter((row) => row.date > endKey);
  const incomeKurus = inMonth.filter((row) => row.kind === "gelir").reduce((sum, row) => sum + row.amount, 0);
  const expenseKurus = inMonth.filter((row) => row.kind === "gider").reduce((sum, row) => sum + row.amount, 0);
  const startBalanceKurus = currentBalanceKurus - afterStart.reduce((sum, row) => sum + row.signed, 0);
  const endBalanceKurus = currentBalanceKurus - afterMonth.reduce((sum, row) => sum + row.signed, 0);

  const categoryTotals = new Map<string, number>();
  for (const row of inMonth) {
    if (row.kind !== "gider") continue;
    const name = expenseCategory(row.title, row.creditPayment);
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + row.amount);
  }
  const categories = [...categoryTotals.entries()]
    .map(([name, amountKurus]) => ({ name, amountKurus }))
    .sort((a, b) => b.amountKurus - a.amountKurus);

  const dayNet = new Map<string, number>();
  for (const row of inMonth) dayNet.set(row.date, (dayNet.get(row.date) ?? 0) + row.signed);
  const dailyBalances: DailyBalancePoint[] = [];
  let running = startBalanceKurus;
  const lastTrendDay = Number(trendEnd.slice(8, 10));
  for (let day = 1; day <= lastTrendDay; day += 1) {
    const date = `${key}-${String(day).padStart(2, "0")}`;
    running += dayNet.get(date) ?? 0;
    dailyBalances.push({ date, day, balanceKurus: running });
  }

  const creditPayments: MonthlyCreditPayment[] = paymentRows.map((row) => ({
    id: row.id,
    date: calendarKey(row.happened_on),
    name: row.credit_name || row.title.replace(/^(Kredi taksiti|Asgari ödeme|Asgari):\s*/i, "") || row.title,
    kindLabel: paymentKindLabel(row.credit_payment),
    amountKurus: Number(row.amount_kurus),
    currency: row.currency ?? "TL",
    accountName: row.account_name ?? "",
  }));

  const overdueCredits: MonthlyCreditItem[] = [];
  const dueThisMonth: MonthlyCreditItem[] = [];
  for (const credit of credits) {
    const closed = isClosedCredit(credit.remainingKurus, credit.periodKurus);
    if (closed) continue;
    const days = overdueDays(credit.nextDue, closed, today);
    const item: MonthlyCreditItem = {
      id: credit.id,
      name: credit.name,
      due: credit.nextDue,
      overdueDays: days,
      remainingKurus: credit.remainingKurus,
      currency: credit.currency,
    };
    if (days) overdueCredits.push(item);
    else if (credit.nextDue >= today && credit.nextDue >= startKey && credit.nextDue <= endKey) dueThisMonth.push(item);
  }

  const asgari = buildMonthlyAsgariSummary(
    credits,
    paymentRows.map((row) => ({ creditId: row.credit_id, amountKurus: Number(row.amount_kurus) })),
    endKey,
    today,
  );

  return {
    key,
    label: `${MONTHS[month - 1]} ${year}`,
    kasaNames: kasaAccounts.map((account) => account.name),
    incomeKurus,
    expenseKurus,
    netKurus: incomeKurus - expenseKurus,
    startBalanceKurus,
    endBalanceKurus,
    currentBalanceKurus,
    categories,
    creditPayments,
    overdueCredits,
    dueThisMonth,
    dailyBalances,
    asgari,
  };
}
