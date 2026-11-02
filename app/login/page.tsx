
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("registered") === "true") {
      setSuccess("Account created successfully! You can now login.");
    }
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-extrabold text-orange-600">
            Bella<span className="text-gray-900">.</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mt-6">
            Welcome Back!
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to your Bella Restaurant account.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {success && (
            <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 py-3.5 font-bold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-7">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-orange-600 hover:underline"
          >
            Create Account
          </Link>
        </p>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
