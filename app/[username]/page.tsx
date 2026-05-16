import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicProfile } from "@/components/public/PublicProfile";
import { RESERVED_USERNAMES } from "@/lib/utils";
import type { Link as DbLink, Profile } from "@/types/database.types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  if (RESERVED_USERNAMES.has(username.toLowerCase())) return {};

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, avatar_url")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) return { title: "Not found" };

  const title = profile.full_name ?? `@${profile.username}`;
  return {
    title,
    description: profile.bio ?? `Links from ${title}`,
    openGraph: {
      title,
      description: profile.bio ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const lower = username.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", lower)
    .maybeSingle();

  if (!profile) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <PublicProfile
      profile={profile as Profile}
      links={(links ?? []) as DbLink[]}
    />
  );
}
