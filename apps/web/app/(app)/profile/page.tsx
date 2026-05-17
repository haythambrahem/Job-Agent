import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";
import { authOptions } from "@/lib/auth";
import { createApiToken } from "@/lib/apiToken";
import type { Profile } from "@/hooks/types";

export const metadata = { title: "Profile — JobAgent" };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const apiToken = await createApiToken({
    id: session.user.id,
    email: session.user.email,
    plan: session.user.plan
  });

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${apiToken}` },
    cache: "no-store"
  });

  if (!res.ok) {
    redirect("/signin");
  }
  const profile = (await res.json()) as Profile;

  return <ProfileClient initialProfile={profile} apiToken={apiToken} />;
}
