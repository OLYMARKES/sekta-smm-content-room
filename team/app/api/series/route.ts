import { randomUUID } from "node:crypto";
import { actor, canEdit, jsonError, readJson, sameOrigin, seriesDocument } from "@/lib/access";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await actor();
  if (!user) return jsonError("Нет доступа к команде.", 403);
  const { rows } = await pool.query(`SELECT id, name, status, revision, created_by AS "createdBy", updated_by AS "updatedBy", created_at AS "createdAt", updated_at AS "updatedAt", document->'brief' AS brief FROM content_series ORDER BY updated_at DESC`);
  return Response.json({ items: rows, role: user.role }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canEdit(user.role)) return jsonError("Недостаточно прав.", 403);
  let document;
  try { document = seriesDocument(await readJson(request)); }
  catch { return jsonError("Не удалось прочитать JSON серии.", 400); }
  if (!document) return jsonError("Ожидается серия с названием и 2–30 слайдами.", 400);
  const id = randomUUID();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO content_series (id, name, document, created_by, updated_by) VALUES ($1,$2,$3::jsonb,$4,$4)", [id, document.name.trim(), JSON.stringify(document), user.email]);
    await client.query("INSERT INTO content_series_history (series_id, revision, document, status, changed_by) VALUES ($1,1,$2::jsonb,'draft',$3)", [id, JSON.stringify(document), user.email]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
  return Response.json({ id, revision: 1, status: "draft" }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
