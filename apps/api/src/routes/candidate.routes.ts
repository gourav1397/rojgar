import { Router } from "express";
import { prisma, UserRole } from "@rogjar/database";
import { authenticate, authorize } from "../middleware/auth";
import { audit } from "../middleware/audit";
import { asyncHandler } from "../utils/async-handler";
import { getParam } from "../utils/params";

export const candidateRouter = Router();
candidateRouter.use(authenticate, authorize(UserRole.CANDIDATE, UserRole.ADMIN));

candidateRouter.get("/dashboard", asyncHandler(async (request, response) => {
  const profile = await prisma.candidateProfile.findUniqueOrThrow({
    where: { userId: request.auth!.userId },
    include: {
      user: true,
      resumes: true,
      skills: { include: { skill: true } },
      education: true,
      experiences: true,
      savedJobs: { include: { job: { include: { company: true } } } },
      applications: { include: { job: { include: { company: true } }, interviews: true } },
      jobAlerts: true,
    },
  });
  response.json({ profile });
}));

candidateRouter.patch("/profile", audit("candidate.profile.update", "CandidateProfile"), asyncHandler(async (request, response) => {
  const profile = await prisma.candidateProfile.update({ where: { userId: request.auth!.userId }, data: request.body });
  response.json({ profile });
}));

candidateRouter.post("/skills", audit("candidate.skill.add", "CandidateSkill"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const skill = await prisma.candidateSkill.create({
    data: {
      level: request.body.level ?? 1,
      candidate: { connect: { id: candidate.id } },
      skill: { connectOrCreate: { where: { name: request.body.name }, create: { name: request.body.name } } },
    },
    include: { skill: true },
  });
  response.status(201).json({ skill });
}));

candidateRouter.post("/education", audit("candidate.education.add", "Education"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const education = await prisma.education.create({ data: { ...request.body, candidateId: candidate.id } });
  response.status(201).json({ education });
}));

candidateRouter.post("/experience", audit("candidate.experience.add", "WorkExperience"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const experience = await prisma.workExperience.create({ data: { ...request.body, candidateId: candidate.id } });
  response.status(201).json({ experience });
}));

candidateRouter.post("/alerts", audit("candidate.alert.create", "JobAlert"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const alert = await prisma.jobAlert.create({ data: { ...request.body, candidateId: candidate.id } });
  response.status(201).json({ alert });
}));

candidateRouter.post("/saved-jobs/:jobId", audit("candidate.saved-job.add", "SavedJob"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  const jobId = getParam(request, "jobId");
  const savedJob = await prisma.savedJob.upsert({
    where: { candidateId_jobId: { candidateId: candidate.id, jobId } },
    update: {},
    create: { candidateId: candidate.id, jobId },
    include: { job: { include: { company: true } } },
  });
  response.status(201).json({ savedJob });
}));

candidateRouter.delete("/saved-jobs/:jobId", audit("candidate.saved-job.remove", "SavedJob"), asyncHandler(async (request, response) => {
  const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
  await prisma.savedJob.deleteMany({ where: { candidateId: candidate.id, jobId: getParam(request, "jobId") } });
  response.json({ ok: true });
}));
