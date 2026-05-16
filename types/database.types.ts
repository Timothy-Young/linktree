export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_bg_color: string;
  theme_text_color: string;
  theme_btn_color: string;
  theme_btn_text_color: string;
  updated_at: string;
};

export type Link = {
  id: string;
  user_id: string;
  title: string;
  url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Click = {
  id: string;
  link_id: string | null;
  profile_id: string;
  click_timestamp: string;
  referrer: string | null;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, "id" | "username">> & {
          id: string;
          username: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      links: {
        Row: Link;
        Insert: Partial<Omit<Link, "id" | "user_id" | "title" | "url">> & {
          user_id: string;
          title: string;
          url: string;
        };
        Update: Partial<Link>;
        Relationships: [];
      };
      clicks: {
        Row: Click;
        Insert: Partial<Omit<Click, "id" | "profile_id">> & {
          profile_id: string;
        };
        Update: Partial<Click>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
