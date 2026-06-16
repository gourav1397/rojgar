# Rogjar API

Base path: `/api/v1`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `GET /auth/google`
- `GET /auth/google?mode=register`
- `GET /auth/google/callback`

## Jobs

- `GET /jobs`
- `POST /jobs`
- `PATCH /jobs/:id`
- `DELETE /jobs/:id`
- `GET /jobs/recommendations`
- `POST /jobs/:id/apply`

## Candidate

- `GET /candidate/dashboard`
- `PATCH /candidate/profile`
- `POST /candidate/skills`
- `POST /candidate/education`
- `POST /candidate/experience`
- `POST /candidate/alerts`

## Employer

- `GET /employer/dashboard`
- `PATCH /employer/company`
- `GET /employer/applicants`
- `GET /employer/candidate-search`

## Admin

- `GET /admin/dashboard`
- `GET /admin/users`
- `PATCH /admin/companies/:id/verify`
- `PATCH /admin/jobs/:id/approval`
- `POST /admin/reports`
- `GET /admin/audit-logs`
- `POST /admin/cms`

## Communication, Uploads, Payments

- `POST /uploads/resume`
- `POST /uploads/company-logo`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `POST /chat/threads`
- `GET /chat/threads/:id/messages`
- `POST /chat/threads/:id/messages`
- `POST /payments/orders`
- `POST /payments/webhook`
