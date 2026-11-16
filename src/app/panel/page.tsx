import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, formatTime, listLedger, listSales, listTodayAppointments, localKey, pendingSummary, weekCounts } from "@/lib/panel";
import { hasFeature } from "@/lib/plan-access";
import { site } from "@/content/site";

export const instant = false;

export default async function PanelHome() {
  await connection();
  const user = await getCurrentUser();
  if (!user) return null;
  const [appointments, week, pending, ledger, sales] = await Promise.all([
    listTodayAppointments(user.id),
    weekCounts(user.id),
    pendingSummary(user.id),
    listLedger(user.id),
    listSales(user.id),
  ]);
  const money = hasFeature(user.package_name, "gelir");
  const month = localKey(new Date()).slice(0, 7);
  const monthLedger = ledger.filter((item) => item.date.startsWith(month) && item.currency === "TL");
  const income = monthLedger.filter((item) => item.kind === "gelir").reduce((sum, item) => sum + item.amountKurus, 0);
  const expense = monthLedger.filter((item) => item.kind === "gider").reduce((sum, item) => sum + item.amountKurus, 0);
  const flow = Math.max(income + expense, 1);
  const incomeShare = Math.round((income / flow) * 100);
  const plan = site.pricing.items.find((item) => item.name === user.package_name) ?? site.pricing.items[1];
  const total = Math.max(week.appointments + week.messages, 1);
  const appointmentShare = Math.round((week.appointments / total) * 100);

  return (
    <div className="space-y-4">
      {site.packagesEnabled ? (
      <section className="grid gap-3 rounded-2xl bg-[#0b1f44] p-4 text-white md:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-sm text-white/70">{plan.name}</p>
          <p className="mt-2 text-2xl font-semibold">{plan.text}</p>
          <p className="mt-2 text-sm text-white/70">Aylık {plan.price}. Sürpriz fatura yok.</p>
        </div>
        <Link href="/panel/hesap" className="inline-flex h-11 items-center justify-center self-end rounded-xl bg-[#2f6bff] px-4 text-sm font-semibold">
          Paketi gör →
        </Link>
      </section>
      ) : (
      <section className="rounded-2xl bg-[#0b1f44] p-4 text-white">
        <p className="text-sm text-white/70">Esnafyo</p>
        <p className="mt-2 text-2xl font-semibold">Tamamen ücretsiz</p>
        <p className="mt-2 text-sm text-white/70">Panelin bütün bölümleri açık. Ücret yok.</p>
      </section>
      )}

      <section className="grid gap-3 md:grid-cols-2">
        <StatusCard title="Onay bekleyen randevular" value={`${pending.appointments} randevu`} href="/panel/randevular" empty={pending.appointments === 0} />
        {money ? <StatusCard title="Tahsil bekleyen satışlar" value={`${sales.filter((item) => item.status === "bekliyor").length} makbuz`} href="/panel/satislar" empty={sales.every((item) => item.status !== "bekliyor")} /> : null}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <ChartCard
          title="Randevu ve mesaj"
          period="Bu hafta"
          share={week.appointments + week.messages === 0 ? 0 : appointmentShare}
          center={String(week.appointments + week.messages)}
          leftLabel="Randevu"
          leftValue={String(week.appointments)}
          rightLabel="Mesaj"
          rightValue={String(week.messages)}
        />
        {money ? (
        <ChartCard
          title="Gelir gider durumu"
          period="Bu ay"
          share={income + expense === 0 ? 0 : incomeShare}
          center={formatMoney(income - expense)}
          leftLabel="Toplam gelir tutarı"
          leftValue={formatMoney(income)}
          rightLabel="Toplam gider tutarı"
          rightValue={formatMoney(expense)}
          leftColor="#16a34a"
          rightColor="#dc2626"
        />
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Bugün</div>
        <ul>
          {appointments.map((item) => (
            <li key={item.id} className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm last:border-0">
              <span>{formatTime(item.starts_at)} {item.customer_name}</span>
              <span className="text-slate-500">{item.service}</span>
            </li>
          ))}
          {appointments.length === 0 ? <li className="px-4 py-6 text-sm text-slate-400">Bugün kayıt yok.</li> : null}
        </ul>
      </section>

      <div className="flex flex-wrap justify-center gap-4 py-2 text-sm font-semibold text-[#2f6bff]">
        <Link href="/panel/randevular">+ Yeni randevu</Link>
        {money ? <Link href="/panel/gelir" className="text-[#15803d]">+ Gelir ekle</Link> : null}
        {money ? <Link href="/panel/gider" className="text-[#dc2626]">+ Gider ekle</Link> : null}
      </div>
    </div>
  );
}

function StatusCard({ title, value, href, empty }: { title: string; value: string; href: string; empty: boolean }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-3 text-sm text-slate-500">{empty ? "Şu an bekleyen yok." : value}</p>
    </Link>
  );
}

function ChartCard({
  title,
  period,
  share,
  center,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  leftColor = "#f97316",
  rightColor = "#1e293b",
}: {
  title: string;
  period: string;
  share: number;
  center: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <section className="rounded-xl border border-[#eceff3] bg-white px-5 pt-4 pb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold tracking-[0.04em] text-[#344054] uppercase">{title}</h2>
        <span className="inline-flex h-8 items-center rounded-lg border border-[#e4e7ec] bg-white px-3 text-[13px] text-[#344054]">{period}</span>
      </div>
      <div
        className="relative mx-auto mt-8 h-56 w-56 rounded-full"
        style={{ background: share === 0 ? "#e7edf3" : `conic-gradient(${leftColor} 0 ${share}%, ${rightColor} ${share}% 100%)` }}
      >
        <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white px-3 text-center text-[15px] font-semibold text-[#1c2430]">
          {center}
        </div>
      </div>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-x-8 gap-y-2 text-[13px] text-[#475467]">
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: leftColor }} />
          <span>{leftLabel}: {leftValue}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: rightColor }} />
          <span>{rightLabel}: {rightValue}</span>
        </p>
      </div>
    </section>
  );
}
