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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-slate-400 mb-8">Get started with Job Agent for free</p>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email Address
            </label>
            <input 
              id="email"
              type="email" 
              placeholder="you@example.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-white">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400">Minimum 8 characters</p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Already have an account?{" "}
          <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>

        <hr className="my-6 border-slate-700" />

        <p className="text-center text-xs text-slate-400">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
