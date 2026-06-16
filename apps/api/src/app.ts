import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import csrf from "csurf";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import passport from "passport";
import xss from "xss";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { adminRouter } from "./routes/admin.routes";
import { applicationRouter } from "./routes/application.routes";
import { authRouter } from "./routes/auth.routes";
import { candidateRouter } from "./routes/candidate.routes";
import { chatRouter } from "./routes/chat.routes";
import { employerRouter } from "./routes/employer.routes";
import { jobRouter } from "./routes/job.routes";
import { notificationRouter } from "./routes/notification.routes";
import { paymentRouter } from "./routes/payment.routes";
import { uploadRouter } from "./routes/upload.routes";
import "./strategies/google";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production" } });
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.NODE_ENV === "test" ? 1000 : 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use((request, _response, next) => {
    if (request.body && typeof request.body === "object") {
      request.body = JSON.parse(JSON.stringify(request.body), (_key, value) =>
        typeof value === "string" ? xss(value) : value
      );
    }
    next();
  });

  app.get("/health", (_request, response) => response.json({ ok: true, service: "rogjar-api" }));
  app.get("/api/v1/csrf-token", csrfProtection, (request, response) => response.json({ csrfToken: request.csrfToken() }));
  app.use((request, response, next) => {
    const skipCsrf =
      request.method === "GET" ||
      request.path.startsWith("/api/v1/auth/google") ||
      request.path === "/api/v1/payments/webhook";
    if (skipCsrf) return next();
    return csrfProtection(request, response, next);
  });
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/jobs", jobRouter);
  app.use("/api/v1/applications", applicationRouter);
  app.use("/api/v1/candidate", candidateRouter);
  app.use("/api/v1/employer", employerRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/uploads", uploadRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/payments", paymentRouter);
  app.use(errorHandler);

  return app;
}
