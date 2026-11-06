import { auth } from "@/lib/auth";
import { actor } from "@/lib/access";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TeamRoom } from "./team-room";
import { SignOut } from "./sign-out";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const user = await actor();
  if (!user) return <main className="empty-access"><div className="auth-brand">#Sekta <span>Content Room</span></div><section className="auth-panel"><div className="eyebrow">Доступ к команде</div><h1>Ждём приглашение</h1><p>Адрес <strong>{session.user.email}</strong> пока не подтверждён или не добавлен в команду. Подтвердите почту и попросите администратора пригласить этот адрес.</p><SignOut /></section></main>;
  return <TeamRoom actor={user} />;
}
