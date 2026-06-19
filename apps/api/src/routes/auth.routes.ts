import bcrypt from "bcryptjs";
import { Router } from "express";
import passport from "passport";
import { prisma, UserRole, UserStatus } from "@rogjar/database";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@rogjar/shared";
import { env } from "../config/env";
import { audit } from "../middleware/audit";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { isEmailDeliveryConfigured, sendEmail } from "../services/email.service";
import { asyncHandler } from "../utils/async-handler";
import { hashToken, randomToken, signAccessToken, signRefreshToken } from "../utils/tokens";

export const authRouter = Router();

function setAuthCookies(response: import("express").Response, tokens: { accessToken: string; refreshToken: string }) {
  response.cookie("accessToken", tokens.accessToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production" });
  response.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production" });
}

async function issueTokens(user: { id: string; email: string; role: UserRole }) {
  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

function isGoogleOAuthConfigured() {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);
}

function dashboardPath(role: UserRole) {
  if (role === UserRole.ADMIN) return "/dashboard/admin";
  if (role === UserRole.EMPLOYER) return "/dashboard/employer";
  return "/dashboard/candidate";
}

function googleErrorRedirect(request: import("express").Request) {
  return `${env.WEB_ORIGIN}${request.query.mode === "register" ? "/register" : "/login"}?error=google-config`;
}

function devVerificationPayload(code: string) {
  return env.NODE_ENV === "production" || isEmailDeliveryConfigured() ? {} : { devVerificationCode: code };
}

authRouter.post(
  "/register",
  validateBody(registerSchema),
  audit("auth.register", "User"),
  asyncHandler(async (request, response) => {
    const input = request.body;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, ...(input.phone ? [{ phone: input.phone }] : [])],
      },
      select: { email: true, phone: true },
    });
    if (existingUser) {
      response.status(409).json({
        error: existingUser.email === input.email ? "An account with this email already exists" : "An account with this phone number already exists",
      });
      return;
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const code = randomToken(3).slice(0, 6).toUpperCase();
    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        name: input.name,
        role: input.role,
        passwordHash,
        status: UserStatus.PENDING_EMAIL,
        candidateProfile: input.role === "CANDIDATE" ? { create: { profileScore: 30 } } : undefined,
      },
    });
    await prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        codeHash: hashToken(code),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await sendEmail({ to: user.email, subject: "Verify your Rogjar email", html: `<p>Your code is <b>${code}</b></p>` });
    response.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      message: "Verification email sent",
      ...devVerificationPayload(code),
    });
  })
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  audit("auth.login", "User"),
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({ where: { email: request.body.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(request.body.password, user.passwordHash))) {
      response.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.status === UserStatus.PENDING_EMAIL) {
      response.status(403).json({ error: "Please verify your email before logging in" });
      return;
    }
    const tokens = await issueTokens(user);
    setAuthCookies(response, tokens);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    response.json({ user: { id: user.id, email: user.email, role: user.role }, ...tokens });
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) {
      response.status(404).json({ error: "User not found" });
      return;
    }
    response.json({ user });
  })
);

authRouter.post(
  "/logout",
  authenticate,
  audit("auth.logout", "Session"),
  asyncHandler(async (request, response) => {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) await prisma.session.deleteMany({ where: { refreshToken: hashToken(refreshToken) } });
    response.clearCookie("accessToken");
    response.clearCookie("refreshToken");
    response.json({ ok: true });
  })
);

authRouter.post(
  "/resend-verification",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({ where: { email: request.body.email } });
    if (!user) {
      response.json({ message: "If an account exists, a verification code was sent" });
      return;
    }
    if (user.emailVerifiedAt) {
      response.json({ message: "Email is already verified" });
      return;
    }
    const code = randomToken(3).slice(0, 6).toUpperCase();
    await prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        codeHash: hashToken(code),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    await sendEmail({ to: user.email, subject: "Verify your Rogjar email", html: `<p>Your new code is <b>${code}</b></p>` });
    response.json({ message: "Verification code sent", ...devVerificationPayload(code) });
  })
);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({ where: { email: request.body.email } });
    if (user) {
      const token = randomToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
      });
      await sendEmail({ to: user.email, subject: "Reset your Rogjar password", html: `<p>Use this token: ${token}</p>` });
    }
    response.json({ message: "If an account exists, reset instructions were sent" });
  })
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  audit("auth.reset-password", "User"),
  asyncHandler(async (request, response) => {
    const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(request.body.token) } });
    if (!token || token.usedAt || token.expiresAt < new Date()) {
      response.status(400).json({ error: "Invalid reset token" });
      return;
    }
    await prisma.user.update({ where: { id: token.userId }, data: { passwordHash: await bcrypt.hash(request.body.password, 12) } });
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    response.json({ ok: true });
  })
);

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailSchema),
  audit("auth.verify-email", "User"),
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({ where: { email: request.body.email } });
    if (!user) return response.status(400).json({ error: "Invalid verification code" });
    const record = await prisma.emailVerificationCode.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.codeHash !== hashToken(request.body.code)) return response.status(400).json({ error: "Invalid verification code" });
    await prisma.$transaction([
      prisma.emailVerificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() } }),
    ]);
    response.json({ ok: true });
  })
);

authRouter.get("/google", (request, response, next) => {
  if (!isGoogleOAuthConfigured()) {
    response.redirect(googleErrorRedirect(request));
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(request, response, next);
});
authRouter.get(
  "/google/callback",
  (request, response, next) => {
    if (!isGoogleOAuthConfigured()) {
      response.redirect(googleErrorRedirect(request));
      return;
    }
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: `${env.WEB_ORIGIN}/login?error=google` }),
  asyncHandler(async (request, response) => {
    const user = request.user as { id: string; email: string; role: UserRole };
    const tokens = await issueTokens(user);
    setAuthCookies(response, tokens);
    response.redirect(`${env.WEB_ORIGIN}${dashboardPath(user.role)}`);
  })
);
