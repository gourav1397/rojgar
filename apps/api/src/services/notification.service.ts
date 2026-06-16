import { prisma } from "@rogjar/database";
import { sendEmail } from "./email.service";

export async function notifyUser(input: {
  userId: string;
  email?: string;
  subject: string;
  body: string;
  channels?: Array<"EMAIL" | "SMS" | "PUSH" | "IN_APP">;
}) {
  const channels = input.channels ?? ["IN_APP", "EMAIL"];
  await prisma.notification.createMany({
    data: channels.map(channel => ({
      userId: input.userId,
      channel,
      subject: input.subject,
      body: input.body,
      sentAt: channel === "IN_APP" ? new Date() : null,
    })),
  });

  if (input.email && channels.includes("EMAIL")) {
    await sendEmail({ to: input.email, subject: input.subject, html: `<p>${input.body}</p>` });
  }

  if (channels.includes("SMS")) {
    console.log("[sms:queued]", input.userId, input.subject);
  }
  if (channels.includes("PUSH")) {
    console.log("[push:queued]", input.userId, input.subject);
  }
}
