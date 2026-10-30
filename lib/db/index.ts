import "server-only";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { localPersistenceMode, localRepo } from "./local";
import type { Repo } from "./repo";

let cached: Repo | null = null;

/**
 * Picks the storage adapter once per process.
 *
 * - Supabase credentials present  → Supabase (production path)
 * - otherwise                     → local JSON file store (works out of the box)
 *
 * Both implement the identical `Repo` contract, so every page, API route and
 * admin screen is written once and runs unchanged against either backend.
 */
export function db(): Repo {
  if (cached) return cached;
  if (isSupabaseEnabled()) {
    // Required lazily so @supabase/supabase-js is never pulled in when unused.
    const { supabaseRepo } = require("./supabase-repo") as typeof import("./supabase-repo");
    cached = supabaseRepo;
  } else {
    cached = localRepo;
  }
  return cached;
}

export function dbMode(): "local" | "supabase" {
  return isSupabaseEnabled() ? "supabase" : "local";
}

/**
 * True when data is being held in memory and will be lost on restart, i.e. the
 * local file store is active but the filesystem is read-only (Vercel and other
 * serverless hosts). Used to warn in the admin UI so a deploy without Supabase
 * can never be mistaken for one that is actually saving.
 */
export function isEphemeralStorage(): boolean {
  if (isSupabaseEnabled()) return false;
  return localPersistenceMode() === "memory";
}

export * from "./types";
export { filterProducts, productsInCollection, buildFacets, sizeSort } from "./query";
export type { Repo, OrderQuery } from "./repo";
