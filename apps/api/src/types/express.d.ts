import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email: string;
    }
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}
