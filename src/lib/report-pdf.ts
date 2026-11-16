import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { moneyText, sumByCurrency, type MonthlyReport, type MoneyLine } from "@/lib/report";

export async function renderReportPdf(report: MonthlyReport) {
  const font = await readFile(path.join(process.cwd(), "assets", "Nunito-ExtraBold.ttf"));
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.registerFont("Nunito", font);
  doc.font("Nunito");
  const done = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.rect(0, 0, doc.page.width, 92).fill("#0f2744");
  doc.fillColor("#ffffff").fontSize(20).text("Esnafyo", 40, 28);
  doc.fontSize(11).fillColor("#fdba74").text(report.business || report.owner, 40, 54);
  doc.fillColor("#ffffff").fontSize(12).text(`${report.label} raporu`, 300, 36, { width: 255, align: "right" });
  doc.fontSize(9).fillColor("#cbd5e1").text("Kayıtlardan üretildi", 300, 56, { width: 255, align: "right" });
  doc.fillColor("#0f2744");
  doc.y = 112;

  const incomeTl = tl(report.income);
  const expenseTl = tl(report.expense);
  summaryRow(doc, [
    ["Gelir", moneyText(incomeTl), "#15803d"],
    ["Gider", moneyText(expenseTl), "#dc2626"],
    ["Net", moneyText(incomeTl - expenseTl), "#0f2744"],
    ["Randevu", String(report.appointments.filter((item) => item.status !== "İptal").length), "#c2410c"],
  ]);
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor("#64748b").text(`Geçen ay ${moneyText(report.lastIncomeTl)} gelir, ${moneyText(report.lastExpenseTl)} gider, ${report.lastAppointmentCount} randevu.`);
  otherCurrencies(doc, report);
  doc.moveDown(0.8);

  section(doc, "Gelirler", report.income, (item) => [showDate(item.date), item.title, item.detail || "—", moneyText(item.amountKurus, item.currency)], ["Tarih", "Kayıt", "Hesap", "Tutar"]);
  section(doc, "Giderler", report.expense, (item) => [showDate(item.date), item.title, item.detail || "—", moneyText(item.amountKurus, item.currency)], ["Tarih", "Kayıt", "Hesap", "Tutar"]);
  section(doc, "Satış makbuzları", report.sales, (item) => [showDate(item.date), item.title, item.customer, `${item.status} · ${moneyText(item.amountKurus, item.currency)}`], ["Tarih", "Makbuz", "Müşteri", "Durum"]);
  section(doc, "Masraflar", report.expenses, (item) => [showDate(item.date), item.category, item.description || "—", `${item.status} · ${moneyText(item.amountKurus)}`], ["Tarih", "Kalem", "Açıklama", "Durum"]);
  section(doc, "Randevular", report.appointments, (item) => [item.date, item.customer, item.service, item.status], ["Zaman", "Müşteri", "Hizmet", "Durum"]);
  section(doc, "Açık krediler", report.credits, (item) => [item.name, showDate(item.nextDue), `${item.installments} taksit`, moneyText(item.remainingKurus, item.currency)], ["Kredi", "Sıradaki tarih", "Kalan", "Borç"]);
  section(doc, "Hesap bakiyeleri", report.accounts, (item) => [item.name, item.kind, item.currency, moneyText(item.balanceKurus, item.currency)], ["Hesap", "Tür", "Birim", "Bakiye"]);

  doc.end();
  return done;
}

function tl(lines: MoneyLine[]) {
  return lines.filter((item) => item.currency === "TL").reduce((sum, item) => sum + item.amountKurus, 0);
}

function otherCurrencies(doc: PDFKit.PDFDocument, report: MonthlyReport) {
  const income = sumByCurrency(report.income).filter((item) => item.currency !== "TL");
  const expense = sumByCurrency(report.expense).filter((item) => item.currency !== "TL");
  if (income.length === 0 && expense.length === 0) return;
  const parts = [
    ...income.map((item) => `gelir ${moneyText(item.kurus, item.currency)}`),
    ...expense.map((item) => `gider ${moneyText(item.kurus, item.currency)}`),
  ];
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor("#64748b").text(`Diğer para birimleri: ${parts.join(", ")}`);
}

function summaryRow(doc: PDFKit.PDFDocument, cells: [string, string, string][]) {
  const width = (doc.page.width - 80 - 18) / 4;
  const y = doc.y;
  cells.forEach(([label, value, color], index) => {
    const x = 40 + index * (width + 6);
    doc.roundedRect(x, y, width, 52, 6).fill("#f8fafc");
    doc.fillColor("#64748b").fontSize(8).text(label, x + 8, y + 8, { width: width - 16 });
    doc.fillColor(color).fontSize(11).text(value, x + 8, y + 24, { width: width - 16 });
  });
  doc.y = y + 64;
  doc.fillColor("#0f2744");
}

function section<T>(doc: PDFKit.PDFDocument, title: string, rows: T[], map: (row: T) => string[], headers: string[]) {
  ensureSpace(doc, 70);
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor("#0f2744").text(title);
  doc.moveDown(0.3);
  if (rows.length === 0) {
    doc.fontSize(9).fillColor("#94a3b8").text("Bu bölümde kayıt yok.");
    return;
  }
  table(doc, headers, rows.slice(0, 80).map(map));
  if (rows.length > 80) doc.fontSize(8).fillColor("#94a3b8").text(`İlk 80 kayıt yazıldı. Toplam ${rows.length}.`);
}

function table(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
  const widths = [90, 150, 140, 135];
  drawRow(doc, headers, widths, true);
  for (const row of rows) drawRow(doc, row, widths, false);
}

function drawRow(doc: PDFKit.PDFDocument, cells: string[], widths: number[], header: boolean) {
  ensureSpace(doc, 22);
  const y = doc.y;
  let x = 40;
  if (header) doc.rect(40, y - 2, 515, 16).fill("#fff7ed");
  cells.forEach((cell, index) => {
    doc.fillColor(header ? "#c2410c" : "#1e293b").fontSize(8).text(cell, x, y, { width: widths[index] - 6, height: 12, ellipsis: true });
    x += widths[index];
  });
  doc.y = y + 16;
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height < doc.page.height - 40) return;
  doc.addPage();
  doc.y = 40;
}

function showDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
