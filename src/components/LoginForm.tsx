"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const inputCls =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-midnight outline-none transition placeholder:text-muted/60 focus:border-sky focus:shadow-[0_0_0_3px_rgba(21,202,232,.2)]";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Login failed.");
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="anim-fade-up relative z-10 w-full max-w-sm">
      <div className="glass rounded-3xl border border-white/60 p-8 shadow-[0_24px_60px_rgba(19,27,99,.14)]">
        <Logo />
        <h1 className="mt-7 text-2xl font-bold tracking-tight text-midnight">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sign in to browse and share your prototypes.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-midnight">
              Username
            </label>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-midnight">
              Password
            </label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="anim-fade-in rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-[15px]"
          >
            {loading ? (
              <span className="spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-muted">
        Private hub · NPrep prototypes
      </p>
    </div>
  );
}
