"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function SignIn({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    try {
      if (mode === "forgot") {
        await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
        setMessage("Если адрес зарегистрирован, письмо для восстановления отправлено.");
      } else if (mode === "up") {
        const result = await authClient.signUp.email({ name: String(data.get("name") || "").trim(), email, password, callbackURL: "/team" });
        setMessage(result.error ? result.error.message || "Не удалось создать аккаунт." : "Проверьте почту и подтвердите адрес, затем войдите.");
      } else {
        const result = await authClient.signIn.email({ email, password, callbackURL: "/team" });
        if (result.error) setMessage(result.error.message || "Не удалось войти.");
        else window.location.assign("/team");
      }
    } catch { setMessage("Не удалось выполнить запрос. Попробуйте позже."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <div className="auth-brand">#Sekta <span>Content Room</span></div>
    <section className="auth-panel">
      <div className="eyebrow">Командное пространство</div>
      <h1>{mode === "in" ? "Войти в комнату" : mode === "up" ? "Создать аккаунт" : "Восстановить пароль"}</h1>
      <p>Материалы команды доступны после приглашения. Используйте рабочую почту.</p>
      {mode === "in" && googleEnabled && <button className="button secondary full" type="button" disabled={busy} onClick={async () => {
        setBusy(true);
        const result = await authClient.signIn.social({ provider: "google", callbackURL: "/team" });
        if (result.error) { setMessage(result.error.message || "Google вход недоступен."); setBusy(false); }
      }}>Войти через Google</button>}
      {mode === "in" && googleEnabled && <div className="auth-divider"><span>или по почте</span></div>}
      <form onSubmit={submit}>
        {mode === "up" && <label>Имя<input name="name" type="text" autoComplete="name" maxLength={100} required /></label>}
        <label>Почта<input name="email" type="email" autoComplete="email" required /></label>
        {mode !== "forgot" && <label>Пароль<input name="password" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={mode === "up" ? 12 : undefined} required /></label>}
        <button className="button primary full" type="submit" disabled={busy}>{busy ? "Подождите…" : mode === "in" ? "Войти" : mode === "up" ? "Зарегистрироваться" : "Отправить письмо"}</button>
      </form>
      {message && <p className="form-message" role="status">{message}</p>}
      <div className="auth-links">
        {mode !== "in" && <button type="button" onClick={() => { setMode("in"); setMessage(""); }}>Вернуться ко входу</button>}
        {mode === "in" && <><button type="button" onClick={() => { setMode("up"); setMessage(""); }}>Создать аккаунт</button><button type="button" onClick={() => { setMode("forgot"); setMessage(""); }}>Забыли пароль?</button></>}
      </div>
    </section>
  </main>;
}
