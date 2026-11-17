import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ib_admin";
const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function hmac(data: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(data).digest("base64url");
}

function sign(payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

function unsign<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(hmac(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
  if (payload.exp < Date.now() / 1000) return null;
  return payload;
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export async function startAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE;
  (await cookies()).set(ADMIN_COOKIE, sign({ admin: true, exp }), cookieOptions(ADMIN_MAX_AGE));
}

export async function isAdmin() {
  const store = await cookies();
  return Boolean(unsign<{ admin: boolean }>(store.get(ADMIN_COOKIE)?.value)?.admin);
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Não autorizado");
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export function checkAdminPassword(password: string) {
  const a = Buffer.from(hmac(password));
  const b = Buffer.from(hmac(process.env.ADMIN_PASSWORD!));
  return timingSafeEqual(a, b);
}
