"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { notify } from "@/stores/notifications";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    notify.success("Welcome back!", "You're signed in to DMSuite. Let's create something amazing.", "/dashboard");
    router.push(nextPath);
    router.refresh();
  };

  return (
    <>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Sign in to your DMSuite account
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <Link
              href="/auth/reset-password"
              className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-gray-950 shadow-sm hover:bg-primary-400 focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
        >
          Create one
        </Link>
      </p>
    </>
  );
}

