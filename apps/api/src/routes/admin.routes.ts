import { Router } from "express";
import { prisma, CompanyStatus, JobStatus, UserRole } from "@rogjar/database";
import { audit } from "../middleware/audit";
import { authenticate, authorize } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const adminRouter = Router();
adminRouter.use(authenticate, authorize(UserRole.ADMIN));

adminRouter.get("/dashboard", asyncHandler(async (_request, response) => {
  const [users, companies, jobs, applications, reports] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.report.count({ where: { status: "open" } }),
  ]);
  response.json({ metrics: { users, companies, jobs, applications, reports } });
}));

adminRouter.get("/users", asyncHandler(async (_request, response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  response.json({ users });
}));

adminRouter.get("/companies/pending", asyncHandler(async (_request, response) => {
  const companies = await prisma.company.findMany({
    where: { status: CompanyStatus.PENDING },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  response.json({ companies });
}));

adminRouter.get("/jobs/pending", asyncHandler(async (_request, response) => {
  const jobs = await prisma.job.findMany({
    where: { status: JobStatus.PENDING_APPROVAL },
    include: { company: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  response.json({ jobs });
}));

adminRouter.patch("/companies/:id/verify", audit("admin.company.verify", "Company"), asyncHandler(async (request, response) => {
  const company = await prisma.company.update({
    where: { id: getParam(request, "id") },
    data: { status: request.body.status === "REJECTED" ? CompanyStatus.REJECTED : CompanyStatus.VERIFIED, verificationNotes: request.body.notes },
  });
  response.json({ company });
}));

adminRouter.patch("/jobs/:id/approval", audit("admin.job.approve", "Job"), asyncHandler(async (request, response) => {
  const approved = Boolean(request.body.approved);
  const job = await prisma.job.update({
    where: { id: getParam(request, "id") },
    data: { status: approved ? JobStatus.ACTIVE : JobStatus.REJECTED, publishedAt: approved ? new Date() : null },
  });
  response.json({ job });
}));

adminRouter.post("/reports", audit("admin.report.create", "Report"), asyncHandler(async (request, response) => {
  const report = await prisma.report.create({ data: request.body });
  response.status(201).json({ report });
}));

adminRouter.get("/audit-logs", asyncHandler(async (_request, response) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  response.json({ logs });
}));

adminRouter.post("/cms", audit("admin.cms.upsert", "CmsPage"), asyncHandler(async (request, response) => {
  const page = await prisma.cmsPage.upsert({
    where: { slug: request.body.slug },
    update: request.body,
    create: request.body,
  });
  response.json({ page });
}));
