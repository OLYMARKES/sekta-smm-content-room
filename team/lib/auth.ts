import { betterAuth } from "better-auth";
import { pool } from "./db";
import { sendEmail } from "./email";

export const auth = betterAuth({
  appName: "#Sekta Content Room",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: pool,
  // The container image is built before its database starts. Schema is applied by the
  // one-shot migration service before the application is exposed.
  advanced: { database: { validateSchema: false } },
  user: {
    validateUserInfo: async ({ user }) => {
      const email = user.email?.trim().toLowerCase();
      if (email && email === process.env.TEAM_OWNER_EMAIL?.trim().toLowerCase()) return;
      if (email) {
        const { rowCount } = await pool.query("SELECT 1 FROM team_member WHERE email=$1", [email]);
        if (rowCount) return;
      }
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
