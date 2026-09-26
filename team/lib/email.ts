import nodemailer from "nodemailer";
import { readFile } from "node:fs/promises";

export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_FROM) throw new Error("SMTP is not configured");
  const server = process.env.SMTP_SERVER_FILE
    ? (await readFile(process.env.SMTP_SERVER_FILE, "utf8")).trim()
    : process.env.SMTP_SERVER?.trim();
  if (!server && !process.env.SMTP_HOST) throw new Error("SMTP is not configured");
  const transport = server
    ? nodemailer.createTransport(server)
    : nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      });
  await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}
