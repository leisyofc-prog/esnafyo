import { readFile } from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { Sale } from "@/lib/panel";

type SaleShopInfo = {
  businessName: string;
  phone: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  bankInfo: string;
};

type SaleCustomerInfo = {
  name: string;
  phone: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
};

export async function renderSalePdf(
  sale: Sale,
  shop: SaleShopInfo,
  customer?: SaleCustomerInfo | null,
) {
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

  // Top header banner (Deep Navy)
  doc.rect(0, 0, doc.page.width, 96).fill("#0f2744");

  // Logo / Shop title
  doc.fillColor("#ffffff").fontSize(20).text("Esnafyo", 40, 26);
  doc.fontSize(11).fillColor("#fdba74").text(shop.businessName || "İşletme Satış Makbuzu", 40, 52);

  // Right header: Document Title & Meta
  doc.fillColor("#ffffff").fontSize(13).text("SATIŞ MAKBUZU / FİŞ", 300, 26, { width: 255, align: "right" });
  doc.fontSize(9).fillColor("#cbd5e1").text(`Makbuz No: #${sale.id.slice(0, 8).toUpperCase()}`, 300, 46, { width: 255, align: "right" });
  doc.fontSize(9).fillColor("#cbd5e1").text(`Tarih: ${showDate(sale.date)}`, 300, 60, { width: 255, align: "right" });

  doc.y = 114;

  // Two column info box: Seller on left, Customer on right
  const boxY = doc.y;
  const colWidth = 245;

  // Left: Seller Info
  doc.roundedRect(40, boxY, colWidth, 76, 6).fill("#f8fafc");
  doc.fillColor("#0f2744").fontSize(9).text("DÜKKÂN BİLGİLERİ", 50, boxY + 8);
  doc.fillColor("#475467").fontSize(8.5);
  doc.text(shop.businessName || "—", 50, boxY + 22, { width: colWidth - 20, height: 11, ellipsis: true });
  if (shop.phone) doc.text(`Tel: ${shop.phone}`, 50, boxY + 34, { width: colWidth - 20 });
  if (shop.address) doc.text(shop.address, 50, boxY + 46, { width: colWidth - 20, height: 11, ellipsis: true });
  if (shop.taxNumber) doc.text(`VD/TC: ${shop.taxOffice} - ${shop.taxNumber}`, 50, boxY + 58, { width: colWidth - 20, height: 11, ellipsis: true });

  // Right: Customer Info
  const rightX = 40 + colWidth + 25;
  doc.roundedRect(rightX, boxY, colWidth, 76, 6).fill("#f8fafc");
  doc.fillColor("#0f2744").fontSize(9).text("MÜŞTERİ BİLGİLERİ", rightX + 10, boxY + 8);
  doc.fillColor("#475467").fontSize(8.5);
  doc.text(sale.customerName || "—", rightX + 10, boxY + 22, { width: colWidth - 20, height: 11, ellipsis: true });
  const custPhone = customer?.phone || sale.customerPhone;
  if (custPhone) doc.text(`Tel: ${custPhone}`, rightX + 10, boxY + 34, { width: colWidth - 20 });
  if (customer?.address) doc.text(customer.address, rightX + 10, boxY + 46, { width: colWidth - 20, height: 11, ellipsis: true });
  if (customer?.taxNumber) doc.text(`VD/TC: ${customer.taxOffice || ""} - ${customer.taxNumber}`, rightX + 10, boxY + 58, { width: colWidth - 20, height: 11, ellipsis: true });

  doc.y = boxY + 92;

  // Section title
  doc.fillColor("#0f2744").fontSize(11).text(`Makbuz Başlığı: ${sale.title}`);
  doc.moveDown(0.4);

  // Table header
  const tableWidths = [28, 220, 55, 75, 45, 92]; // Total: 515
  const headers = ["#", "Hizmet / Ürün", "Adet", "Birim Fiyat", "KDV", "Tutar"];
  drawRow(doc, headers, tableWidths, true);

  // Table rows
  sale.lines.forEach((line, index) => {
    const row = [
      String(index + 1),
      line.name,
      String(line.qty),
      moneyText(line.unitKurus, sale.currency),
      `%${line.vatRate}`,
      moneyText(line.totalKurus, sale.currency),
    ];
    drawRow(doc, row, tableWidths, false);
  });

  doc.moveDown(0.8);

  // Totals & Status summary
  const totalBoxY = doc.y;
  const totalBoxWidth = 230;
  const totalBoxX = doc.page.width - 40 - totalBoxWidth;

  // Payment status badge on the left
  const isPaid = sale.status === "tahsil";
  const statusColor = isPaid ? "#15803d" : "#c2410c";
  const statusBg = isPaid ? "#ecfdf3" : "#fff7ed";
  const statusLabel = isPaid ? "Tahsil Edildi" : "Tahsil Edilecek (Açık Hesap / Veresiye)";

  doc.roundedRect(40, totalBoxY, 240, 58, 6).fill(statusBg);
  doc.fillColor(statusColor).fontSize(8.5).text("TAHSİLAT DURUMU", 50, totalBoxY + 8);
  doc.fillColor(statusColor).fontSize(11).text(statusLabel, 50, totalBoxY + 22);
  if (sale.accountName && isPaid) {
    doc.fillColor("#475467").fontSize(8.5).text(`Tahsil Hesabı: ${sale.accountName}`, 50, totalBoxY + 40);
  }

  // Totals block on the right
  doc.roundedRect(totalBoxX, totalBoxY, totalBoxWidth, 78, 6).fill("#f8fafc");

  doc.fillColor("#64748b").fontSize(9).text("Ara Toplam:", totalBoxX + 12, totalBoxY + 10);
  doc.fillColor("#1e293b").fontSize(9).text(moneyText(sale.netKurus, sale.currency), totalBoxX + 110, totalBoxY + 10, { width: totalBoxWidth - 122, align: "right" });

  doc.fillColor("#64748b").fontSize(9).text("KDV Toplamı:", totalBoxX + 12, totalBoxY + 26);
  doc.fillColor("#1e293b").fontSize(9).text(moneyText(sale.vatKurus, sale.currency), totalBoxX + 110, totalBoxY + 26, { width: totalBoxWidth - 122, align: "right" });

  doc.rect(totalBoxX + 10, totalBoxY + 44, totalBoxWidth - 20, 1).fill("#e2e8f0");

  doc.fillColor("#0f2744").fontSize(11).text("GENEL TOPLAM:", totalBoxX + 12, totalBoxY + 54);
  doc.fillColor("#0f2744").fontSize(12).text(moneyText(sale.totalKurus, sale.currency), totalBoxX + 100, totalBoxY + 53, { width: totalBoxWidth - 112, align: "right" });

  // Footer notes
  doc.y = totalBoxY + 110;
  if (shop.bankInfo) {
    doc.fillColor("#64748b").fontSize(8).text(`Banka / IBAN: ${shop.bankInfo}`);
    doc.moveDown(0.3);
  }
  doc.fillColor("#94a3b8").fontSize(8).text("Bu belge Esnafyo sistemi üzerinden üretilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.");

  doc.end();
  return done;
}

function drawRow(doc: PDFKit.PDFDocument, cells: string[], widths: number[], header: boolean) {
  const y = doc.y;
  let x = 40;
  const height = header ? 20 : 18;
  if (header) {
    doc.rect(40, y - 2, 515, height).fill("#0f2744");
  } else {
    doc.rect(40, y - 2, 515, height).fill(y % 36 < 18 ? "#ffffff" : "#f8fafc");
  }

  cells.forEach((cell, index) => {
    const align = index >= 2 ? "right" : "left";
    doc
      .fillColor(header ? "#ffffff" : "#1e293b")
      .fontSize(8.5)
      .text(cell, x + 4, y + 2, { width: widths[index] - 8, height: 12, align, ellipsis: true });
    x += widths[index];
  });

  doc.y = y + height;
}

function moneyText(kurus: number, currency = "TL") {
  const text = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100);
  return `${text} ${currency}`;
}

function showDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}
