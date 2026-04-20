import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar email={session.user.email} plan={session.user.plan} />
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
