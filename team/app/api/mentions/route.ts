import { actor, canEdit, canReview, jsonError } from "@/lib/access";
import { pool } from "@/lib/db";

export async function GET() {
  const user = await actor();
  if (!user || (!canEdit(user.role) && !canReview(user.role))) return jsonError("Нет права комментировать.", 403);
  const { rows } = await pool.query<{ email: string; name: string }>(
    `SELECT lower(email) AS email, name FROM "user" WHERE "emailVerified" AND
       (lower(email) = $1 OR lower(email) IN (SELECT email FROM team_member))
     ORDER BY name, email`,
    [process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase() || ""],
  );
  return Response.json({ members: rows }, { headers: { "Cache-Control": "no-store" } });
}
