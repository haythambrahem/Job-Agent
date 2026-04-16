import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { encode } from "next-auth/jwt";
import DashboardClient from "@/components/DashboardClient";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET");
  }

  const token = await encode({
    token: {
      sub: session.user.id,
      email: session.user.email,
      plan: session.user.plan
    },
    secret,
    maxAge: 60 * 60
  });

  return (
    <DashboardClient
      user={{ id: session.user.id, email: session.user.email, plan: session.user.plan }}
      accessToken={token || null}
    />
  );
}
