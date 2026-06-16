import { Router } from "express";
import { prisma, UserRole } from "@rogjar/database";
import { authenticate, authorize } from "../middleware/auth";
import { audit } from "../middleware/audit";
import { asyncHandler } from "../utils/async-handler";

export const employerRouter = Router();
employerRouter.use(authenticate, authorize(UserRole.EMPLOYER, UserRole.ADMIN));

employerRouter.get("/dashboard", asyncHandler(async (request, response) => {
  const employer = await prisma.employerProfile.findUnique({ where: { userId: request.auth!.userId }, include: { company: true } });
  const companyId = employer?.companyId;
  const [jobs, applicants, interviews] = await Promise.all([
    prisma.job.count({ where: { companyId } }),
    prisma.application.count({ where: { job: { companyId } } }),
    prisma.interview.count({ where: { job: { companyId } } }),
  ]);
  response.json({ employer, analytics: { jobs, applicants, interviews } });
}));

employerRouter.patch("/company", audit("company.update", "Company"), asyncHandler(async (request, response) => {
  const employer = await prisma.employerProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const company = await prisma.company.update({ where: { id: employer.companyId }, data: request.body });
  response.json({ company });
}));

employerRouter.get("/applicants", asyncHandler(async (request, response) => {
  const employer = await prisma.employerProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const applicants = await prisma.application.findMany({
    where: { job: { companyId: employer.companyId } },
    include: { candidate: { include: { user: true, skills: { include: { skill: true } }, resumes: true } }, job: true },
    orderBy: { createdAt: "desc" },
  });
  response.json({ applicants });
}));

employerRouter.get("/candidate-search", asyncHandler(async (request, response) => {
  const q = String(request.query.q || "");
  const city = String(request.query.city || "");
  const candidates = await prisma.candidateProfile.findMany({
    where: {
      currentCity: city ? { contains: city, mode: "insensitive" } : undefined,
      OR: q
        ? [
            { headline: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } },
          ]
        : undefined,
    },
    include: { user: true, skills: { include: { skill: true } }, resumes: true },
    take: 50,
  });
  response.json({ candidates });
}));
