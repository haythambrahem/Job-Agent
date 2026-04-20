import { encode } from "next-auth/jwt";

const API_TOKEN_MAX_AGE_SECONDS = 60 * 60;

export async function createApiToken(user: {
  id: string;
  email: string;
  plan: "free" | "pro" | "premium";
}): Promise<string> {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }

  return encode({
    token: {
      sub: user.id,
      email: user.email,
      plan: user.plan
    },
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: API_TOKEN_MAX_AGE_SECONDS
  });
}
