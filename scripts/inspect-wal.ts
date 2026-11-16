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

function readControl(file: string) {
  const buf = fs.readFileSync(file);
  const version = buf.readUInt32LE(8);
  const catalog = buf.readUInt32LE(12);
  const state = buf.readUInt32LE(16);
  const checkpoint = buf.readBigUInt64LE(28);
  console.log(path.basename(path.dirname(file)), {
    bytes: buf.length,
    version,
    catalog,
    state,
    checkpoint: `0/${checkpoint.toString(16)}`,
  });
  return buf;
}

function findCrcOffset(buf: Buffer) {
  for (let offset = 64; offset < 512; offset += 4) {
    const stored = buf.readUInt32LE(offset);
    const calc = crc32c(buf.subarray(0, offset)) >>> 0;
    if (calc === stored) return offset;
  }
  return -1;
}

const broken = readControl(".data/esnafyo/global/pg_control");
const healthy = readControl(".data/pglite-smoke/global/pg_control");
console.log("crc offset broken", findCrcOffset(broken), "healthy", findCrcOffset(healthy));

const wal = fs.readFileSync(".data/esnafyo/pg_wal/000000010000000000000001");
const magic = wal.readUInt16LE(0);
const info = wal.readUInt16LE(2);
const pageaddr = wal.readBigUInt64LE(8);
console.log("wal", { bytes: wal.length, magic: magic.toString(16), info: info.toString(16), pageaddr: pageaddr.toString(16) });

const lsn = 0x17807e0;
const off = lsn % 0x1000000;
console.log("checkpoint bytes", wal.subarray(off, off + 64).toString("hex"));
console.log("control@32", broken.subarray(32, 160).toString("hex"));

const PAGE = 0x2000;
const SEG = 0x1000000;
let found = 0;
for (let page = 0; page < wal.length; page += PAGE) {
  const infoFlags = wal.readUInt16LE(page + 2);
  let pos = page + (infoFlags & 0x0002 ? 40 : 24);
  if (infoFlags & 0x0001) pos += wal.readUInt32LE(page + 16);
  while (pos + 24 <= page + PAGE) {
    const tot = wal.readUInt32LE(pos);
    if (tot === 0) break;
    if (tot < 24 || pos + tot > page + PAGE) break;
    const rec = wal.subarray(pos, pos + tot);
    const stored = rec.readUInt32LE(20);
    const calc = crc32c(Buffer.concat([rec.subarray(24), rec.subarray(0, 20)]));
    const infoByte = rec[16];
    const rmid = rec[17];
    const recLsn = BigInt(SEG + pos);
    if (calc === stored && rmid === 0 && (infoByte & 0xf0) <= 0x10) {
      found += 1;
      console.log("checkpoint", {
        lsn: `0/${recLsn.toString(16)}`,
        tot,
        info: infoByte.toString(16),
        prev: `0/${rec.readBigUInt64LE(8).toString(16)}`,
        hex: rec.toString("hex"),
      });
    }
    const aligned = (tot + 7) & ~7;
    if (pos + aligned >= page + PAGE) break;
    pos += aligned;
  }
}
console.log("checkpoint count", found);
