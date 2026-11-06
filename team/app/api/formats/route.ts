import { randomUUID } from "node:crypto";
import { actor, canEdit, jsonError, readJson, sameOrigin } from "@/lib/access";
import { pool } from "@/lib/db";

function headers() { return { "Cache-Control": "no-store" }; }
function validId(value: unknown) { return typeof value === "string" && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value); }
const limits = {
  email: { subject: 180, preheader: 180, heading: 180, image: 2000, imageAlt: 250, emailBody: 15000, cta: 100, ctaUrl: 2000 },
  threads: { account: 80, threadsBody: 15000, limit: 4 },
};
function validKind(value: unknown): value is keyof typeof limits { return value === "email" || value === "threads"; }
function validDocument(value: unknown, kind: keyof typeof limits) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const bounds: Record<string, number> = limits[kind];
  return Object.entries(value).every(([key, field]) =>
    Object.hasOwn(bounds, key) && typeof field === "string" && field.length <= bounds[key] && !field.includes("\0"));
}

export async function GET(request: Request) {
  if (!await actor()) return jsonError("Нет доступа к команде.", 403);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!validKind(kind) || (id !== null && !validId(id))) return jsonError("Неверный формат или черновик.", 400);
  if (id) {
    const { rows } = await pool.query("SELECT id, title, document, revision FROM content_format_draft WHERE kind=$1 AND id=$2", [kind, id]);
    return rows[0] ? Response.json(rows[0], { headers: headers() }) : jsonError("Черновик не найден.", 404);
  }
  const { rows } = await pool.query(
    'SELECT id, title, updated_at AS "updatedAt" FROM content_format_draft WHERE kind=$1 ORDER BY updated_at DESC, id',
    [kind],
  );
  return Response.json({ items: rows }, { headers: headers() });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canEdit(user.role)) return jsonError("Нет права сохранять черновики.", 403);
  let data: unknown;
  try { data = await readJson(request, 100_000); }
  catch { return jsonError("Не удалось прочитать черновик.", 400); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return jsonError("Неверный черновик.", 400);
  const { kind, id, revision, title, document } = data as Record<string, unknown>;
  if (!validKind(kind) || typeof title !== "string" || !title.trim() || title.length > 160 || title.includes("\0")
    || !validDocument(document, kind)
    || (id !== null && (!validId(id) || typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1))) {
    return jsonError("Проверьте название и содержимое черновика.", 400);
  }
  const args = [kind, title.trim(), JSON.stringify(document), user.email];
  const { rows } = id === null
    ? await pool.query("INSERT INTO content_format_draft (kind,title,document,updated_by,id) VALUES ($1,$2,$3,$4,$5) RETURNING id,revision", [...args, randomUUID()])
    : await pool.query(`UPDATE content_format_draft SET title=$2,document=$3,updated_by=$4,updated_at=now(),revision=revision+1
        WHERE kind=$1 AND id=$5 AND revision=$6 RETURNING id,revision`, [...args, id, revision]);
  return rows[0] ? Response.json(rows[0], { headers: headers() }) : jsonError("Коллега изменил черновик. Скачайте свою копию, затем откройте свежую версию.", 409);
}
