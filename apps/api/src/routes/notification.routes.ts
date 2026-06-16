import { Router } from "express";
import { prisma } from "@rogjar/database";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get("/", asyncHandler(async (request, response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: request.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  response.json({ notifications });
}));

notificationRouter.patch("/:id/read", asyncHandler(async (request, response) => {
  const notification = await prisma.notification.update({
    where: { id: getParam(request, "id") },
    data: { readAt: new Date() },
  });
  response.json({ notification });
}));
