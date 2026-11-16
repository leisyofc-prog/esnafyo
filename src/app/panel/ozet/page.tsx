import { connection } from "next/server";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/panel";
import { buildMonthlyKasaSummary, parseSummaryMonth, type DailyBalancePoint, type MonthlySummaryCategory } from "@/lib/monthly-summary";

export const instant = false;

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

function signedClass(amount: number) {
  if (amount > 0) return "text-[#16a34a]";
  if (amount < 0) return "text-[#dc2626]";
  return "text-[#475467]";
}

export default async function MonthlySummaryPage({ searchParams }: { searchParams: Promise<{ ay?: string }> }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const chosen = parseSummaryMonth(params.ay);
  const summary = await buildMonthlyKasaSummary(user.id, chosen.year, chosen.month);
  const kasaLabel = summary.kasaNames.length ? summary.kasaNames.join(", ") : "Kasa";

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eceff3] bg-white p-4">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold">{summary.label} özeti</h2>
          <p className="mt-1 text-[13px] text-[#98a2b3]">Kasa geliri, gideri, kredi ödemeleri ve bakiyesi. {kasaLabel}.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <label className="text-[13px] font-semibold text-[#475467]">
            Ay
            <input
              type="month"
              name="ay"
              defaultValue={summary.key}
              className="ml-2 h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px] font-normal"
            />
          </label>
          <button className="h-10 rounded-lg border border-[#e4e7ec] px-3 text-[13px] font-semibold">Göster</button>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Kasa geliri" value={formatMoney(summary.incomeKurus)} tone="text-[#16a34a]" />
        <Stat label="Kasa gideri" value={formatMoney(summary.expenseKurus)} tone="text-[#dc2626]" />
        <Stat label="Net" value={formatMoney(summary.netKurus)} tone={signedClass(summary.netKurus)} />
        <Stat label="Ay başı kasa" value={formatMoney(summary.startBalanceKurus)} tone={signedClass(summary.startBalanceKurus)} />
        <Stat label="Ay sonu kasa" value={formatMoney(summary.endBalanceKurus)} tone={signedClass(summary.endBalanceKurus)} className="col-span-2 lg:col-span-1" />
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-4">
        <h3 className="text-[15px] font-semibold">Giderler kategorilere göre</h3>
        {summary.categories.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#98a2b3]">Bu ay kasada gider yok.</p>
        ) : (
          <CategoryBars categories={summary.categories} />
        )}
      </section>

      <section className="rounded-xl border border-[#eceff3] bg-white p-4">
        <h3 className="text-[15px] font-semibold">Bu ayki kredi ödemeleri</h3>
        <p className="mt-1 text-[12px] text-[#98a2b3]">Ödedim ve Asgari ödedim kayıtları.</p>
        {summary.creditPayments.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#98a2b3]">Bu ay işaretlenmiş kredi ödemesi yok.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f2f4f7]">
            {summary.creditPayments.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <div className="min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-[12px] text-[#98a2b3]">{formatDate(item.date)} · {item.kindLabel}{item.accountName ? ` · ${item.accountName}` : ""}</p>
                </div>
                <span className="font-semibold text-[#dc2626]">{formatMoney(item.amountKurus)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#eceff3] bg-white p-4">
          <h3 className="text-[15px] font-semibold">Geciken krediler</h3>
          {summary.overdueCredits.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#98a2b3]">Geciken kredi yok.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.overdueCredits.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fff1f1] px-3 py-2 text-[13px]">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[12px] text-[#98a2b3]">Son tarih {formatDate(item.due)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#dc2626]">{item.overdueDays} gündür ödenmiyor</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/panel/krediler" className="mt-3 inline-block text-[12px] font-semibold text-[#f97316]">Krediler sayfasına git</Link>
        </section>

        <section className="rounded-xl border border-[#eceff3] bg-white p-4">
          <h3 className="text-[15px] font-semibold">Bu ay vadesi gelecekler</h3>
          {summary.dueThisMonth.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#98a2b3]">Bu ay ileride vadesi gelen açık kredi yok.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {summary.dueThisMonth.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#fff8f1] px-3 py-2 text-[13px]">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[12px] text-[#98a2b3]">Vade {formatDate(item.due)}</p>
                  </div>
                  <span className="font-semibold">{formatMoney(item.remainingKurus)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-[#eceff3] bg-white p-4">
        <h3 className="text-[15px] font-semibold">Günlük kasa bakiyesi</h3>
        {summary.dailyBalances.length === 0 ? (
          <p className="mt-3 text-[13px] text-[#98a2b3]">Grafik için kasa hareketi yok.</p>
        ) : (
          <BalanceTrend points={summary.dailyBalances} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone, className = "" }: { label: string; value: string; tone: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#eceff3] bg-white p-3 ${className}`}>
      <p className="text-[12px] text-[#98a2b3]">{label}</p>
      <p className={`mt-1 text-[16px] font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function CategoryBars({ categories }: { categories: MonthlySummaryCategory[] }) {
  const max = Math.max(...categories.map((item) => item.amountKurus), 1);
  return (
    <div className="mt-4 space-y-3">
      {categories.map((item) => {
        const width = Math.max(4, Math.round((item.amountKurus / max) * 100));
        return (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
              <span className="font-medium">{item.name}</span>
              <span className="shrink-0 text-[#475467]">{formatMoney(item.amountKurus)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#f2f4f7]">
              <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BalanceTrend({ points }: { points: DailyBalancePoint[] }) {
  const width = 320;
  const height = 140;
  const padX = 8;
  const padY = 16;
  const values = points.map((item) => item.balanceKurus);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const coords = points.map((item, index) => {
    const x = padX + ((width - padX * 2) * index) / Math.max(points.length - 1, 1);
    const y = height - padY - ((item.balanceKurus - min) / span) * (height - padY * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const zeroY = height - padY - ((0 - min) / span) * (height - padY * 2);
  const first = points[0];
  const last = points[points.length - 1];
  const stroke = last.balanceKurus >= first.balanceKurus ? "#16a34a" : "#dc2626";

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" role="img" aria-label="Günlük kasa bakiyesi">
        <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="#eceff3" strokeWidth="1" />
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={coords.join(" ")} />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[12px] text-[#98a2b3]">
        <span>{formatDate(first.date)} · {formatMoney(first.balanceKurus)}</span>
        <span>{formatDate(last.date)} · {formatMoney(last.balanceKurus)}</span>
      </div>
    </div>
  );
}
