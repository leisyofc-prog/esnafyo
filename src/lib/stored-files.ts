import { query } from "@/lib/db";

export const MAX_STORED_FILE_BYTES = 10 * 1024 * 1024;

export function shopLogoFileId(userId: string) {
  return `shop-logo:${userId}`;
}

export function customerPhotoFileId(userId: string, customerId: string) {
  return `customer-photo:${userId}:${customerId}`;
}

export type StoredFile = {
  mime: string;
  size: number;
  data: Buffer;
};

function asBytes(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string" && value.slice(0, 2) === "\\" + "x") return Buffer.from(value.slice(2), "hex");
  throw new Error("Geçersiz dosya verisi.");
}

export async function putStoredFile(id: string, owner: string, mime: string, data: Uint8Array) {
  const size = data.byteLength;
  if (size <= 0) return { ok: false as const, error: "empty" };
  if (size > MAX_STORED_FILE_BYTES) return { ok: false as const, error: "too-large" };
  const bytes = Buffer.from(data);
  await query(
    `insert into stored_files (id, owner, mime, size, data)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update set owner = excluded.owner, mime = excluded.mime, size = excluded.size, data = excluded.data, created_at = now()`,
    [id, owner, mime, size, bytes],
  );
  return { ok: true as const };
}

export async function getStoredFile(id: string, owner: string): Promise<StoredFile | null> {
  const rows = await query<{ mime: string; size: number | string; data: unknown }>(
    "select mime, size, data from stored_files where id = $1 and owner = $2",
    [id, owner],
  );
  const row = rows[0];
  if (!row) return null;
  return { mime: row.mime, size: Number(row.size), data: asBytes(row.data) };
}

export async function deleteStoredFile(id: string, owner: string) {
  await query("delete from stored_files where id = $1 and owner = $2", [id, owner]);
}
