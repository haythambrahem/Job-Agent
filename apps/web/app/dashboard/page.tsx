import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import DashboardClient from "@/components/DashboardClient";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const token = await getToken({
    req: {
      headers: {
        cookie: (await cookies()).toString()
      }
    } as unknown as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
    raw: true
  });

  return (
    <DashboardClient
      user={{ id: session.user.id, email: session.user.email, plan: session.user.plan }}
      accessToken={token || null}
    />
  );
}
