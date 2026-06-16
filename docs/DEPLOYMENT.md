# Deployment

## Local

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

## Production Checklist

- Use managed PostgreSQL with backups and point-in-time recovery.
- Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Configure Google OAuth callback. For local development, add `http://localhost:3000/api/v1/auth/google/callback` to Google Cloud OAuth redirect URIs.
- Configure Resend sender domain.
- Configure Cloudinary upload presets and folder policies.
- Configure Razorpay webhooks and signature verification.
- Put API behind HTTPS and a WAF/CDN.
- Enable database migration deploy in CI/CD before app rollout.
- Add observability: logs, traces, uptime, error alerts.
