import { NextResponse } from "next/server";
import { checkPin, createSessionToken, SESSION_COOKIE } from "../../../lib/auth";

export async function POST(req) {
  const { pin } = await req.json();
  if (!checkPin(pin)) {
    return NextResponse.json({ error: "invalid pin" }, { status: 401 });
  }
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
