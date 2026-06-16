import { Router } from "express";
import { prisma } from "@rogjar/database";
import { authenticate } from "../middleware/auth";
import { audit } from "../middleware/audit";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const chatRouter = Router();
chatRouter.use(authenticate);

chatRouter.post("/threads", audit("chat.thread.create", "ChatThread"), asyncHandler(async (request, response) => {
  const thread = await prisma.chatThread.create({ data: { jobId: request.body.jobId, applicationId: request.body.applicationId } });
  response.status(201).json({ thread });
}));

chatRouter.get("/threads/:id/messages", asyncHandler(async (request, response) => {
  const messages = await prisma.chatMessage.findMany({
    where: { threadId: getParam(request, "id") },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
  response.json({ messages });
}));

chatRouter.post("/threads/:id/messages", audit("chat.message.create", "ChatMessage"), asyncHandler(async (request, response) => {
  const message = await prisma.chatMessage.create({
    data: { threadId: getParam(request, "id"), senderId: request.auth!.userId, body: request.body.body },
  });
  response.status(201).json({ message });
}));
