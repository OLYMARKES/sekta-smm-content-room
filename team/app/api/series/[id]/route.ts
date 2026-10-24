import { actor, canEdit, canReview, jsonError, readJson, sameOrigin, seriesDocument } from "@/lib/access";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(_: Request, context: Context) {
  const user = await actor();
  if (!user) return jsonError("Нет доступа к команде.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  const { rows } = await pool.query("SELECT id, name, document, status, revision, updated_at AS \"updatedAt\" FROM content_series WHERE id=$1", [id]);
  return rows[0] ? Response.json(rows[0], { headers: { "Cache-Control": "no-store" } }) : jsonError("Серия не найдена.", 404);
}

export async function PUT(request: Request, context: Context) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user) return jsonError("Нет доступа к команде.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  let body: Record<string, unknown>;
  try {
    const value = await readJson(request);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    body = value as Record<string, unknown>;
  } catch { return jsonError("Не удалось прочитать изменение.", 400); }
  if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 1) return jsonError("Нужна версия серии.", 400);
  const document = body.document === undefined ? null : seriesDocument(body.document);
  if (body.document !== undefined && !document) return jsonError("Неверный формат серии.", 400);
  const requestedStatus = body.status;
  if (requestedStatus !== undefined && !["draft", "review", "approved", "scheduled", "published"].includes(String(requestedStatus))) return jsonError("Неизвестный этап.", 400);
  if (document && !canEdit(user.role)) return jsonError("Редактировать серию может редактор.", 403);
  if (requestedStatus !== undefined && !canEdit(user.role) && !canReview(user.role)) return jsonError("Недостаточно прав.", 403);
  if (!document && requestedStatus === undefined) return jsonError("Нет изменений.", 400);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT id, name, document, status, revision FROM content_series WHERE id=$1 FOR UPDATE", [id]);
    const current = rows[0];
    if (!current) { await client.query("ROLLBACK"); return jsonError("Серия не найдена.", 404); }
    if (current.revision !== body.revision) {
      await client.query("ROLLBACK");
      return Response.json({ error: "Серию уже изменил коллега. Сохраните свою копию в JSON и обновите данные.", current }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }
    if (current.status === "published") { await client.query("ROLLBACK"); return jsonError("Опубликованную серию нельзя перезаписать. Сделайте копию.", 409); }
    if (document && requestedStatus !== undefined) { await client.query("ROLLBACK"); return jsonError("Содержание и этап меняются отдельно.", 400); }

    let nextStatus = current.status;
    if (document) {
      if (["review", "approved", "scheduled"].includes(current.status)) nextStatus = "draft";
    } else if (requestedStatus !== undefined) {
      const status = String(requestedStatus);
      const manager = user.role === "owner" || user.role === "admin";
      if (!manager && user.role === "editor" && !["draft", "review"].includes(status)) { await client.query("ROLLBACK"); return jsonError("Согласование выполняет ревьюер.", 403); }
      if (!manager && user.role === "reviewer" && !["draft", "approved"].includes(status)) { await client.query("ROLLBACK"); return jsonError("Ревьюер может вернуть в черновик или согласовать.", 403); }
      if (!manager && user.role === "reviewer" && current.status !== "review") { await client.query("ROLLBACK"); return jsonError("Ревьюер работает с серией на этапе ревью.", 403); }
      if (status === "approved" && current.status !== "review") { await client.query("ROLLBACK"); return jsonError("Сначала отправьте серию на ревью.", 409); }
      if (status === "scheduled" && current.status !== "approved") { await client.query("ROLLBACK"); return jsonError("Сначала согласуйте серию.", 409); }
      if (status === "published" && current.status !== "scheduled") { await client.query("ROLLBACK"); return jsonError("Сначала запланируйте серию.", 409); }
      nextStatus = status;
    }
    const nextDocument = document || current.document;
    const revision = current.revision + 1;
    await client.query("UPDATE content_series SET name=$2,document=$3::jsonb,status=$4,revision=$5,updated_by=$6,updated_at=now() WHERE id=$1", [id, nextDocument.name.trim(), JSON.stringify(nextDocument), nextStatus, revision, user.email]);
    await client.query("INSERT INTO content_series_history (series_id,revision,document,status,changed_by) VALUES ($1,$2,$3::jsonb,$4,$5)", [id, revision, JSON.stringify(nextDocument), nextStatus, user.email]);
    await client.query("COMMIT");
    return Response.json({ id, revision, status: nextStatus }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
