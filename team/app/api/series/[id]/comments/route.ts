import { actor, canEdit, canReview, jsonError, readJson, sameOrigin } from "@/lib/access";
import { pool } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };
const validId = (id: string) => /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);

export async function GET(request: Request, context: Context) {
  if (!await actor()) return jsonError("Нет доступа к команде.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  const before = new URL(request.url).searchParams.get("before");
  if (before !== null && !/^\d{1,18}$/.test(before)) return jsonError("Неверная страница.", 400);
  const { rows } = await pool.query(
    `SELECT id::text, slide_id AS "slideId", author_name AS "authorName", body, created_at AS "createdAt"
       FROM content_series_comment WHERE series_id=$1 AND ($2::bigint IS NULL OR id < $2)
      ORDER BY content_series_comment.id DESC LIMIT 51`, [id, before],
  );
  const items = rows.slice(0, 50);
  return Response.json({ items, next: rows.length > 50 ? items.at(-1).id : null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: Context) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || (!canEdit(user.role) && !canReview(user.role))) return jsonError("Нет права комментировать.", 403);
  const { id } = await context.params;
  if (!validId(id)) return jsonError("Серия не найдена.", 404);
  let data: unknown;
  try { data = await readJson(request, 16_000); }
  catch { return jsonError("Не удалось прочитать комментарий.", 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return jsonError("Неверный комментарий.", 400);
  const { body, slideId } = data as Record<string, unknown>;
  if (typeof body !== "string" || !body.trim() || body.length > 2000 || body.includes("\0")
    || (slideId !== null && (typeof slideId !== "string" || !slideId || slideId.length > 160 || slideId.includes("\0")))) {
    return jsonError("Проверьте текст и выбранный слайд.", 400);
  }
  const { rowCount } = await pool.query(
    `INSERT INTO content_series_comment (series_id, slide_id, author_name, body)
     SELECT id, $2, $3, $4 FROM content_series WHERE id=$1 AND
       ($2::text IS NULL OR EXISTS (SELECT 1 FROM jsonb_array_elements(document->'slides') AS slide WHERE slide->>'id' = $2))`,
    [id, slideId, user.name, body.trim()],
  );
  return rowCount ? Response.json({ ok: true }, { status: 201 }) : jsonError("Сохраните слайд в команде перед комментированием.", 409);
}
