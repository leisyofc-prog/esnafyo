import fs from "node:fs";
import path from "node:path";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0x82f63b78 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32c(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const PAGE = 0x2000;
const SEG_START = BigInt("0x1000000");
const walPath = ".data/esnafyo/pg_wal/000000010000000000000001";
const controlPath = ".data/esnafyo/global/pg_control";
const wal = fs.readFileSync(walPath);

function pageHeaderSize(page: number) {
  return wal.readUInt16LE(page + 2) & 0x0002 ? 40 : 24;
}

type RecordHit = { lsn: bigint; raw: Buffer; info: number };

function records(): RecordHit[] {
  const found: RecordHit[] = [];
  for (let page = 0; page < wal.length; page += PAGE) {
    let pos = page + pageHeaderSize(page);
    if (wal.readUInt16LE(page + 2) & 0x0001) pos += wal.readUInt32LE(page + 16);
    while (pos + 4 <= page + PAGE) {
      const tot = wal.readUInt32LE(pos);
      if (tot < 24 || tot > 1024 * 1024) break;
      const chunks: Buffer[] = [];
      let need = tot;
      let cursor = pos;
      let pageCursor = page;
      while (need > 0) {
        if (cursor >= pageCursor + PAGE) {
          pageCursor += PAGE;
          if (pageCursor >= wal.length) break;
          cursor = pageCursor + pageHeaderSize(pageCursor);
        }
        const take = Math.min(need, pageCursor + PAGE - cursor);
        chunks.push(wal.subarray(cursor, cursor + take));
        cursor += take;
        need -= take;
      }
      if (need > 0) break;
      const raw = Buffer.concat(chunks);
      const stored = raw.readUInt32LE(20);
      const calc = crc32c(Buffer.concat([raw.subarray(24), raw.subarray(0, 20)]));
      if (calc !== stored) break;
      found.push({ lsn: SEG_START + BigInt(pos), raw, info: raw[16] });
      const aligned = (tot + 7) & ~7;
      pos += aligned;
      if (pos >= page + PAGE) break;
    }
  }
  return found;
}

const all = records();
const checkpoints = all.filter((record) => record.raw[17] === 0 && (record.info & 0xf0) <= 0x10);
const last = checkpoints.at(-1);
console.log(`records ${all.length}, checkpoints ${checkpoints.length}`);
if (!last) throw new Error("No checkpoint record in WAL");
console.log(`last checkpoint 0/${last.lsn.toString(16)} info 0x${last.info.toString(16)} bytes ${last.raw.length}`);

const backup = ".data/esnafyo-backup";
fs.cpSync(".data/esnafyo", backup, { recursive: true });

const control = fs.readFileSync(controlPath);
const before = control.readBigUInt64LE(32);
control.writeBigUInt64LE(last.lsn, 32);
last.raw.subarray(26, 26 + 88).copy(control, 40);
control.writeUInt32LE(crc32c(control.subarray(0, 292)), 292);
fs.writeFileSync(controlPath, control);
console.log(`checkpoint pointer 0/${before.toString(16)} -> 0/${last.lsn.toString(16)}`);
console.log(`backup ${path.resolve(backup)}`);
