import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Agent SaaS",
  description: "Multi-tenant job automation SaaS"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
