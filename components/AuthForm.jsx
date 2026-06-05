"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode, googleEnabled = false }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Registration failed");
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) throw new Error("Invalid email or password");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pr-shell min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-8 flex justify-center text-2xl font-black tracking-tight">PropReel</Link>
        <div className="pr-section p-6 shadow-2xl">
          <p className="pr-kicker text-[var(--pr-cyan)]">Agent workspace</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">{isRegister ? "Start free with starter credits" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pr-muted)]">
            {isRegister ? "Create your account and start generating listing videos." : "Sign in to manage listings, videos, and credits."}
          </p>

          {googleEnabled && (
            <>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="pr-secondary mt-6 w-full px-4 py-2.5 text-sm font-semibold"
              >
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3 text-xs text-[var(--pr-dim)]">
                <span className="h-px flex-1 bg-[var(--pr-border-soft)]" />
                or
                <span className="h-px flex-1 bg-[var(--pr-border-soft)]" />
              </div>
            </>
          )}

          <form onSubmit={submit} className={googleEnabled ? "space-y-4" : "mt-6 space-y-4"}>
            {isRegister && (
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Name"
                className="pr-input px-4 py-3 text-sm"
              />
            )}
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email"
              className="pr-input px-4 py-3 text-sm"
            />
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              className="pr-input px-4 py-3 text-sm"
            />
            {error && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
            <button disabled={loading} className="pr-primary w-full px-4 py-3">
              {loading ? "Please wait..." : isRegister ? "Create account" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--pr-muted)]">
            {isRegister ? "Already have an account?" : "New to PropReel?"}{" "}
            <Link href={isRegister ? "/auth/login" : "/auth/register"} className="font-semibold text-[var(--pr-cyan)]">
              {isRegister ? "Login" : "Start free"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
