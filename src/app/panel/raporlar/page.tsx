import { connection } from "next/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { guardFeature } from "@/lib/plan-guard";
import { buildMonthlyReport, moneyText, monthChoices, reportMonth, sumByCurrency } from "@/lib/report";

export const instant = false;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ ay?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  guardFeature(user.package_name, "rapor");
  const params = await searchParams;
  const today = new Date();
  const chosen = reportMonth(params.ay, today);
  const report = await buildMonthlyReport(user.id, chosen.year, chosen.month, user.business_name, user.name);
  const income = sumByCurrency(report.income);
  const expense = sumByCurrency(report.expense);
  const incomeTl = income.find((item) => item.currency === "TL")?.kurus ?? 0;
  const expenseTl = expense.find((item) => item.currency === "TL")?.kurus ?? 0;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eceff3] bg-white p-4">
        <div>
          <h2 className="text-[16px] font-semibold">{report.label}</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Gelir, gider, satış, masraf, randevu, kredi ve hesap bakiyesi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form>
            <select name="ay" defaultValue={report.key} className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px]">
              {monthChoices(today).map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <button className="ml-2 h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px] font-semibold">Göster</button>
          </form>
          <a href={`/api/rapor?ay=${report.key}`} className="inline-flex h-10 items-center rounded-lg bg-[#f97316] px-4 text-[13px] font-semibold text-white">PDF indir</a>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Gelir" value={moneyText(incomeTl)} tone="text-[#15803d]" hint={side(income)} />
        <Card label="Gider" value={moneyText(expenseTl)} tone="text-[#dc2626]" hint={side(expense)} />
        <Card label="Net" value={moneyText(incomeTl - expenseTl)} tone="text-[#1e293b]" hint="Yalnız TL" />
        <Card label="Randevu" value={String(report.appointments.filter((item) => item.status !== "İptal").length)} tone="text-[#c2410c]" hint={`Geçen ay ${report.lastAppointmentCount}`} />
      </section>

      <Block title="Gelirler" empty="Bu ay gelir yok." rows={report.income.map((item) => [showDate(item.date), item.title, item.detail || "—", moneyText(item.amountKurus, item.currency)])} />
      <Block title="Giderler" empty="Bu ay gider yok." rows={report.expense.map((item) => [showDate(item.date), item.title, item.detail || "—", moneyText(item.amountKurus, item.currency)])} />
      <Block title="Satışlar" empty="Bu ay makbuz yok." rows={report.sales.map((item) => [showDate(item.date), item.title, item.customer, `${item.status} · ${moneyText(item.amountKurus, item.currency)}`])} />
      <Block title="Masraflar" empty="Bu ay masraf yok." rows={report.expenses.map((item) => [showDate(item.date), item.category, item.description || "—", `${item.status} · ${moneyText(item.amountKurus)}`])} />
      <Block title="Randevular" empty="Bu ay randevu yok." rows={report.appointments.map((item) => [item.date, item.customer, item.service, item.status])} />
      <Block title="Açık krediler" empty="Açık kredi yok." rows={report.credits.map((item) => [item.name, showDate(item.nextDue), `${item.installments} taksit`, moneyText(item.remainingKurus, item.currency)])} />
      <Block title="Hesap bakiyeleri" empty="Hesap yok." rows={report.accounts.map((item) => [item.name, item.kind, item.currency, moneyText(item.balanceKurus, item.currency)])} />

      <p className="text-[12px] text-[#98a2b3]">PDF, ekrandaki bu ayın kayıtlarını olduğu gibi içerir. Geçen ay TL gelir {moneyText(report.lastIncomeTl)}, gider {moneyText(report.lastExpenseTl)}.</p>
      <p className="text-[12px] text-[#98a2b3]">Başka bir aya bakmak için listeden seç. <Link href="/panel/gelir" className="font-semibold text-[#1e293b]">Gelir</Link> ve <Link href="/panel/gider" className="font-semibold text-[#1e293b]">gider</Link> kayıtları rapora düşer.</p>
    </div>
  );
}

function Card({ label, value, tone, hint }: { label: string; value: string; tone: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[#eceff3] bg-white p-4">
      <p className="text-[12px] text-[#98a2b3]">{label}</p>
      <p className={`mt-1 text-[20px] font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-[12px] text-[#98a2b3]">{hint}</p>
    </div>
  );
}

function Block({ title, rows, empty }: { title: string; rows: string[][]; empty: string }) {
  return (
    <section className="rounded-xl border border-[#eceff3] bg-white p-4">
      <h3 className="text-[14px] font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="mt-3 text-[13px] text-[#98a2b3]">{empty}</p> : (
        <ul className="mt-3 divide-y divide-[#f2f4f7]">
          {rows.map((row, index) => (
            <li key={`${title}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
              <span className="text-[#475467]">{row.slice(0, -1).filter(Boolean).join(" · ")}</span>
              <span className="font-semibold">{row[row.length - 1]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function side(totals: { currency: string; kurus: number }[]) {
  const rest = totals.filter((item) => item.currency !== "TL");
  return rest.length ? rest.map((item) => moneyText(item.kurus, item.currency)).join(", ") : "Bu ay";
}

function showDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
