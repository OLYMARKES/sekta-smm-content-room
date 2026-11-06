import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { pool } from "./lib/db";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.endsWith(".html")) return NextResponse.next();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.emailVerified) return NextResponse.redirect(new URL("/sign-in", request.url));
  const email = session.user.email.trim().toLowerCase();
  if (email !== process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) {
    const { rowCount } = await pool.query("SELECT 1 FROM team_member WHERE email=$1", [email]);
    if (!rowCount) return NextResponse.redirect(new URL("/team", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: "/editor/:path*" };
