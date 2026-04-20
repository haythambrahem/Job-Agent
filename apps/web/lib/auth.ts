import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "./prisma";

function resolvePlan(value: unknown): "free" | "pro" | "premium" {
  if (value === "pro" || value === "premium") {
    return value;
  }
  return "free";
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin"
  },
  providers: [
    CredentialsProvider({
      name: "Email / Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);

        if (!parsed.success) {
          throw new Error("Invalid email or password");
        }

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.password) {
          throw new Error("Invalid email or password");
        }

        const valid = await compare(parsed.data.password, user.password);
        if (!valid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          plan: user.plan
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.plan = resolvePlan(user.plan);
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }

      if (trigger === "update") {
        const update = session as JWT | undefined;
        if (typeof update?.name === "string") {
          token.name = update.name;
        }
        if (typeof update?.image === "string") {
          token.picture = update.image;
        }
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.email = dbUser.email;
          token.name = dbUser.name ?? token.name;
          token.picture = dbUser.image ?? token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = token.email || "";
        session.user.plan = (token.plan as "free" | "pro" | "premium") || "free";
        session.user.name = token.name ?? null;
        session.user.image = typeof token.picture === "string" ? token.picture : null;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
