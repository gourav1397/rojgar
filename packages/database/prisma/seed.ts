import { PrismaClient, UserRole, UserStatus, CompanyStatus, JobStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rogjar.in" },
    update: {},
    create: {
      email: "admin@rogjar.in",
      name: "Rogjar Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: "employer@rogjar.in" },
    update: {},
    create: {
      email: "employer@rogjar.in",
      name: "Demo Employer",
      role: UserRole.EMPLOYER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: "candidate@rogjar.in" },
    update: {},
    create: {
      email: "candidate@rogjar.in",
      name: "Demo Candidate",
      role: UserRole.CANDIDATE,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      passwordHash,
      candidateProfile: {
        create: {
          headline: "Sales and customer support associate",
          currentCity: "Delhi",
          preferredCity: "Delhi",
          totalExperience: 2,
          profileScore: 72,
        },
      },
    },
  });

  const company = await prisma.company.upsert({
    where: { slug: "brightpay-services" },
    update: {},
    create: {
      name: "BrightPay Services",
      slug: "brightpay-services",
      city: "Delhi",
      industry: "Fintech",
      status: CompanyStatus.VERIFIED,
      employers: { create: { userId: employer.id, title: "Hiring Manager" } },
    },
  });

  await prisma.job.upsert({
    where: { slug: "field-sales-executive-delhi" },
    update: {},
    create: {
      companyId: company.id,
      title: "Field Sales Executive",
      slug: "field-sales-executive-delhi",
      description: "Meet local merchants, explain payment products, and close onboarding.",
      city: "Delhi",
      minSalary: 22000,
      maxSalary: 38000,
      minExperience: 1,
      maxExperience: 3,
      employmentType: "Full time",
      category: "Sales",
      status: JobStatus.ACTIVE,
      publishedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "seed.database",
      entity: "System",
      metadata: { candidateId: candidate.id, companyId: company.id },
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
