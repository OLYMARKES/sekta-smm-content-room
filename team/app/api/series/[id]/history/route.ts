import { actor, canEdit, jsonError, readJson, sameOrigin } from "@/lib/access";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(request: Request, context: Context) {
  const user = await actor();
  if (!user) return jsonError("Нет доступа к команде.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  const revision = new URL(request.url).searchParams.get("revision");
  if (revision) {
    if (!/^\d{1,9}$/.test(revision)) return jsonError("Неверная версия.", 400);
    const { rows } = await pool.query("SELECT revision,document,status,changed_by AS \"changedBy\",changed_at AS \"changedAt\" FROM content_series_history WHERE series_id=$1 AND revision=$2", [id, Number(revision)]);
    return rows[0] ? Response.json(rows[0], { headers: { "Cache-Control": "no-store" } }) : jsonError("Версия не найдена.", 404);
  }
  const { rows } = await pool.query("SELECT revision,status,changed_by AS \"changedBy\",changed_at AS \"changedAt\" FROM content_series_history WHERE series_id=$1 ORDER BY revision DESC LIMIT 100", [id]);
  return Response.json({ revisions: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canEdit(user.role)) return jsonError("Недостаточно прав.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  let input: { revision?: unknown; expectedRevision?: unknown };
  try { input = await readJson(request, 10_000) as typeof input; }
  catch { return jsonError("Не удалось прочитать запрос.", 400); }
  if (!input || typeof input.revision !== "number" || typeof input.expectedRevision !== "number" || !Number.isSafeInteger(input.revision) || !Number.isSafeInteger(input.expectedRevision)) return jsonError("Укажите версии для восстановления.", 400);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: currentRows } = await client.query("SELECT revision,status FROM content_series WHERE id=$1 FOR UPDATE", [id]);
    const current = currentRows[0];
    if (!current) { await client.query("ROLLBACK"); return jsonError("Серия не найдена.", 404); }
    if (current.revision !== input.expectedRevision) { await client.query("ROLLBACK"); return jsonError("Серию уже изменили. Обновите историю.", 409); }
    if (current.status === "published") { await client.query("ROLLBACK"); return jsonError("Опубликованную серию можно восстановить только как новую копию через JSON.", 409); }
    const { rows: oldRows } = await client.query("SELECT document FROM content_series_history WHERE series_id=$1 AND revision=$2", [id, input.revision]);
    if (!oldRows[0]) { await client.query("ROLLBACK"); return jsonError("Версия не найдена.", 404); }
    const document = oldRows[0].document;
    const nextRevision = current.revision + 1;
    await client.query("UPDATE content_series SET name=$2,document=$3::jsonb,status='draft',revision=$4,updated_by=$5,updated_at=now() WHERE id=$1", [id, document.name, JSON.stringify(document), nextRevision, user.email]);
    await client.query("INSERT INTO content_series_history (series_id,revision,document,status,changed_by) VALUES ($1,$2,$3::jsonb,'draft',$4)", [id, nextRevision, JSON.stringify(document), user.email]);
    await client.query("COMMIT");
    return Response.json({ id, revision: nextRevision, status: "draft" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
