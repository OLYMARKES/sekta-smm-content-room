import { randomUUID } from "node:crypto";
import { actor, canEdit, jsonError, readBody, sameOrigin } from "@/lib/access";
import { pool } from "@/lib/db";

const maxBytes = 5_000_000;

function imageType(data: Buffer) {
  if (data.length < 12) return null;
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return "image/jpeg";
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function GET() {
  if (!await actor()) return jsonError("Нет доступа к команде.", 403);
  const { rows } = await pool.query("SELECT id, name, tags, credit FROM content_media ORDER BY created_at DESC, id");
  return Response.json({ items: rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError("Недопустимый источник запроса.", 403);
  const user = await actor();
  if (!user || !canEdit(user.role)) return jsonError("Нет права загружать фото.", 403);
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) return jsonError("Выберите фото для загрузки.", 415);
  let form: FormData;
  try {
    const data = await readBody(request, maxBytes + 260_000);
    form = await new Response(new Uint8Array(data), { headers: { "Content-Type": contentType } }).formData();
  } catch { return jsonError("Не удалось прочитать загрузку. Проверьте, что фото весит до 5 МБ.", 400); }
  const file = form.get("photo");
  const thumb = form.get("preview");
  const credit = String(form.get("credit") ?? "").trim();
  const tags = String(form.get("tags") ?? "").trim();
  const name = file instanceof File ? file.name.trim().slice(0, 160) : "";
  if (!name || tags.length > 250 || !credit || credit.length > 300
    || [name, tags, credit].some((value) => value.includes("\0"))) {
    return jsonError("Укажите название и источник или разрешение на использование.", 400);
  }
  if (!(file instanceof File) || file.size > maxBytes || !(thumb instanceof File) || thumb.size > 250_000) {
    return jsonError("Фото должно весить до 5 МБ, превью — до 250 КБ.", 413);
  }
  const data = Buffer.from(await file.arrayBuffer());
  const preview = Buffer.from(await thumb.arrayBuffer());
  const mime = imageType(data);
  if (!mime || imageType(preview) !== "image/jpeg") return jsonError("Поддерживаются JPG, PNG и WebP.", 415);
  const id = randomUUID();
  await pool.query("INSERT INTO content_media (id,name,mime,data,preview,tags,credit) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, name, mime, data, preview, tags, credit]);
  return Response.json({ id, name, tags, credit }, { status: 201 });
}
