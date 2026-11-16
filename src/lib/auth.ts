import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensureSchema, query } from "@/lib/db";

const cookieName = "esnafyo_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  business_name: string;
  phone: string;
  package_name: string;
  role: string;
  created_at: string;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = Buffer.from(hash, "hex");
  const expected = scryptSync(password, salt, 64);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await ensureSchema();
  await query(
    "insert into sessions (token, user_id, expires_at) values ($1, $2, $3)",
    [token, userId, expires.toISOString()],
  );
  const jar = await cookies();
  jar.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;

  await ensureSchema();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await query("update users set role = 'admin' where lower(email) = $1", [adminEmail]);
  }
  const rows = await query<SessionUser>(
    `select users.id, users.name, users.email, users.business_name, users.phone, users.package_name, users.role, users.created_at
     from sessions
     join users on users.id = sessions.user_id
     where sessions.token = $1 and sessions.expires_at > now()`,
    [token],
  );
  return rows[0] ?? null;
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) {
    await query("delete from sessions where token = $1", [token]);
  }
  jar.delete(cookieName);
}
