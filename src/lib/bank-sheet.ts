import ExcelJS from "exceljs";
import { detectChannel } from "@/lib/bank-match";

export const bankSheetColumns = ["Tarih", "Açıklama", "Tutar", "Karşı Unvan", "IBAN", "Kanal"] as const;

export type BankSheetRow = {
  date: string;
  description: string;
  direction: "gelen" | "giden";
  amountKurus: number;
  counterparty: string;
  iban: string;
  channel: "havale" | "eft" | "pos" | "diger";
};

export async function buildBankTemplate() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Hareketler");
  sheet.columns = bankSheetColumns.map((header) => ({ header, width: Math.max(header.length + 4, 18) }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await book.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function readBankFile(file: ArrayBuffer, filename: string): Promise<{ error: string } | { rows: BankSheetRow[]; skipped: string[] }> {
  if (filename.toLowerCase().endsWith(".csv")) return readCsv(new TextDecoder("utf-8").decode(file));
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(file);
  const sheet = book.worksheets[0];
  if (!sheet) return { error: "Dosyada sayfa bulunamadı." };
  const header = Array.from({ length: sheet.getRow(1).cellCount }, (_, index) => cellText(sheet.getRow(1).getCell(index + 1).value));
  const map = headerMap(header);
  if (map.date == null || (map.amount == null && map.debit == null && map.credit == null)) {
    return { error: "Tarih ve tutar kolonları gerekli. Şablonu indirebilir ya da bankanın dökümünü kullanabilirsin." };
  }
  const rows: BankSheetRow[] = [];
  const skipped: string[] = [];
  const last = Math.min(sheet.rowCount, 2001);
  for (let index = 2; index <= last; index += 1) {
    const values = Array.from({ length: header.length }, (_, column) => sheet.getRow(index).getCell(column + 1).value);
    if (values.every((value) => cellText(value) === "")) continue;
    const parsed = parseValues(values, map);
    if (typeof parsed === "string") skipped.push(`${index}. satır: ${parsed}`);
    else rows.push(parsed);
  }
  if (sheet.rowCount > 2001) skipped.push("İlk 2000 satır alındı.");
  return { rows, skipped };
}

function readCsv(text: string): { error: string } | { rows: BankSheetRow[]; skipped: string[] } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { error: "Dosya boş." };
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitCsv(lines[0], delimiter);
  const map = headerMap(header);
  if (map.date == null || (map.amount == null && map.debit == null && map.credit == null)) {
    return { error: "Tarih ve tutar kolonları gerekli." };
  }
  const rows: BankSheetRow[] = [];
  const skipped: string[] = [];
  lines.slice(1, 2001).forEach((line, index) => {
    const parsed = parseValues(splitCsv(line, delimiter), map);
    if (typeof parsed === "string") skipped.push(`${index + 2}. satır: ${parsed}`);
    else rows.push(parsed);
  });
  return { rows, skipped };
}

function headerMap(header: string[]) {
  const keys = header.map((item) => item.trim().toLocaleLowerCase("tr"));
  const find = (...names: string[]) => keys.findIndex((item) => names.some((name) => item.includes(name)));
  const amount = keys.findIndex((item) => (item.includes("tutar") || item.includes("amount")) && !item.includes("borç") && !item.includes("borc") && !item.includes("alacak"));
  return {
    date: find("tarih", "date"),
    description: find("açıklama", "aciklama", "description"),
    amount,
    debit: find("borç", "borc"),
    credit: find("alacak"),
    name: find("karşı", "karsi", "unvan", "ad soyad"),
    iban: find("iban"),
    channel: find("kanal", "tür", "tur", "işlem tipi", "islem tipi"),
  };
}

function parseValues(values: Array<ExcelJS.CellValue | string>, map: ReturnType<typeof headerMap>): BankSheetRow | string {
  const date = dateKey(values[map.date] ?? "");
  if (!date) return "Tarih okunamadı.";
  const description = textAt(values, map.description);
  const counterparty = textAt(values, map.name);
  const iban = textAt(values, map.iban).toUpperCase();
  const channelText = textAt(values, map.channel);
  let signed: number | null = null;
  if (map.debit != null || map.credit != null) {
    const debit = moneyAt(values, map.debit);
    const credit = moneyAt(values, map.credit);
    if (debit === "invalid" || credit === "invalid") return "Tutarda virgül kullan. Örnek: 10,50";
    if ((debit ?? 0) > 0 && (credit ?? 0) > 0) return "Borç ve alacak aynı satırda dolu.";
    if ((debit ?? 0) > 0) signed = -(debit ?? 0);
    else if ((credit ?? 0) > 0) signed = credit ?? 0;
  } else {
    const amount = moneyAt(values, map.amount);
    if (amount === "invalid") return "Tutarda virgül kullan. Örnek: 10,50 veya -10,50";
    signed = amount;
  }
  if (signed == null || signed === 0) return "Tutar boş.";
  const direction = signed > 0 ? "gelen" : "giden";
  return {
    date,
    description,
    direction,
    amountKurus: Math.round(Math.abs(signed) * 100),
    counterparty,
    iban,
    channel: detectChannel(`${channelText} ${description}`),
  };
}

function textAt(values: Array<ExcelJS.CellValue | string>, index: number) {
  if (index < 0) return "";
  const value = values[index];
  return typeof value === "string" ? value.trim() : cellText(value as ExcelJS.CellValue);
}

function moneyAt(values: Array<ExcelJS.CellValue | string>, index: number): number | null | "invalid" {
  if (index < 0) return null;
  const value = values[index];
  if (typeof value === "number") return Number.isFinite(value) ? value : "invalid";
  if (value && typeof value === "object" && "result" in value) return moneyAt([value.result as ExcelJS.CellValue], 0);
  const text = typeof value === "string" ? value.trim() : cellText(value as ExcelJS.CellValue);
  if (!text) return null;
  if (text.includes(".") && !text.includes(",")) return "invalid";
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const normalized = body.includes(",") ? body.replaceAll(".", "").replace(",", ".") : body;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return "invalid";
  return negative ? -amount : amount;
}

function dateKey(value: ExcelJS.CellValue | string) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  const text = typeof value === "string" ? value.trim() : cellText(value as ExcelJS.CellValue);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const local = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (local) return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  return "";
}

function cellText(value: ExcelJS.CellValue) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text).trim();
  if (typeof value === "object" && "result" in value) return cellText(value.result as ExcelJS.CellValue);
  return "";
}

function splitCsv(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}
