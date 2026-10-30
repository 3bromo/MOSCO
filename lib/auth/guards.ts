import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Customer, PublicCustomer } from "@/lib/db/types";
import { getSession } from "./session";

export function stripPassword(c: Customer): PublicCustomer {
  const { password_hash: _ignored, ...rest } = c;
  void _ignored;
  return rest;
}

/** Current logged-in customer, or null. Never returns the password hash. */
export async function currentCustomer(): Promise<PublicCustomer | null> {
  const session = await getSession();
  if (!session) return null;
  const c = await db().getCustomerById(session.sub);
  return c ? stripPassword(c) : null;
}

export async function requireCustomer(redirectTo = "/account/login"): Promise<PublicCustomer> {
  const c = await currentCustomer();
  if (!c) redirect(redirectTo);
  return c;
}

export async function requireAdmin(): Promise<PublicCustomer> {
  const c = await currentCustomer();
  if (!c || c.role !== "admin") redirect("/admin/login");
  return c;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}
