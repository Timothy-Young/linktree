"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Check } from "lucide-react";
import type { Profile } from "@/types/database.types";

type ThemeKey =
  | "theme_bg_color"
  | "theme_text_color"
  | "theme_btn_color"
  | "theme_btn_text_color";

const themeFields: { key: ThemeKey; label: string }[] = [
  { key: "theme_bg_color", label: "Background" },
  { key: "theme_text_color", label: "Text" },
  { key: "theme_btn_color", label: "Button" },
  { key: "theme_btn_text_color", label: "Button text" },
];

const presets: Array<Pick<Profile, ThemeKey> & { name: string }> = [
  {
    name: "Snow",
    theme_bg_color: "#ffffff",
    theme_text_color: "#0a0a0a",
    theme_btn_color: "#f3f4f6",
    theme_btn_text_color: "#0a0a0a",
  },
  {
    name: "Midnight",
    theme_bg_color: "#0a0a0a",
    theme_text_color: "#fafafa",
    theme_btn_color: "#1f1f1f",
    theme_btn_text_color: "#fafafa",
  },
  {
    name: "Mint",
    theme_bg_color: "#ecfdf5",
    theme_text_color: "#064e3b",
    theme_btn_color: "#10b981",
    theme_btn_text_color: "#ffffff",
  },
  {
    name: "Sunset",
    theme_bg_color: "#fef3c7",
    theme_text_color: "#7c2d12",
    theme_btn_color: "#f97316",
    theme_btn_text_color: "#ffffff",
  },
  {
    name: "Ocean",
    theme_bg_color: "#0c4a6e",
    theme_text_color: "#e0f2fe",
    theme_btn_color: "#38bdf8",
    theme_btn_text_color: "#082f49",
  },
  {
    name: "Rose",
    theme_bg_color: "#fdf2f8",
    theme_text_color: "#831843",
    theme_btn_color: "#ec4899",
    theme_btn_text_color: "#ffffff",
  },
];

export function ProfileEditor({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Profile>(profile);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSaving, startSave] = useTransition();

  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const applyPreset = (p: (typeof presets)[number]) => {
    setDraft((d) => ({
      ...d,
      theme_bg_color: p.theme_bg_color,
      theme_text_color: p.theme_text_color,
      theme_btn_color: p.theme_btn_color,
      theme_btn_text_color: p.theme_btn_text_color,
    }));
    setSaved(false);
  };

  const onAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setField("avatar_url", data.publicUrl);
    setUploading(false);
  };

  const onSave = () => {
    setError(null);
    startSave(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: draft.full_name,
          bio: draft.bio,
          avatar_url: draft.avatar_url,
          theme_bg_color: draft.theme_bg_color,
          theme_text_color: draft.theme_text_color,
          theme_btn_color: draft.theme_btn_color,
          theme_btn_text_color: draft.theme_btn_text_color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) {
        setError(error.message);
        return;
      }
      setSaved(true);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {draft.avatar_url ? (
                  <Image
                    src={draft.avatar_url}
                    alt="Avatar"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-2xl font-medium text-zinc-400">
                    {(draft.full_name ?? draft.username)
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  type="button"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload avatar"}
                </Button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  PNG or JPG, max ~2MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={profile.username} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Display name</Label>
                <Input
                  id="full_name"
                  value={draft.full_name ?? ""}
                  onChange={(e) => setField("full_name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="Tell visitors a bit about yourself."
                value={draft.bio ?? ""}
                onChange={(e) => setField("bio", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Presets</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-md border border-zinc-200 p-2 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800"
                    style={{ background: p.theme_bg_color }}
                  >
                    <div
                      className="h-2 w-full rounded"
                      style={{ background: p.theme_btn_color }}
                    />
                    <div
                      className="mt-1.5 text-[10px] font-medium"
                      style={{ color: p.theme_text_color }}
                    >
                      {p.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {themeFields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id={f.key}
                      value={draft[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-zinc-300 bg-transparent dark:border-zinc-700"
                    />
                    <Input
                      value={draft[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {error}
            </span>
          )}
        </div>
      </div>

      <Preview profile={draft} />
    </div>
  );
}

function Preview({ profile }: { profile: Profile }) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Preview
      </p>
      <div
        className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800"
        style={{
          background: profile.theme_bg_color,
          color: profile.theme_text_color,
        }}
      >
        <div className="flex flex-col items-center px-6 py-10">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full"
            style={{ background: profile.theme_btn_color }}
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span
                className="text-2xl font-medium"
                style={{ color: profile.theme_btn_text_color }}
              >
                {(profile.full_name ?? profile.username)
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}
          </div>
          <p className="mt-3 text-base font-semibold">
            {profile.full_name || `@${profile.username}`}
          </p>
          {profile.bio && (
            <p className="mt-1 text-center text-sm opacity-80">
              {profile.bio}
            </p>
          )}
          <div className="mt-6 w-full space-y-2">
            {["Sample link", "Another link", "Third link"].map((t) => (
              <div
                key={t}
                className="w-full rounded-lg px-4 py-3 text-center text-sm font-medium"
                style={{
                  background: profile.theme_btn_color,
                  color: profile.theme_btn_text_color,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
