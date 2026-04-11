import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig request." }, { status: 400 });
  }

  const { password } = payload;

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Lösenord saknas." }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminPassword || !adminToken) {
    return NextResponse.json(
      { error: "Admin-inloggning är inte konfigurerad." },
      { status: 500 }
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Fel lösenord." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin_token", adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 timmar
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
