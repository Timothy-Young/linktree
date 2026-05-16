import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Click, Link as DbLink } from "@/types/database.types";

export const metadata = { title: "Analytics · Admin" };

const DAYS = 30;

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const since = new Date();
  since.setDate(since.getDate() - DAYS);

  const [{ data: links }, { data: clicks }] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("user_id", user!.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("clicks")
      .select("*")
      .eq("profile_id", user!.id)
      .gte("click_timestamp", since.toISOString()),
  ]);

  const allLinks = (links ?? []) as DbLink[];
  const allClicks = (clicks ?? []) as Click[];

  const totalClicks = allClicks.length;
  const linkCount = allLinks.length;
  const activeCount = allLinks.filter((l) => l.is_active).length;

  const countsByLink = new Map<string, number>();
  for (const c of allClicks) {
    if (!c.link_id) continue;
    countsByLink.set(c.link_id, (countsByLink.get(c.link_id) ?? 0) + 1);
  }

  const ranked = allLinks
    .map((l) => ({ ...l, clicks: countsByLink.get(l.id) ?? 0 }))
    .sort((a, b) => b.clicks - a.clicks);

  const max = Math.max(1, ...ranked.map((r) => r.clicks));

  // Bucket clicks per day for the past DAYS days
  const buckets = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i + 1);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const c of allClicks) {
    const key = c.click_timestamp.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const daily = Array.from(buckets.entries());
  const dailyMax = Math.max(1, ...daily.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Click activity over the last {DAYS} days.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total clicks" value={totalClicks} />
        <StatCard label="Active links" value={`${activeCount} / ${linkCount}`} />
        <StatCard
          label="Avg clicks / link"
          value={linkCount > 0 ? (totalClicks / linkCount).toFixed(1) : "0"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily clicks</CardTitle>
        </CardHeader>
        <CardContent>
          {totalClicks === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No clicks recorded yet.
            </p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {daily.map(([date, n]) => (
                <div
                  key={date}
                  className="flex-1 rounded-sm bg-emerald-500/70 transition-colors hover:bg-emerald-500"
                  style={{ height: `${(n / dailyMax) * 100}%` }}
                  title={`${date}: ${n} click${n === 1 ? "" : "s"}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top links</CardTitle>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You haven&apos;t added any links yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {ranked.map((l) => (
                <li key={l.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{l.title}</span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                      {l.clicks}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(l.clicks / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
