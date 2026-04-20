import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";
import { authOptions } from "@/lib/auth";
import { createApiToken } from "@/lib/apiToken";

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
  const profile = (await res.json()) as ProfileData;

  return <ProfileClient initialProfile={profile} apiToken={apiToken} />;
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  location: string | null;
  plan: string;
  subscriptionStatus: string;
  cvPath: string | null;
  cvOriginalName: string | null;
  cvUploadedAt: string | null;
}
