import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Job Agent",
  description: "Create your Job Agent account and start automating your job applications today. Free 14-day trial, no credit card required.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
