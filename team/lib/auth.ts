import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { pool } from "./db";
import { sendEmail } from "./email";

async function isInvited(email: string | undefined) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) return true;
  const { rowCount } = await pool.query("SELECT 1 FROM team_member WHERE email=$1", [normalized]);
  return Boolean(rowCount);
}

export const auth = betterAuth({
  appName: "#Sekta Content Room",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  // The container image is built before its database starts. Schema is applied by the
  // one-shot migration service before the application is exposed.
  advanced: { database: { validateSchema: false } },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!await isInvited(user.email)) {
            throw new APIError("FORBIDDEN", { message: "Для входа нужно приглашение на этот адрес почты." });
          }
        },
      },
    },
  },
  user: {
    validateUserInfo: async ({ user }) => {
      if (await isInvited(user.email)) return;
      return { error: "invitation_required", errorDescription: "Для входа нужно приглашение на этот адрес почты." };
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.email, "Восстановление доступа к Content Room", `Чтобы задать новый пароль, откройте ссылку:\n${url}\n\nЕсли вы не запрашивали восстановление, просто проигнорируйте письмо.`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.email, "Подтверждение почты Content Room", `Подтвердите адрес почты по ссылке:\n${url}`);
    },
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET },
  } : {},
});
