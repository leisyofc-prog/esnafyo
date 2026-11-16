import ExcelJS from "exceljs";
import { normalizeCurrency } from "@/lib/currencies";

export const customerSheetColumns = [
  "Müşteri Unvanı",
  "E-Posta",
  "Cep Telefonu",
  "Diğer Erişim Bilgileri",
  "Yetkili Kişi",
  "Adres",
  "Sevk Adresi",
  "Vergi Dairesi",
  "Vergi / TC Kimlik No",
  "Vergiden Muaf",
  "Banka Bilgileri",
  "Para Birimi",
  "Açık Hesap Risk Limiti",
  "Vadesi (gün)",
  "Sabit İskonto (%)",
  "Özel Fiyat Listesi",
  "Bakiyesi",
  "Sınıflandırma 1",
  "Sınıflandırma 2",
  "Kodu",
  "Not",
] as const;

export type CustomerSheetRow = {
  name: string;
  emails: string;
  phone: string;
  otherContact: string;
  contactPerson: string;
  address: string;
  shippingAddress: string;
  taxOffice: string;
  taxNumber: string;
  taxExempt: boolean;
  bankInfo: string;
  currency: string;
  riskLimitKurus: number | null;
  dueDays: number | null;
  discountPercent: number | null;
  priceList: string;
  openingBalanceKurus: number;
  class1: string;
  class2: string;
  code: string;
  note: string;
};

export function customerNameKey(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
}

export async function buildCustomerTemplate() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Müşteriler");
  sheet.columns = customerSheetColumns.map((header) => ({ header, width: Math.max(header.length + 2, 18) }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await book.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function readCustomerSheet(file: ArrayBuffer): Promise<{ error: string } | { rows: CustomerSheetRow[]; skipped: string[] }> {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(file);
  const sheet = book.worksheets[0];
  if (!sheet) return { error: "Dosyada sayfa bulunamadı." as const };
  const header = customerSheetColumns.map((_, index) => cellText(sheet.getRow(1).getCell(index + 1).value));
  if (header.some((title, index) => title !== customerSheetColumns[index])) {
    return { error: "Şablon üzerindeki kolonlar değişmiş. İndirdiğin şablonu kullan." as const };
  }

  const rows: CustomerSheetRow[] = [];
  const skipped: string[] = [];
  const last = Math.min(sheet.rowCount, 2001);
  for (let index = 2; index <= last; index += 1) {
    const values = customerSheetColumns.map((_, column) => sheet.getRow(index).getCell(column + 1).value);
    if (values.every((value) => cellText(value) === "")) continue;
    const parsed = parseRow(values);
    if (typeof parsed === "string") skipped.push(`${index}. satır: ${parsed}`);
    else rows.push(parsed);
  }
  if (sheet.rowCount > 2001) skipped.push("İlk 2000 satır alındı. Kalan satırlar yüklenmedi.");
  return { rows, skipped };
}

function parseRow(values: ExcelJS.CellValue[]) {
  const text = values.map(cellText);
  const [name, emails, phone, otherContact, contactPerson, address, shippingAddress, taxOffice, taxNumber, taxExempt, bankInfo, currencyValue, , , , priceList, , class1, class2, code, note] = text;
  if (!name) return "Müşteri unvanı zorunlu.";
  const currency = normalizeCurrency(currencyValue);
  if (!currency) return "Para birimi TL, USD, EUR, GBP veya CHF olmalı.";
  const risk = decimal(values[12]);
  if (risk === "invalid" || (typeof risk === "number" && risk < 0)) return "Açık hesap risk limitinde kuruş ayracı virgül olmalı. Örnek: 10,50";
  const due = days(values[13]);
  if (due === "invalid") return "Vade gün sayısı sayı olmalı.";
  const discount = decimal(values[14]);
  if (discount === "invalid" || (typeof discount === "number" && (discount < 0 || discount > 100))) return "İskonto 0 ile 100 arasında olmalı. Kuruş ayracı virgül.";
  const balance = decimal(values[16]);
  if (balance === "invalid") return "Bakiyede kuruş ayracı olarak virgül kullan. Örnek: 10,50";
  const exempt = parseExempt(taxExempt);
  if (exempt === "invalid") return "Vergiden muaf alanı Evet ya da Hayır olmalı.";
  return {
    name: name.replace(/\s+/g, " "),
    emails,
    phone,
    otherContact,
    contactPerson,
    address,
    shippingAddress,
    taxOffice,
    taxNumber,
    taxExempt: exempt,
    bankInfo,
    currency,
    riskLimitKurus: risk == null ? null : Math.round(risk * 100),
    dueDays: due,
    discountPercent: discount,
    priceList,
    openingBalanceKurus: balance == null ? 0 : Math.round(balance * 100),
    class1,
    class2,
    code,
    note,
  } satisfies CustomerSheetRow;
}

function decimal(value: ExcelJS.CellValue): number | null | "invalid" {
  if (typeof value === "number") return Number.isFinite(value) ? value : "invalid";
  if (value && typeof value === "object" && "result" in value) return decimal(value.result as ExcelJS.CellValue);
  const text = cellText(value);
  if (!text) return null;
  if (text.includes(".") && !text.includes(",")) return "invalid";
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const normalized = body.includes(",") ? body.replaceAll(".", "").replace(",", ".") : body;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return "invalid";
  return negative ? -amount : amount;
}

function days(value: ExcelJS.CellValue) {
  const amount = decimal(value);
  if (amount === "invalid") return "invalid";
  if (amount == null) return null;
  if (!Number.isInteger(amount) || amount < 0) return "invalid";
  return amount;
}

function parseExempt(value: string) {
  const text = value.toLocaleLowerCase("tr");
  if (!text || text === "hayır" || text === "hayir" || text === "h" || text === "0") return false;
  if (text === "evet" || text === "e" || text === "1") return true;
  return "invalid";
}

function cellText(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (value instanceof Date) return "";
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text.trim();
  if (typeof value === "object" && "result" in value) return cellText(value.result as ExcelJS.CellValue);
  return "";
}
