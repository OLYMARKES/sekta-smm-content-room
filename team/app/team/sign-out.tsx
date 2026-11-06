"use client";

import { authClient } from "@/lib/auth-client";

export function SignOut() {
  return <button className="button secondary" type="button" onClick={async () => {
    await authClient.signOut();
    window.location.assign("/sign-in");
  }}>Войти другим аккаунтом</button>;
}
