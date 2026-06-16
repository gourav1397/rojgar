# Rogjar Architecture

Rogjar is now structured as a production marketplace monorepo.

## Applications

- `apps/web`: Next.js 15, TypeScript, Tailwind CSS, ShadCN-ready UI structure.
- `apps/api`: Express API with JWT auth, RBAC, rate limiting, Helmet, validation, upload, payment, notification, and chat modules.
- `packages/database`: Prisma ORM and PostgreSQL schema.
- `packages/shared`: Shared Zod validation and TypeScript contracts.

## Core Domains

- Identity: registration, login, logout, Google OAuth, email verification, password reset, sessions.
- Candidate: profile, skills, education, experience, resumes, applications, saved jobs, alerts, interviews.
- Employer: company profile, job management, applicant pipeline, candidate search, analytics.
- Admin: user management, company verification, job approval, reports, fraud review, CMS, audit logs.
- Marketplace: full-text-oriented search, filters, recommendations, apply flow, resume submission.
- Monetization: Razorpay orders for featured jobs, premium listings, and subscriptions.
- Communication: notifications, email via Resend, SMS/push extension points, Socket.IO chat.

## Security

- JWT access and refresh tokens.
- HTTP-only cookies.
- Role-based access control.
- Rate limiting.
- Helmet headers.
- Zod input validation.
- XSS sanitization.
- Audit logging on sensitive mutations.
- Environment-based secret configuration.

## Database

The Prisma schema uses normalized tables with indexes for:

- role/status user lookups
- job status and publish date
- city/category filters
- salary and experience filters
- featured/premium listings
- applicant pipeline queries
- audit log lookups

For high-scale production full-text search, add PostgreSQL generated `tsvector` columns or move search to Meilisearch/OpenSearch while keeping PostgreSQL as source of truth.
