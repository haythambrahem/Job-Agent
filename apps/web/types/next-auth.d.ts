import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      plan: "free" | "pro" | "premium";
    } & DefaultSession["user"];
  }

  interface User {
    plan?: "free" | "pro" | "premium";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    plan?: "free" | "pro" | "premium";
  }
}
