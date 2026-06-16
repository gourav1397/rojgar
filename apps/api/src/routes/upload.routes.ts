import os from "node:os";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { prisma, UserRole } from "@rogjar/database";
import { audit } from "../middleware/audit";
import { authenticate, authorize } from "../middleware/auth";
import { uploadToCloudinary } from "../services/storage.service";
import { asyncHandler } from "../utils/async-handler";

const upload = multer({
  dest: path.join(os.tmpdir(), "rogjar-uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadRouter = Router();
uploadRouter.use(authenticate);

uploadRouter.post(
  "/resume",
  authorize(UserRole.CANDIDATE),
  upload.single("resume"),
  audit("upload.resume", "Resume"),
  asyncHandler(async (request, response) => {
    if (!request.file) return response.status(400).json({ error: "Resume file is required" });
    const candidate = await prisma.candidateProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
    const result = await uploadToCloudinary(request.file.path, "rogjar/resumes");
    const resume = await prisma.resume.create({
      data: {
        candidateId: candidate.id,
        title: request.body.title || request.file.originalname,
        fileUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        isPrimary: request.body.isPrimary === "true",
      },
    });
    response.status(201).json({ resume });
  })
);

uploadRouter.post(
  "/company-logo",
  authorize(UserRole.EMPLOYER, UserRole.ADMIN),
  upload.single("logo"),
  audit("upload.company-logo", "Company"),
  asyncHandler(async (request, response) => {
    if (!request.file) return response.status(400).json({ error: "Logo file is required" });
    const employer = await prisma.employerProfile.findUniqueOrThrow({ where: { userId: request.auth!.userId } });
    const result = await uploadToCloudinary(request.file.path, "rogjar/company-logos");
    const company = await prisma.company.update({
      where: { id: employer.companyId },
      data: { logoUrl: result.secure_url, cloudinaryPublicId: result.public_id },
    });
    response.json({ company });
  })
);
