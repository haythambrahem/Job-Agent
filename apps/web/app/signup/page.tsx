"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Unable to create account");
      setLoading(false);
      return;
    }

    const signinResult = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (signinResult?.error) {
      setError("Account created, but auto sign-in failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24, background: "white", borderRadius: 12 }}>
      <h1>Create account</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
      </form>
      {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
      <p>
        Already have an account? <Link href="/signin">Sign in</Link>
      </p>
    </main>
  );
}
