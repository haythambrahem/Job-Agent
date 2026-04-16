"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (response?.error) {
      setError("Invalid credentials");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24, background: "white", borderRadius: 12 }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
      <p>
        No account? <Link href="/signup">Create one</Link>
      </p>
    </main>
  );
}
