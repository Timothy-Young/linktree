"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Link as DbLink } from "@/types/database.types";
import { isValidUrl, normalizeUrl } from "@/lib/utils";

export function LinkManager({ initialLinks }: { initialLinks: DbLink[] }) {
  const supabase = createClient();
  const [links, setLinks] = useState<DbLink[]>(initialLinks);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, startAdd] = useTransition();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!isValidUrl(url)) {
      setError("Enter a valid URL.");
      return;
    }

    startAdd(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const sort_order =
        links.length > 0
          ? Math.max(...links.map((l) => l.sort_order)) + 1
          : 0;

      const { data, error } = await supabase
        .from("links")
        .insert({
          user_id: user.id,
          title: title.trim(),
          url: normalizeUrl(url),
          sort_order,
        })
        .select()
        .single();

      if (error || !data) {
        setError(error?.message ?? "Could not add link.");
        return;
      }

      setLinks((prev) => [...prev, data as DbLink]);
      setTitle("");
      setUrl("");
    });
  };

  const updateLink = async (id: string, patch: Partial<DbLink>) => {
    const prev = links;
    setLinks((curr) =>
      curr.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) {
      setLinks(prev);
      setError(error.message);
    }
  };

  const deleteLink = async (id: string) => {
    const prev = links;
    setLinks((curr) => curr.filter((l) => l.id !== id));
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) {
      setLinks(prev);
      setError(error.message);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = links.findIndex((l) => l.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= links.length) return;

    const a = links[idx];
    const b = links[swapIdx];
    const next = [...links];
    next[idx] = { ...a, sort_order: b.sort_order };
    next[swapIdx] = { ...b, sort_order: a.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    const prev = links;
    setLinks(next);

    const [r1, r2] = await Promise.all([
      supabase.from("links").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("links").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) {
      setLinks(prev);
      setError(r1.error?.message ?? r2.error?.message ?? "Reorder failed.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="My website"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isAdding} className="w-full sm:w-auto">
                  {isAdding ? "Adding..." : "Add link"}
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {links.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No links yet. Add your first one above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {links.map((link, i) => (
            <LinkRow
              key={link.id}
              link={link}
              isFirst={i === 0}
              isLast={i === links.length - 1}
              onUpdate={updateLink}
              onDelete={deleteLink}
              onMove={move}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkRow({
  link,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMove,
}: {
  link: DbLink;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (id: string, patch: Partial<DbLink>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove: (id: string, dir: -1 | 1) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);

  return (
    <li>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onMove(link.id, -1)}
              disabled={isFirst}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(link.id, 1)}
              disabled={isLast}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                />
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="URL"
                />
              </div>
            ) : (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{link.title}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 truncate text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={link.is_active}
              onCheckedChange={(v) => onUpdate(link.id, { is_active: v })}
              ariaLabel="Active"
            />
            {editing ? (
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => {
                    if (!title.trim() || !isValidUrl(url)) return;
                    onUpdate(link.id, {
                      title: title.trim(),
                      url: normalizeUrl(url),
                    });
                    setEditing(false);
                  }}
                  aria-label="Save"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setTitle(link.title);
                    setUrl(link.url);
                    setEditing(false);
                  }}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditing(true)}
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`Delete "${link.title}"?`)) onDelete(link.id);
              }}
              aria-label="Delete"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
