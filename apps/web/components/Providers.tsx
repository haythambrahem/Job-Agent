"use client";

import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/components/QueryProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
