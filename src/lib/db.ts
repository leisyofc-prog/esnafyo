import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  pglite?: PGlite;
  opening?: Promise<PGlite>;
  postgres?: Sql;
};

async function openPglite() {
  const dataDir = path.join(process.cwd(), ".data", "esnafyo");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  try {
    await db.waitReady;
  } catch (error) {
    await db.close().catch(() => undefined);
    throw error;
  }
  return db;
}

async function client() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    globalForDb.postgres ??= postgres(databaseUrl, { max: 5 });
    return { kind: "postgres" as const, sql: globalForDb.postgres };
  }

  if (!globalForDb.pglite) {
    globalForDb.opening ??= openPglite()
      .then((db) => {
        globalForDb.pglite = db;
        return db;
      })
      .finally(() => {
        globalForDb.opening = undefined;
      });
    await globalForDb.opening;
  }

  return { kind: "pglite" as const, db: globalForDb.pglite! };
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await client();

  if (db.kind === "postgres") {
    return (await db.sql.unsafe(text, params as never[])) as unknown as T[];
  }

  const result = await db.db.query<T>(text, params).catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Aborted") || message.includes("closed")) {
      await globalForDb.pglite?.close().catch(() => undefined);
      globalForDb.pglite = undefined;
    }
    throw error;
  });
  return result.rows;
}

export async function ensureSchema() {
  await query(`
    create table if not exists leads (
      id text primary key,
      name text not null,
      business_name text not null,
      sector text not null,
      phone text not null,
      message text not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists users (
      id text primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      business_name text not null,
      phone text not null,
      package_name text not null,
      role text not null default 'esnaf',
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists sessions (
      token text primary key,
      user_id text not null references users(id),
      expires_at timestamptz not null
    )
  `);
  await query(`
    create table if not exists shop_settings (
      user_id text primary key references users(id),
      open_time text not null default '09:00',
      close_time text not null default '19:00',
      closed_days text not null default 'Pazar',
      reminder_whatsapp boolean not null default true,
      reminder_sms boolean not null default false,
      card_label text not null default '',
      headline text not null default '',
      about text not null default '',
      price_note text not null default '',
      campaign text not null default '',
      public_slug text not null
    )
  `);
  await query("alter table shop_settings alter column card_label set default ''");
  await query("alter table shop_settings add column if not exists address text not null default ''");
  await query("alter table shop_settings add column if not exists bank_info text not null default ''");
  await query("alter table shop_settings add column if not exists logo_path text not null default ''");
  await query("alter table shop_settings add column if not exists tax_office text not null default ''");
  await query("alter table shop_settings add column if not exists tax_number text not null default ''");
  await query("alter table shop_settings add column if not exists notify_appointment boolean not null default true");
  await query("alter table shop_settings add column if not exists notify_money boolean not null default true");
  await query("alter table shop_settings add column if not exists notify_expense boolean not null default true");
  await query("alter table shop_settings add column if not exists notify_credit boolean not null default true");
  await query("alter table shop_settings add column if not exists notify_subscription boolean not null default true");
  await query(`
    create table if not exists staff (
      id text primary key,
      user_id text not null references users(id),
      name text not null,
      available boolean not null default true
    )
  `);
  await query(`
    create table if not exists appointments (
      id text primary key,
      user_id text not null references users(id),
      customer_name text not null,
      phone text not null,
      service text not null,
      staff_name text not null,
      starts_at timestamptz not null,
      status text not null
    )
  `);
  await query(`
    create table if not exists orders (
      id text primary key,
      user_id text not null references users(id),
      customer_name text not null,
      summary text not null,
      total_label text not null,
      status text not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists products (
      id text primary key,
      user_id text not null references users(id),
      name text not null,
      price_label text not null,
      in_stock boolean not null default true
    )
  `);
  await query(`
    create table if not exists conversations (
      id text primary key,
      user_id text not null references users(id),
      channel text not null,
      customer_name text not null,
      question text not null,
      answer text not null,
      taken_over boolean not null default false,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists knowledge (
      id text primary key,
      user_id text not null references users(id),
      kind text not null,
      title text not null,
      body text not null
    )
  `);
  await query(`
    create table if not exists customers (
      id text primary key,
      user_id text not null references users(id),
      name text not null,
      phone text not null,
      last_visit date not null,
      visit_count integer not null default 1,
      note text not null default '',
      marketing_ok boolean not null default false
    )
  `);
  const customerColumns = [
    "emails text not null default ''",
    "other_contact text not null default ''",
    "contact_person text not null default ''",
    "address text not null default ''",
    "shipping_address text not null default ''",
    "tax_office text not null default ''",
    "tax_number text not null default ''",
    "tax_exempt boolean not null default false",
    "bank_info text not null default ''",
    "currency text not null default 'TL'",
    "risk_limit_kurus integer",
    "due_days integer",
    "discount_percent numeric(5,2)",
    "price_list text not null default ''",
    "opening_balance_kurus integer not null default 0",
    "class1 text not null default ''",
    "class2 text not null default ''",
    "code text not null default ''",
    "staff_ids text not null default ''",
    "image_path text not null default ''",
  ];
  for (const column of customerColumns) {
    await query(`alter table customers add column if not exists ${column}`);
  }
  await query(`
    create table if not exists customer_branches (
      id text primary key,
      user_id text not null references users(id),
      customer_id text not null references customers(id) on delete cascade,
      name text not null,
      address text not null default '',
      code text not null default ''
    )
  `);
  await query(`
    create table if not exists finance_accounts (
      id text primary key,
      user_id text not null references users(id),
      kind text not null,
      name text not null,
      currency text not null default 'TL',
      balance_kurus integer not null default 0,
      detail text not null default ''
    )
  `);
  await query(`
    create table if not exists suppliers (
      id text primary key,
      user_id text not null references users(id),
      name text not null,
      tax_office text not null default '',
      tax_number text not null default '',
      tax_exempt boolean not null default false,
      bank_info text not null default '',
      currency text not null default 'TL',
      due_days integer,
      opening_balance_kurus integer not null default 0,
      contact_person text not null default '',
      emails text not null default '',
      address text not null default '',
      phone text not null default '',
      other_contact text not null default '',
      class1 text not null default '',
      class2 text not null default '',
      code text not null default '',
      note text not null default ''
    )
  `);
  await query(`
    create table if not exists campaigns (
      id text primary key,
      user_id text not null references users(id),
      body text not null,
      recipient_count integer not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists reviews (
      id text primary key,
      user_id text not null references users(id),
      author text not null,
      rating integer not null,
      body text not null,
      suggestion text not null,
      replied boolean not null default false
    )
  `);
  await query(`
    create table if not exists ledger (
      id text primary key,
      user_id text not null references users(id),
      kind text not null,
      title text not null,
      amount_kurus integer not null,
      happened_on date not null,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists credits (
      id text primary key,
      user_id text not null references users(id),
      name text not null,
      remaining_kurus integer not null,
      remaining_installments integer not null,
      next_due date not null,
      schedule text not null,
      account_id text not null references finance_accounts(id),
      note text not null default ''
    )
  `);
  await query(`
    create table if not exists masraflar (
      id text primary key,
      user_id text not null references users(id),
      category text not null,
      happened_on date not null,
      document_no text not null default '',
      description text not null default '',
      status text not null,
      account_id text references finance_accounts(id),
      amount_kurus integer not null,
      vat_rate integer not null default 0,
      ledger_id text,
      series_id text,
      repeat_until date,
      repeat_day integer
    )
  `);
  await query(`
    create table if not exists sales (
      id text primary key,
      user_id text not null references users(id),
      title text not null,
      customer_id text references customers(id),
      customer_name text not null,
      happened_on date not null,
      currency text not null,
      status text not null,
      account_id text references finance_accounts(id),
      net_kurus integer not null,
      vat_kurus integer not null,
      total_kurus integer not null,
      ledger_id text
    )
  `);
  await query(`
    create table if not exists sale_lines (
      id text primary key,
      sale_id text not null references sales(id),
      user_id text not null references users(id),
      name text not null,
      qty numeric not null,
      unit_kurus integer not null,
      vat_rate integer not null,
      vat_kurus integer not null,
      total_kurus integer not null
    )
  `);
  await query(`
    create table if not exists bank_connections (
      id text primary key,
      user_id text not null references users(id),
      bank_name text not null,
      iban text not null default '',
      account_id text not null references finance_accounts(id),
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists bank_movements (
      id text primary key,
      user_id text not null references users(id),
      connection_id text not null references bank_connections(id),
      happened_on date not null,
      direction text not null,
      channel text not null,
      amount_kurus integer not null,
      counterparty_name text not null default '',
      counterparty_iban text not null default '',
      description text not null default '',
      match_kind text,
      match_id text,
      match_name text not null default '',
      status text not null,
      ledger_id text,
      fingerprint text not null,
      unique (user_id, fingerprint)
    )
  `);
  await query("alter table users add column if not exists role text not null default 'esnaf'");
  await query(`
    create table if not exists activity_logs (
      id text primary key,
      user_id text,
      area text not null,
      action text not null,
      detail text not null,
      created_at timestamptz not null default now()
    )
  `);
  await query("alter table appointments add column if not exists customer_id text references customers(id)");
  await query(`
    create table if not exists announcements (
      id text primary key,
      title text not null,
      body text not null default '',
      happened_on date not null,
      kind text not null,
      href text not null default '',
      link_label text not null default '',
      created_at timestamptz not null default now()
    )
  `);
  await query("alter table ledger add column if not exists account_id text references finance_accounts(id)");
  await query("alter table credits add column if not exists minimum_kurus integer");
  await query("alter table credits add column if not exists period_kurus integer");
  await query("alter table credits add column if not exists kind text not null default 'taksitli'");
  await query("alter table ledger add column if not exists credit_id text references credits(id)");
  await query("alter table ledger add column if not exists credit_payment text");
  await query("alter table ledger add column if not exists customer_id text references customers(id) on delete set null");
  await query("alter table ledger add column if not exists supplier_id text references suppliers(id) on delete set null");
  await query("alter table products add column if not exists price_kurus integer not null default 0");
  await query("alter table products add column if not exists vat_rate integer not null default 20");
  await query(`
    create table if not exists user_flags (
      user_id text not null references users(id),
      flag text not null,
      primary key (user_id, flag)
    )
  `);
  await query(`
    create table if not exists invoices (
      id text primary key,
      user_id text not null references users(id),
      period_label text not null,
      amount_label text not null,
      status text not null
    )
  `);
  await query(`
    create table if not exists stored_files (
      id text primary key,
      owner text not null references users(id) on delete cascade,
      mime text not null,
      size integer not null,
      data bytea not null,
      created_at timestamptz not null default now()
    )
  `);
}
