import ExcelJS from "exceljs";
import { normalizeCurrency } from "@/lib/currencies";

export const supplierSheetColumns = [
  "Tedarikçi Unvanı",
  "Vergi Dairesi",
  "Vergi / TC Kimlik No",
  "Vergiden Muaf",
  "Banka Bilgileri",
  "Para Birimi",
  "Vade (gün)",
  "Bakiyesi",
  "Yetkili Kişi",
  "E-Posta",
  "Adres",
  "Telefon",
  "Diğer Erişim Bilgileri",
  "Sınıflandırma 1",
  "Sınıflandırma 2",
  "Kodu",
  "Not",
] as const;

export type SupplierSheetRow = {
  name: string;
  taxOffice: string;
  taxNumber: string;
  taxExempt: boolean;
  bankInfo: string;
  currency: string;
  dueDays: number | null;
  openingBalanceKurus: number;
  contactPerson: string;
  emails: string;
  address: string;
  phone: string;
  otherContact: string;
  class1: string;
  class2: string;
  code: string;
  note: string;
};

export async function buildSupplierTemplate() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Tedarikçiler");
  sheet.columns = supplierSheetColumns.map((header) => ({ header, width: Math.max(header.length + 2, 18) }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await book.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function readSupplierSheet(file: ArrayBuffer): Promise<{ error: string } | { rows: SupplierSheetRow[]; skipped: string[] }> {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(file);
  const sheet = book.worksheets[0];
  if (!sheet) return { error: "Dosyada sayfa bulunamadı." };
  const header = supplierSheetColumns.map((_, index) => cellText(sheet.getRow(1).getCell(index + 1).value));
  if (header.some((title, index) => title !== supplierSheetColumns[index])) {
    return { error: "Şablon üzerindeki kolonlar değişmiş. İndirdiğin şablonu kullan." };
  }

  const rows: SupplierSheetRow[] = [];
  const skipped: string[] = [];
  const last = Math.min(sheet.rowCount, 2001);
  for (let index = 2; index <= last; index += 1) {
    const values = supplierSheetColumns.map((_, column) => sheet.getRow(index).getCell(column + 1).value);
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
  const [name, taxOffice, taxNumber, taxExempt, bankInfo, currencyValue, , , contactPerson, emails, address, phone, otherContact, class1, class2, code, note] = text;
  if (!name) return "Tedarikçi unvanı zorunlu.";
  const currency = normalizeCurrency(currencyValue);
  if (!currency) return "Para birimi TL, USD, EUR, GBP veya CHF olmalı.";
  const due = days(values[6]);
  if (due === "invalid") return "Vade gün sayısı sayı olmalı.";
  const balance = decimal(values[7]);
  if (balance === "invalid") return "Bakiyede kuruş ayracı olarak virgül kullan. Örnek: 10,50";
  const exempt = parseExempt(taxExempt);
  if (exempt === "invalid") return "Vergiden muaf alanı Evet ya da Hayır olmalı.";
  return {
    name: name.replace(/\s+/g, " "),
    taxOffice,
    taxNumber,
    taxExempt: exempt,
    bankInfo,
    currency,
    dueDays: due,
    openingBalanceKurus: balance == null ? 0 : Math.round(balance * 100),
    contactPerson,
    emails,
    address,
    phone,
    otherContact,
    class1,
    class2,
    code,
    note,
  } satisfies SupplierSheetRow;
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
