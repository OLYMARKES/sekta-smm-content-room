"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetPassword() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setMessage("Ссылка устарела. Запросите новое письмо на странице входа."); return; }
    setBusy(true);
    const password = String(new FormData(event.currentTarget).get("password") || "");
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      setMessage(result.error ? result.error.message || "Не удалось изменить пароль." : "Пароль изменён. Теперь можно войти.");
    } catch { setMessage("Не удалось изменить пароль. Попробуйте позже."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><div className="auth-brand">#Sekta <span>Content Room</span></div><section className="auth-panel"><div className="eyebrow">Доступ</div><h1>Новый пароль</h1><p>Используйте минимум 12 символов.</p><form onSubmit={submit}><label>Пароль<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label><button className="button primary full" disabled={busy}>{busy ? "Сохраняем…" : "Сохранить пароль"}</button></form>{message && <p className="form-message" role="status">{message}</p>}<a className="text-link" href="/sign-in">Вернуться ко входу</a></section></main>;
}
