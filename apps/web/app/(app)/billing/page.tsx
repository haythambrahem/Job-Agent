import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/DashboardClient";
import { authOptions } from "@/lib/auth";
import { createApiToken } from "@/lib/apiToken";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const apiToken = await createApiToken({
    id: session.user.id,
    email: session.user.email,
    plan: session.user.plan
  });

  return (
    <DashboardClient
      user={{ id: session.user.id, email: session.user.email, plan: session.user.plan }}
      apiToken={apiToken}
      initialPage="billing"
    />
  );
}
