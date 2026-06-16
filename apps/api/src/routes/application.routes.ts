import { Router } from "express";
import { prisma, ApplicationStatus, UserRole } from "@rogjar/database";
import { interviewSchema } from "@rogjar/shared";
import { audit } from "../middleware/audit";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { notifyUser } from "../services/notification.service";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const applicationRouter = Router();

applicationRouter.get(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    if (request.auth!.role === UserRole.CANDIDATE) {
      const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
      const applications = await prisma.application.findMany({
        where: { candidateId: candidate.id },
        include: { job: { include: { company: true } }, interviews: true },
        orderBy: { createdAt: "desc" },
      });
      response.json({ applications });
      return;
    }
    const applications = await prisma.application.findMany({
      include: { candidate: { include: { user: true } }, job: { include: { company: true } }, interviews: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    response.json({ applications });
  })
);

applicationRouter.patch(
  "/:id/status",
  authenticate,
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  audit("application.status", "Application"),
  asyncHandler(async (request, response) => {
    const status = request.body.status as ApplicationStatus;
    const application = await prisma.application.update({
      where: { id: getParam(request, "id") },
      data: { status },
      include: { candidate: { include: { user: true } }, job: true },
    });
    await notifyUser({
      userId: application.candidate.userId,
      email: application.candidate.user.email,
      subject: "Application status updated",
      body: `${application.job.title} is now ${status}.`,
    });
    response.json({ application });
  })
);

applicationRouter.post(
  "/interviews",
  authenticate,
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validateBody(interviewSchema),
  audit("interview.schedule", "Interview"),
  asyncHandler(async (request, response) => {
    const interview = await prisma.interview.create({ data: request.body });
    await prisma.application.update({
      where: { id: request.body.applicationId },
      data: { status: ApplicationStatus.INTERVIEW_SCHEDULED },
    });
    response.status(201).json({ interview });
  })
);
