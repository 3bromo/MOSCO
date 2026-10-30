import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_KEY, SUPABASE_URL, isSupabaseEnabled } from "./env";

let cached: SupabaseClient | null = null;

/**
 * Server-only admin client. Uses the service-role key, so it must never be
 * imported from a client component. All writes funnel through here, which is
 * why Row Level Security can stay strict (deny-by-default) for anon users.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!isSupabaseEnabled()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  cached ??= createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "mosco-web" } },
  });
  return cached;
}
