import { headers } from "next/headers";
import { auth } from "./auth";
import { pool } from "./db";

export type Role = "owner" | "admin" | "editor" | "reviewer" | "viewer";
export type Actor = { email: string; name: string; role: Role };

export async function actor(): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email || !session.user.emailVerified) return null;
  const email = session.user.email.trim().toLowerCase();
  if (email === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) {
    return { email, name: session.user.name || email, role: "owner" };
  }
  const { rows } = await pool.query<{ role: Role }>("SELECT role FROM team_member WHERE email = $1", [email]);
  if (!rows[0]) return null;
  return { email, name: session.user.name || email, role: rows[0].role };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.BETTER_AUTH_URL;
  return !!origin && !!expected && origin === new URL(expected).origin;
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function canEdit(role: Role) { return role === "owner" || role === "admin" || role === "editor"; }
export function canReview(role: Role) { return role === "owner" || role === "admin" || role === "reviewer"; }
export function canAdmin(role: Role) { return role === "owner" || role === "admin"; }

export async function readJson(request: Request, maxBytes = 2_000_000) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("Нужен JSON.");
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("Файл слишком большой.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error("Файл слишком большой.");
  return JSON.parse(text) as unknown;
}

export function seriesDocument(value: unknown): { name: string; slides: unknown[]; [key: string]: unknown } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const document = value as Record<string, unknown>;
  if (typeof document.name !== "string" || !document.name.trim() || document.name.length > 200) return null;
  if (!Array.isArray(document.slides) || document.slides.length < 2 || document.slides.length > 30) return null;
  if (!document.slides.every((slide) => {
    if (!slide || typeof slide !== "object" || Array.isArray(slide)) return false;
    const item = slide as Record<string, unknown>;
    for (const key of ["title", "body", "photoId", "labelText", "counterText"]) {
      if (item[key] != null && typeof item[key] !== "string") return false;
    }
    if (item.customLayers != null && (!Array.isArray(item.customLayers) || item.customLayers.length > 50 || !item.customLayers.every((layer) => layer && typeof layer === "object" && !Array.isArray(layer)))) return false;
    return true;
  })) return null;
  return document as { name: string; slides: unknown[]; [key: string]: unknown };
}
