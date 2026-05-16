-- Linktree clone schema. Run inside Supabase SQL Editor.

create extension if not exists "uuid-ossp";

-- =========================================================================
-- TABLES
-- =========================================================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  theme_bg_color text default '#ffffff' not null,
  theme_text_color text default '#000000' not null,
  theme_btn_color text default '#f3f4f6' not null,
  theme_btn_text_color text default '#000000' not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint username_length check (char_length(username) >= 3),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create table if not exists public.links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  url text not null,
  is_active boolean default true not null,
  sort_order int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.clicks (
  id uuid default gen_random_uuid() primary key,
  link_id uuid references public.links(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  click_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  referrer text
);

-- =========================================================================
-- INDEXES
-- =========================================================================

create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_sort_idx on public.links(user_id, sort_order);
create index if not exists clicks_link_id_idx on public.clicks(link_id);
create index if not exists clicks_profile_id_idx on public.clicks(profile_id);
create index if not exists clicks_timestamp_idx on public.clicks(profile_id, click_timestamp desc);

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.clicks enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select using (true);
create policy "Users can insert their own profile."
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile."
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Public can view active links." on public.links;
drop policy if exists "Owners can view all of their links." on public.links;
drop policy if exists "Users can manage their own links." on public.links;

create policy "Public can view active links."
  on public.links for select using (is_active = true);
create policy "Owners can view all of their links."
  on public.links for select using (auth.uid() = user_id);
create policy "Users can manage their own links."
  on public.links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Anyone can insert a click." on public.clicks;
drop policy if exists "Users can view clicks for their own profile." on public.clicks;

create policy "Anyone can insert a click."
  on public.clicks for insert with check (true);
create policy "Users can view clicks for their own profile."
  on public.clicks for select using (auth.uid() = profile_id);

-- =========================================================================
-- AUTH HOOK: create profile row on signup
-- Username is supplied via auth.users.raw_user_meta_data.username
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- STORAGE: avatars bucket
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Users can upload their own avatar." on storage.objects;
drop policy if exists "Users can update their own avatar." on storage.objects;
drop policy if exists "Users can delete their own avatar." on storage.objects;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar."
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar."
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar."
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
