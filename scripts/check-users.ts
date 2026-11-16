import { PGlite } from "@electric-sql/pglite";

async function main() {
  const db = new PGlite({
    dataDir: ".data/esnafyo",
    debug: 1,
    onStderr: (text) => {
      process.stderr.write(text);
      return true;
    },
  });
  await db.waitReady;
  const users = await db.query("select email, business_name, created_at from users order by created_at");
  console.log(JSON.stringify(users.rows, null, 2));
  await db.close();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
