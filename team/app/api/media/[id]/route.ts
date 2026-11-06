import { actor, jsonError } from "@/lib/access";
import { pool } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await actor()) return jsonError("Нет доступа к команде.", 403);
  const { id } = await context.params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) return jsonError("Фото не найдено.", 404);
  const preview = new URL(request.url).searchParams.has("preview");
  const { rows } = await pool.query<{ mime: string; data: Buffer }>(
    preview ? "SELECT 'image/jpeg' AS mime, preview AS data FROM content_media WHERE id=$1"
      : "SELECT mime, data FROM content_media WHERE id=$1",
    [id],
  );
  if (!rows[0]) return jsonError("Фото не найдено.", 404);
  return new Response(new Uint8Array(rows[0].data), {
    headers: { "Content-Type": rows[0].mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
