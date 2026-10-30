/**
 * Single source of truth for whether Supabase is wired up.
 * NOTE: the service-role key is read on the server only and is never bundled
 * into client code — nothing in this file is imported by a "use client" module.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "mosco-media";

/** Supabase is "on" only when we can reach it with write privileges server-side. */
export function isSupabaseEnabled(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export function isSupabasePublicConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
