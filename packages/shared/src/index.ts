import { z } from "zod";

export const emailSchema = z.string().email().toLowerCase();
export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Use at least one uppercase letter")
  .regex(/[a-z]/, "Use at least one lowercase letter")
  .regex(/[0-9]/, "Use at least one number");

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().min(8).max(20).optional(),
  password: passwordSchema,
  role: z.enum(["ADMIN", "EMPLOYER", "CANDIDATE"]).default("CANDIDATE"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(24),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().min(4).max(12),
});

export const jobCreateSchema = z.object({
  companyId: z.string().cuid(),
  title: z.string().min(3).max(160),
  description: z.string().min(30),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  city: z.string().min(2).max(80),
  location: z.string().max(160).optional(),
  minSalary: z.coerce.number().int().positive().optional(),
  maxSalary: z.coerce.number().int().positive().optional(),
  minExperience: z.coerce.number().int().min(0).default(0),
  maxExperience: z.coerce.number().int().min(0).optional(),
  employmentType: z.string().min(2).max(60),
  category: z.string().min(2).max(80),
  skills: z.array(z.string().min(1).max(60)).default([]),
});

export const jobSearchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  skills: z.string().optional(),
  minSalary: z.coerce.number().int().optional(),
  maxSalary: z.coerce.number().int().optional(),
  minExperience: z.coerce.number().int().optional(),
  maxExperience: z.coerce.number().int().optional(),
  category: z.string().optional(),
  employmentType: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const applicationCreateSchema = z.object({
  jobId: z.string().cuid(),
  resumeId: z.string().cuid().optional(),
  coverLetter: z.string().max(5000).optional(),
});

export const interviewSchema = z.object({
  applicationId: z.string().cuid(),
  jobId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  mode: z.enum(["PHONE", "VIDEO", "IN_PERSON"]),
  meetingUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export const paymentOrderSchema = z.object({
  jobId: z.string().cuid().optional(),
  planId: z.string().cuid().optional(),
  purpose: z.enum(["FEATURED_JOB", "PREMIUM_LISTING", "SUBSCRIPTION"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
