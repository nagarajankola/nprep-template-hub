import { NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  if (!verifyCredentials(username, password)) {
    return NextResponse.json(
      { error: "Wrong username or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(username);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
