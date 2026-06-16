import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma, UserRole, UserStatus } from "@rogjar/database";
import { env } from "../config/env";

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Google account has no email"));
        const user = await prisma.user.upsert({
          where: { email },
          update: { googleId: profile.id, lastLoginAt: new Date(), status: UserStatus.ACTIVE },
          create: {
            email,
            googleId: profile.id,
            name: profile.displayName || email,
            role: UserRole.CANDIDATE,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            candidateProfile: { create: { profileScore: 30 } },
          },
        });
        done(null, { id: user.id, role: user.role, email: user.email });
      }
    )
  );
}
