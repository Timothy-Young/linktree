import Image from "next/image";
import { TrackedLink } from "./TrackedLink";
import type { Link as DbLink, Profile } from "@/types/database.types";

export function PublicProfile({
  profile,
  links,
}: {
  profile: Profile;
  links: DbLink[];
}) {
  return (
    <main
      className="flex min-h-screen flex-col items-center px-5 py-12 sm:py-16"
      style={{
        background: profile.theme_bg_color,
        color: profile.theme_text_color,
      }}
    >
      <div className="flex w-full max-w-md flex-col items-center">
        <div
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-2 ring-black/5"
          style={{ background: profile.theme_btn_color }}
        >
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? profile.username}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
              priority
            />
          ) : (
            <span
              className="text-3xl font-medium"
              style={{ color: profile.theme_btn_text_color }}
            >
              {(profile.full_name ?? profile.username)
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-lg font-semibold">
          {profile.full_name || `@${profile.username}`}
        </h1>
        {profile.full_name && (
          <p className="text-sm opacity-70">@{profile.username}</p>
        )}
        {profile.bio && (
          <p className="mt-3 max-w-sm text-center text-sm leading-relaxed opacity-90">
            {profile.bio}
          </p>
        )}

        <div className="mt-8 w-full space-y-3">
          {links.length === 0 ? (
            <p className="text-center text-sm opacity-60">
              No links yet.
            </p>
          ) : (
            links.map((link) => (
              <TrackedLink
                key={link.id}
                linkId={link.id}
                profileId={profile.id}
                href={link.url}
                title={link.title}
                btnColor={profile.theme_btn_color}
                btnTextColor={profile.theme_btn_text_color}
              />
            ))
          )}
        </div>

        <footer className="mt-12 text-xs opacity-50">
          linkable
        </footer>
      </div>
    </main>
  );
}
