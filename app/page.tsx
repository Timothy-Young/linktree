import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            linktree<span className="text-emerald-500">.clone</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/admin">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Sign up free
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          The only link you&apos;ll ever need to share.
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-zinc-600 dark:text-zinc-400">
          Build a beautiful page to host every link, social profile, and
          piece of content you publish — then share it with one tidy URL.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link href={user ? "/admin" : "/signup"}>
            <Button size="lg">
              {user ? "Open your dashboard" : "Claim your username"}
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline">
              See an example
            </Button>
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {[
            {
              title: "Customize",
              body: "Theme your page with colors that match your brand.",
            },
            {
              title: "Measure",
              body: "Track clicks on every link to learn what works.",
            },
            {
              title: "Share",
              body: "One short URL takes followers everywhere you publish.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Built with Next.js, Supabase, and Tailwind.
      </footer>
    </div>
  );
}
