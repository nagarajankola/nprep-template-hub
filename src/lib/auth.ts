import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "nprep_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "dev-insecure-secret-change-me"
  );
}

export interface Session {
  sub: string;
  role: "admin";
}

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(
  token: string | undefined
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "admin") return null;
    return { sub: String(payload.sub ?? "admin"), role: "admin" };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** For server components / pages — redirects to /login when unauthenticated. */
export async function requireAdminPage(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Constant-time-ish credential check against env-configured admin login. */
export function verifyCredentials(username: string, password: string): boolean {
  const U = process.env.ADMIN_USERNAME || "admin";
  const P = process.env.ADMIN_PASSWORD || "";
  return safeEqual(username, U) && safeEqual(password, P);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
