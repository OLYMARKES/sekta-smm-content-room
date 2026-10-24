import { actor, jsonError } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await actor();
  return user ? Response.json({ email: user.email, name: user.name, role: user.role }, { headers: { "Cache-Control": "no-store" } }) : jsonError("Нет доступа к команде.", 403);
}
