import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Job Agent",
  description: "Sign in to your Job Agent account to manage your automated job applications and accelerate your job search.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
