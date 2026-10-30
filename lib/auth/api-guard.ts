import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";

export class AuthError extends Error {}

/**
 * Admin gate for API routes. Returns the session, or a ready-to-return 401/403.
 * Every admin mutation in the app goes through this — there is no client-side
 * check that can be bypassed by crafting a request.
 */
export async function adminGuard(): Promise<
  { ok: true; session: SessionPayload } | { ok: false; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "admin") {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, session };
}
