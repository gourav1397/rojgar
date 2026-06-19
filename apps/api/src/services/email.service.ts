import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export function isEmailDeliveryConfigured() {
  return Boolean(resend);
}

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log("[email:dev]", options);
    return;
  }
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
