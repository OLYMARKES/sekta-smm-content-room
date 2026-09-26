"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import type { Actor, Role } from "@/lib/access";

type Item = { id: string; name: string; status: string; revision: number; createdBy: string; updatedBy: string; updatedAt: string; brief?: { owner?: string; reviewer?: string; publicationDate?: string; account?: string } };
type Member = { email: string; role: Role; invitedBy: string; createdAt: string };
type Revision = { revision: number; status: string; changedBy: string; changedAt: string };
const statusLabels: Record<string, string> = { draft: "Черновик", review: "На ревью", approved: "Согласовано", scheduled: "Запланировано", published: "Опубликовано" };
const roleLabels: Record<Role, string> = { owner: "Владелец", admin: "Администратор", editor: "Редактор", reviewer: "Ревьюер", viewer: "Просмотр" };

async function api(path: string, options?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить действие.");
  return data;
}

export function TeamRoom({ actor }: { actor: Actor }) {
  const [items, setItems] = useState<Item[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const isAdmin = actor.role === "owner" || actor.role === "admin";
  const canEdit = isAdmin || actor.role === "editor";
  const refresh = useCallback(async () => {
    try {
      const data = await api("/api/series");
      setItems(data.items);
      if (isAdmin) setMembers((await api("/api/members")).members);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить материалы."); }
    finally { setLoading(false); }
  }, [isAdmin]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) { setMessage("JSON больше 2 МБ. Экспортируйте отдельную серию."); return; }
    try {
      const document = JSON.parse(await file.text());
      const result = await api("/api/series", { method: "POST", body: JSON.stringify(document) });
      setMessage("Серия добавлена в команду. Локальный файл сохранён без изменений.");
      await refresh();
      window.location.assign(`/editor/postbuilder.html?team=${encodeURIComponent(result.id)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось импортировать JSON."); }
  }

  async function changeStatus(item: Item, status: string) {
    try {
      await api(`/api/series/${item.id}`, { method: "PUT", body: JSON.stringify({ revision: item.revision, status }) });
      setMessage(`«${item.name}»: этап изменён на «${statusLabels[status]}».`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось изменить этап."); await refresh(); }
  }

  async function openHistory(item: Item) {
    setHistoryItem(item);
    try { setRevisions((await api(`/api/series/${item.id}/history`)).revisions); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось загрузить историю."); }
  }

  async function downloadRevision(item: Item, revision: number) {
    try {
      const data = await api(`/api/series/${item.id}/history?revision=${revision}`);
      const blob = new Blob([JSON.stringify(data.document, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sekta-series-${item.id}-v${revision}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось скачать версию."); }
  }

  async function restoreRevision(item: Item, revision: number) {
    if (!window.confirm(`Восстановить версию ${revision} серии «${item.name}»? Текущее состояние останется в истории.`)) return;
    try {
      await api(`/api/series/${item.id}/history`, { method: "POST", body: JSON.stringify({ revision, expectedRevision: item.revision }) });
      setHistoryItem(null);
      setMessage(`Версия ${revision} восстановлена как новый черновик.`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось восстановить версию."); await refresh(); }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await api("/api/members", { method: "POST", body: JSON.stringify({ email: data.get("email"), role: data.get("role") }) });
      setMessage(result.emailed ? "Коллега приглашён — письмо отправлено." : "Доступ добавлен, но письмо не отправилось. Передайте ссылку на вход вручную.");
      form.reset();
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось пригласить коллегу."); }
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Убрать доступ для ${member.email}?`)) return;
    try {
      await api("/api/members", { method: "DELETE", body: JSON.stringify({ email: member.email }) });
      setMessage(`Доступ ${member.email} отозван.`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось убрать доступ."); }
  }

  async function changeMemberRole(member: Member, role: Role) {
    try {
      await api("/api/members", { method: "PATCH", body: JSON.stringify({ email: member.email, role }) });
      setMessage(`Роль ${member.email} изменена на «${roleLabels[role]}».`);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Не удалось изменить роль."); }
  }

  const visible = filter === "all" ? items : items.filter((item) => item.status === filter);
  return <div className="team-app">
    <header className="team-header"><a className="team-brand" href="/team">#Sekta <span>Content Room</span></a><div className="team-header-right"><span>{actor.name} · {roleLabels[actor.role]}</span><button className="text-button" type="button" onClick={async () => { await authClient.signOut(); window.location.assign("/sign-in"); }}>Выйти</button></div></header>
    <main className="team-main">
      <div className="eyebrow">Редакция #Sekta / общее пространство</div>
      <section className="team-intro"><div><h1>Материалы команды</h1><p>Собирайте серию, передавайте на ревью и храните одну актуальную версию для всех.</p></div><div className="team-intro-actions">{canEdit && <><a className="button primary" href="/editor/postbuilder.html">Новая серия</a><label className="button secondary upload-button">Импортировать JSON<input type="file" accept=".json,application/json" onChange={importFile} /></label></>}</div></section>
      {message && <div className="notice" role="status"><span>{message}</span><button type="button" aria-label="Закрыть сообщение" onClick={() => setMessage("")}>×</button></div>}
      <section className="room-section" aria-labelledby="series-title"><div className="section-top"><div><h2 id="series-title">Публикации</h2><p>{loading ? "Загружаем…" : `${items.length} в команде`}</p></div><label className="filter-label">Этап<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Все</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
        {visible.length ? <div className="series-list">{visible.map((item) => {
          const next = item.status === "draft" && canEdit ? "review" : item.status === "review" && (isAdmin || actor.role === "reviewer") ? "approved" : item.status === "approved" && isAdmin ? "scheduled" : item.status === "scheduled" && isAdmin ? "published" : "";
          const nextLabel = next === "review" ? "На ревью" : next === "approved" ? "Согласовать" : next === "scheduled" ? "Запланировать" : "Отметить опубликованным";
          return <article className="series-row" key={item.id}><div className="series-primary"><span className={`status status-${item.status}`}>{statusLabels[item.status] || item.status}</span><h3><a href={`/editor/postbuilder.html?team=${encodeURIComponent(item.id)}`}>{item.name}</a></h3><p>{item.brief?.account || "Аккаунт не указан"}{item.brief?.publicationDate ? ` · ${item.brief.publicationDate}` : ""} · изменено {new Date(item.updatedAt).toLocaleDateString("ru-RU")}</p></div><div className="series-people"><span>Автор: {item.createdBy}</span>{item.brief?.reviewer && <span>Ревью: {item.brief.reviewer}</span>}</div><div className="series-actions"><a className="button secondary small" href={`/editor/postbuilder.html?team=${encodeURIComponent(item.id)}`}>Открыть</a><button className="button quiet small" type="button" onClick={() => openHistory(item)}>История</button>{next && <button className="button quiet small" type="button" onClick={() => changeStatus(item, next)}>{nextLabel}</button>}</div></article>;
        })}</div> : <div className="empty-list">{loading ? "Загружаем материалы…" : filter !== "all" ? "На этом этапе пока нет материалов." : "Пока нет общих серий. Создайте первую или импортируйте JSON из конструктора."}</div>}
        <p className="section-footnote">«Опубликовано» — ручная отметка команды. Публикация в Instagram из Content Room пока не выполняется.</p>
      </section>
      {isAdmin && <section className="room-section people-section" aria-labelledby="people-title"><div className="section-top"><div><h2 id="people-title">Команда</h2><p>Доступ по подтверждённому адресу почты</p></div></div><form className="invite-form" onSubmit={invite}><label>Почта коллеги<input name="email" type="email" placeholder="name@sekta.work" required /></label><label>Роль<select name="role" defaultValue="editor"><option value="editor">Редактор</option><option value="reviewer">Ревьюер</option><option value="viewer">Просмотр</option><option value="admin">Администратор</option></select></label><button className="button primary" type="submit">Пригласить</button></form><div className="member-list"><div className="member-row"><strong>{actor.role === "owner" ? actor.email : "Владелец команды"}</strong><span>Владелец</span></div>{members.map((member) => <div className="member-row" key={member.email}><strong>{member.email}</strong><select aria-label={`Роль ${member.email}`} value={member.role} onChange={(event) => changeMemberRole(member, event.target.value as Role)}><option value="editor">Редактор</option><option value="reviewer">Ревьюер</option><option value="viewer">Просмотр</option><option value="admin">Администратор</option></select><button className="text-button" type="button" onClick={() => removeMember(member)}>Убрать доступ</button></div>)}</div></section>}
      {historyItem && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryItem(null); }}><section className="history-dialog" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="section-top"><div><div className="eyebrow">Версии серии</div><h2 id="history-title">{historyItem.name}</h2></div><button className="text-button" type="button" onClick={() => setHistoryItem(null)}>Закрыть</button></div><p>Скачайте нужную версию или восстановите её как новый черновик. Текущая версия останется в истории.</p><div className="history-list">{revisions.map((entry) => <div className="history-row" key={entry.revision}><div><strong>Версия {entry.revision} · {statusLabels[entry.status] || entry.status}</strong><span>{new Date(entry.changedAt).toLocaleString("ru-RU")} · {entry.changedBy}</span></div><div><button className="button secondary small" type="button" onClick={() => downloadRevision(historyItem, entry.revision)}>JSON</button>{canEdit && historyItem.status !== "published" && entry.revision !== historyItem.revision && <button className="button quiet small" type="button" onClick={() => restoreRevision(historyItem, entry.revision)}>Восстановить</button>}</div></div>)}</div></section></div>}
    </main>
  </div>;
}
