import { ensureSchema, query } from "../src/lib/db";

async function main() {
  await ensureSchema();
  const rows = await query<{ count: string }>("select count(*)::text as count from leads");
  console.log(`Yerel veritabanı hazır. Kayıt sayısı: ${rows[0]?.count ?? "0"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
