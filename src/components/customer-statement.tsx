"use client";

import { useState } from "react";
import Link from "next/link";
import { addCustomerPayment } from "@/app/panel/actions";
import type { CustomerStatement } from "@/lib/panel";

type AccountOption = { id: string; name: string; currency: string; kind: string };

export function CustomerStatementBoard({
  statement,
  accounts,
  today,
}: {
  statement: CustomerStatement;
  accounts: AccountOption[];
  today: string;
}) {
  const [openPay, setOpenPay] = useState(false);
  const { customer, currency, currentBalanceKurus, movements } = statement;

  const isDebtor = currentBalanceKurus > 0;
  const isCreditor = currentBalanceKurus < 0;

  const matchingAccounts = accounts.filter((item) => item.currency === currency || item.currency === "TL");

  return (
    <section className="space-y-4">
      {/* Top summary card */}
      <div className="rounded-xl border border-[#eceff3] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold">Cari Hesap ve Veresiye Durumu</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isDebtor
                    ? "bg-[#fef2f2] text-[#dc2626]"
                    : isCreditor
                    ? "bg-[#ecfdf3] text-[#15803d]"
                    : "bg-[#f4f6f8] text-[#475467]"
                }`}
              >
                {isDebtor ? "Borçlu (Veresiye)" : isCreditor ? "Alacaklı (Avans)" : "Borç Yok"}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#98a2b3]">
              Müşterinin geçmiş satışları, tahsilatları ve güncel cari bakiyesi burada takip edilir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenPay((value) => !value)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#16a34a] px-3.5 text-[13px] font-semibold text-white hover:bg-[#15803d]"
          >
            <span>+</span> Tahsilat Al
          </button>
        </div>

        {/* Balance metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#f2f4f7] bg-[#f8fafc] p-3">
            <span className="block text-[11px] font-medium text-[#98a2b3]">GÜNCEL BAKİYE</span>
            <span
              className={`mt-1 block text-[18px] font-semibold ${
                isDebtor ? "text-[#dc2626]" : isCreditor ? "text-[#15803d]" : "text-[#1c2430]"
              }`}
            >
              {money(currentBalanceKurus)} {currency}
            </span>
          </div>
          <div className="rounded-lg border border-[#f2f4f7] bg-[#f8fafc] p-3">
            <span className="block text-[11px] font-medium text-[#98a2b3]">TOPLAM SATIŞ</span>
            <span className="mt-1 block text-[16px] font-semibold text-[#1c2430]">
              {money(statement.totalSalesKurus)} {currency}
            </span>
          </div>
          <div className="rounded-lg border border-[#f2f4f7] bg-[#f8fafc] p-3">
            <span className="block text-[11px] font-medium text-[#98a2b3]">TOPLAM TAHSİLAT</span>
            <span className="mt-1 block text-[16px] font-semibold text-[#15803d]">
              {money(statement.totalPaidKurus)} {currency}
            </span>
          </div>
          <div className="rounded-lg border border-[#f2f4f7] bg-[#f8fafc] p-3">
            <span className="block text-[11px] font-medium text-[#98a2b3]">AÇILIŞ BAKİYESİ</span>
            <span className="mt-1 block text-[16px] font-semibold text-[#475467]">
              {money(statement.openingBalanceKurus)} {currency}
            </span>
          </div>
        </div>

        {customer.risk_limit_kurus ? (
          <p className="mt-3 text-[12px] text-[#98a2b3]">
            Açık hesap risk limiti: <strong className="text-[#1c2430]">{money(customer.risk_limit_kurus)} {currency}</strong>
            {isDebtor && customer.risk_limit_kurus > currentBalanceKurus
              ? ` (Kalan kullanılabilir limit: ${money(customer.risk_limit_kurus - currentBalanceKurus)} ${currency})`
              : null}
          </p>
        ) : null}

        {/* Payment form */}
        {openPay ? (
          <form action={addCustomerPayment} className="mt-4 rounded-xl border border-[#e4e7ec] bg-[#fffaf5] p-4">
            <input type="hidden" name="customer" value={customer.id} />
            <h3 className="text-[14px] font-semibold text-[#c2410c]">Cari Tahsilat Girişi</h3>
            <p className="mt-0.5 text-[12px] text-[#98a2b3]">Müşteriden aldığınız ödemeyi işleyin; seçtiğiniz hesaba gelir olarak kaydedilir.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <label className="text-[12px] font-semibold text-[#475467]">
                Tahsil Edilen Tutar
                <input
                  name="amount"
                  required
                  inputMode="decimal"
                  defaultValue={isDebtor ? (currentBalanceKurus / 100).toLocaleString("tr-TR") : ""}
                  placeholder="Örn. 500,00"
                  className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 font-normal text-[13px]"
                />
              </label>
              <label className="text-[12px] font-semibold text-[#475467]">
                Tahsilat Hesabı
                <select name="account" required defaultValue="" className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-2 font-normal text-[13px]">
                  <option value="" disabled>Hesap seçin</option>
                  {matchingAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[12px] font-semibold text-[#475467]">
                Tarih
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={today}
                  className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 font-normal text-[13px]"
                />
              </label>
              <label className="text-[12px] font-semibold text-[#475467]">
                Açıklama / Not
                <input
                  name="note"
                  placeholder="Örn. Kısmi ödeme, elden nakit"
                  className="mt-1 h-9 w-full rounded-lg border border-[#e4e7ec] bg-white px-3 font-normal text-[13px]"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenPay(false)}
                className="h-8 rounded-lg border border-[#e4e7ec] bg-white px-3 text-[12px] font-semibold text-[#475467]"
              >
                Vazgeç
              </button>
              <button className="h-8 rounded-lg bg-[#16a34a] px-4 text-[12px] font-semibold text-white hover:bg-[#15803d]">
                Tahsilatı Kaydet
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Cari Movements Table */}
      <div className="overflow-hidden rounded-xl border border-[#eceff3] bg-white">
        <div className="flex items-center justify-between border-b border-[#f2f4f7] px-5 py-3">
          <h3 className="text-[14px] font-semibold">Cari Hesap Ekstresi (Hareketler)</h3>
          <span className="text-[12px] text-[#98a2b3]">{movements.length} işlem kaydı</span>
        </div>

        {movements.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-[#98a2b3]">Henüz cari işlem kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-[#98a2b3]">
                <tr>
                  <th className="px-4 py-2.5">Tarih</th>
                  <th className="px-4 py-2.5">İşlem Türü</th>
                  <th className="px-4 py-2.5">Açıklama / Belge</th>
                  <th className="px-4 py-2.5 text-right">Borç (+)</th>
                  <th className="px-4 py-2.5 text-right">Alacak (-)</th>
                  <th className="px-4 py-2.5 text-right">Bakiye</th>
                  <th className="px-4 py-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f7]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#fcfdfd]">
                    <td className="px-4 py-2.5 text-[#475467] whitespace-nowrap">{m.date ? showDate(m.date) : "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${
                          m.kind === "satis"
                            ? "bg-[#fff1e6] text-[#c2410c]"
                            : m.kind === "tahsilat"
                            ? "bg-[#ecfdf3] text-[#15803d]"
                            : "bg-[#f4f6f8] text-[#475467]"
                        }`}
                      >
                        {m.kindLabel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-[#1c2430]">{m.title}</span>
                      {m.accountName ? <span className="ml-1.5 text-[11px] text-[#98a2b3]">({m.accountName})</span> : null}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#dc2626] whitespace-nowrap">
                      {m.debitKurus > 0 ? `${money(m.debitKurus)} ${currency}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#15803d] whitespace-nowrap">
                      {m.creditKurus > 0 ? `${money(m.creditKurus)} ${currency}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                      <span className={m.balanceKurus > 0 ? "text-[#dc2626]" : m.balanceKurus < 0 ? "text-[#15803d]" : "text-[#475467]"}>
                        {money(m.balanceKurus)} {currency}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {m.saleId ? (
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`/api/satis-makbuz/${m.saleId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-[#0f2744] hover:underline"
                            title="Makbuzu Yazdır / PDF"
                          >
                            PDF
                          </a>
                        </div>
                      ) : (
                        <span className="text-[#cbd5e1]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function money(kurus: number) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
}

function showDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
