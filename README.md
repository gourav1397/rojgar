# Rogjar Marketplace

Rogjar is a production-ready job marketplace scaffold inspired by large job platforms such as Naukri, Indeed, and Apna. It supports candidates, employers, and admins with authentication, dashboards, job search, applications, interviews, payments, notifications, file uploads, SEO, and audit logging.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- ShadCN-ready component structure
- Express API
- Prisma ORM
- PostgreSQL
- Cloudinary integration
- Resend email
- Razorpay payments
- Docker
- GitHub Actions CI

## Project Structure

```text
apps/web              Next.js frontend
apps/api              Express backend
packages/database     Prisma schema/client
packages/shared       Shared validation schemas
docs                  Architecture, API, deployment docs
```

The original prototype files (`index.html`, `styles.css`, `script.js`, `server.js`, `data/`) are kept for reference, but the production app lives in the monorepo structure above.

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Web: `http://localhost:3000`

API: `http://localhost:4000`

## Docker

```bash
cp .env.example .env
pnpm docker:up
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
