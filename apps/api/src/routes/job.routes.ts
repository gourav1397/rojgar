import { Router } from "express";
import { prisma, JobStatus, UserRole } from "@rogjar/database";
import { applicationCreateSchema, jobCreateSchema, jobSearchSchema } from "@rogjar/shared";
import { audit } from "../middleware/audit";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { computeMatchScore } from "../services/matching.service";
import { notifyUser } from "../services/notification.service";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const jobRouter = Router();

jobRouter.get(
  "/",
  validateQuery(jobSearchSchema),
  asyncHandler(async (request, response) => {
    const query = request.query as Record<string, string | number | undefined>;
    const where = {
      status: JobStatus.ACTIVE,
      city: query.city ? { contains: String(query.city), mode: "insensitive" as const } : undefined,
      category: query.category ? { equals: String(query.category), mode: "insensitive" as const } : undefined,
      employmentType: query.employmentType ? { equals: String(query.employmentType), mode: "insensitive" as const } : undefined,
      minSalary: query.maxSalary ? { lte: Number(query.maxSalary) } : undefined,
      maxSalary: query.minSalary ? { gte: Number(query.minSalary) } : undefined,
      minExperience: query.maxExperience ? { lte: Number(query.maxExperience) } : undefined,
      maxExperience: query.minExperience ? { gte: Number(query.minExperience) } : undefined,
      OR: query.q
        ? [
            { title: { contains: String(query.q), mode: "insensitive" as const } },
            { description: { contains: String(query.q), mode: "insensitive" as const } },
            { company: { name: { contains: String(query.q), mode: "insensitive" as const } } },
          ]
        : undefined,
      skills: query.skills ? { some: { skill: { name: { in: String(query.skills).split(",") } } } } : undefined,
    };
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const [items, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        include: { company: true, skills: { include: { skill: true } } },
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);
    response.json({ items, total, page, limit });
  })
);

jobRouter.post(
  "/",
  authenticate,
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  validateBody(jobCreateSchema),
  audit("job.create", "Job"),
  asyncHandler(async (request, response) => {
    const input = request.body;
    const slug = `${input.title}-${input.city}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const job = await prisma.job.create({
      data: {
        ...input,
        slug,
        status: request.auth?.role === UserRole.ADMIN ? JobStatus.ACTIVE : JobStatus.PENDING_APPROVAL,
        publishedAt: request.auth?.role === UserRole.ADMIN ? new Date() : null,
        skills: {
          create: input.skills.map((name: string) => ({
            skill: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: { company: true, skills: { include: { skill: true } } },
    });
    response.status(201).json({ job });
  })
);

jobRouter.get(
  "/recommendations",
  authenticate,
  authorize(UserRole.CANDIDATE),
  asyncHandler(async (request, response) => {
    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: request.auth!.userId },
      include: { skills: { include: { skill: true } } },
    });
    const jobs = await prisma.job.findMany({ where: { status: JobStatus.ACTIVE }, include: { skills: { include: { skill: true } } }, take: 50 });
    const items = jobs
      .map(job => ({
        job,
        score: computeMatchScore({
          candidateSkills: candidate?.skills.map(item => item.skill.name) ?? [],
          jobSkills: job.skills.map(item => item.skill.name),
          candidateCity: candidate?.preferredCity || candidate?.currentCity,
          jobCity: job.city,
          expectedSalary: candidate?.expectedSalary,
          maxSalary: job.maxSalary,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    response.json({ items });
  })
);

jobRouter.post(
  "/:id/apply",
  authenticate,
  authorize(UserRole.CANDIDATE),
  validateBody(applicationCreateSchema.omit({ jobId: true })),
  audit("job.apply", "Application"),
  asyncHandler(async (request, response) => {
    const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId: getParam(request, "id"),
        resumeId: request.body.resumeId,
        coverLetter: request.body.coverLetter,
      },
      include: { job: { include: { company: true } } },
    });
    await notifyUser({
      userId: request.auth!.userId,
      email: request.auth!.email,
      subject: "Application submitted",
      body: `Your application for ${application.job.title} was submitted.`,
    });
    response.status(201).json({ application });
  })
);

jobRouter.patch("/:id", authenticate, authorize(UserRole.EMPLOYER, UserRole.ADMIN), validateBody(jobCreateSchema.partial()), audit("job.update", "Job"), asyncHandler(async (request, response) => {
  const job = await prisma.job.update({ where: { id: getParam(request, "id") }, data: request.body });
  response.json({ job });
}));

jobRouter.delete("/:id", authenticate, authorize(UserRole.EMPLOYER, UserRole.ADMIN), audit("job.delete", "Job"), asyncHandler(async (request, response) => {
  await prisma.job.update({ where: { id: getParam(request, "id") }, data: { status: JobStatus.CLOSED } });
  response.json({ ok: true });
}));
