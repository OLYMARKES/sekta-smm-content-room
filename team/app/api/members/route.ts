import { actor, canAdmin, jsonError, readJson, sameOrigin } from "@/lib/access";
import { pool } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
const roles = ["admin", "editor", "reviewer", "viewer"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const user = await actor();
  if (!user || !canAdmin(user.role)) return jsonError("Недостаточно прав.", 403);
  const { rows } = await pool.query("SELECT email,role,invited_by AS \"invitedBy\",created_at AS \"createdAt\" FROM team_member ORDER BY created_at DESC");
  return Response.json({ owner: process.env.TEAM_OWNER_EMAIL?.toLowerCase(), members: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canAdmin(user.role)) return jsonError("Недостаточно прав.", 403);
  let body: { email?: unknown; role?: unknown };
  try { body = await readJson(request, 10_000) as typeof body; }
  catch { return jsonError("Не удалось прочитать приглашение.", 400); }
  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!emailPattern.test(email) || email.length > 320 || !roles.includes(String(body.role))) return jsonError("Укажите корректную почту и роль.", 400);
  if (email === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) return jsonError("Владелец уже имеет доступ.", 400);
  await pool.query("INSERT INTO team_member (email,role,invited_by) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role,invited_by=EXCLUDED.invited_by", [email, body.role, user.email]);
  try {
    await sendEmail(email, "Приглашение в #Sekta Content Room", `Вас пригласили в командную Content Room с ролью «${body.role}». Откройте ${process.env.BETTER_AUTH_URL}/sign-in и войдите через Google или по почте.`);
  } catch {
    return Response.json({ invited: true, emailed: false }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ invited: true, emailed: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canAdmin(user.role)) return jsonError("Недостаточно прав.", 403);
  let body: { email?: unknown };
  try { body = await readJson(request, 10_000) as typeof body; }
  catch { return jsonError("Не удалось прочитать запрос.", 400); }
  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase() || email === user.email) return jsonError("Нельзя удалить владельца или собственный доступ.", 400);
  await pool.query("DELETE FROM team_member WHERE email=$1", [email]);
  return Response.json({ removed: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canAdmin(user.role)) return jsonError("Недостаточно прав.", 403);
  let body: { email?: unknown; role?: unknown };
  try { body = await readJson(request, 10_000) as typeof body; }
  catch { return jsonError("Не удалось прочитать запрос.", 400); }
  const email = body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!emailPattern.test(email) || !roles.includes(String(body?.role)) || email === user.email || email === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) return jsonError("Нельзя изменить эту роль.", 400);
  const { rowCount } = await pool.query("UPDATE team_member SET role=$2 WHERE email=$1", [email, body.role]);
  return rowCount ? Response.json({ changed: true }, { headers: { "Cache-Control": "no-store" } }) : jsonError("Коллега не найден.", 404);
}
