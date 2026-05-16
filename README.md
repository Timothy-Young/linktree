# Linktree Clone

A self-hostable bio-link app built with **Next.js 16** (App Router, RSC), **Supabase** (Postgres + Auth + Storage), and **Tailwind CSS v4**.

## Features

- Email/password auth with unique usernames (`/[username]` public pages)
- Admin dashboard at `/admin`
  - Add, edit, reorder, toggle, and delete links (optimistic updates)
  - Profile editor with avatar upload to Supabase Storage
  - Color presets + per-element color picker with live preview
- Per-link click tracking via `/api/click`, recorded on click using `fetch(..., { keepalive: true })`
- 30-day analytics dashboard with daily bar chart + per-link rankings
- Row-Level Security: every read/write is scoped to `auth.uid()`
- Public pages cached via ISR (`revalidate = 60`)

## Quickstart

### 1. Create a Supabase project

Grab the **Project URL** and **publishable key** (formerly called the anon key) from the API settings.

### 2. Run the schema

In the Supabase SQL editor, paste and run [`supabase/schema.sql`](./supabase/schema.sql). It creates:

- `profiles`, `links`, `clicks` tables (with indexes)
- RLS policies
- A `handle_new_user()` trigger that auto-creates a profile row on signup
- A public `avatars` storage bucket with per-user write policies

### 3. Configure env vars

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, claim a username, then visit `/<your-username>`.

## Project structure

```
app/
  (auth)/login, signup           # auth pages
  (dashboard)/admin/             # link manager, profile/theme, analytics
  [username]/page.tsx            # public ISR profile page
  api/click/route.ts             # click tracking endpoint
  auth/signout/route.ts          # POST sign-out
components/
  admin/                         # dashboard widgets
  auth/                          # login + signup forms
  public/                        # public page + tracked link
  ui/                            # small primitives (button, input, etc.)
lib/
  supabase/{client,server,middleware}.ts
  utils.ts                       # cn(), URL/username validation
middleware.ts                    # session refresh + /admin guard
types/database.types.ts          # hand-typed Database schema
supabase/schema.sql              # one-shot setup
```

## Deployment

Push to GitHub, import the repo into Vercel, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and deploy. No further config needed.
