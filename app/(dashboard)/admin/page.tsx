import { createClient } from "@/lib/supabase/server";
import { LinkManager } from "@/components/admin/LinkManager";
import type { Link as DbLink } from "@/types/database.types";

export const metadata = { title: "Links · Admin" };

export default async function AdminLinksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", user!.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your links</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add, reorder, and toggle the links that appear on your public page.
        </p>
      </div>
      <LinkManager initialLinks={(links ?? []) as DbLink[]} />
    </div>
  );
}
