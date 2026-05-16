import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/admin/ProfileEditor";
import type { Profile } from "@/types/database.types";

export const metadata = { title: "Profile · Admin" };

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Customize the public appearance of your link page.
        </p>
      </div>
      <ProfileEditor profile={profile as Profile} />
    </div>
  );
}
