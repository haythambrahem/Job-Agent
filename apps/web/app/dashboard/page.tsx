import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import DashboardClient from "@/components/DashboardClient";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <DashboardClient
      user={{ id: session.user.id, email: session.user.email, plan: session.user.plan }}
    />
  );
}
