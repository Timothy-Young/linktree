"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateUsername } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const normalized = username.trim().toLowerCase();

      // Pre-check uniqueness so we can surface a nice error before signup.
      const { data: existing } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", normalized)
        .maybeSingle();

      if (existing) {
        setError("That username is already taken.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: normalized },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // If email confirmations are enabled, no session is returned.
      if (!data.session) {
        router.push(
          `/login?message=${encodeURIComponent(
            "Check your email to confirm your account, then sign in.",
          )}`,
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center rounded-md border border-zinc-300 bg-white focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-zinc-100">
          <span className="select-none pl-3 text-sm text-zinc-400">
            linktree.clone/
          </span>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
            className="h-10 flex-1 rounded-r-md border-0 bg-transparent px-2 text-sm outline-none placeholder:text-zinc-400"
            placeholder="yourname"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          At least 6 characters.
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
