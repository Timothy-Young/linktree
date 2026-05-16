import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "signup",
  "logout",
  "signout",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "_next",
  "public",
  "static",
  "go",
  "settings",
  "dashboard",
  "profile",
  "analytics",
]);

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function validateUsername(username: string): string | null {
  const u = username.trim().toLowerCase();
  if (!u) return "Username is required.";
  if (!USERNAME_REGEX.test(u))
    return "Use 3-30 lowercase letters, numbers, or underscores.";
  if (RESERVED_USERNAMES.has(u)) return "That username is reserved.";
  return null;
}

export function normalizeUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(normalizeUrl(url));
    return true;
  } catch {
    return false;
  }
}
