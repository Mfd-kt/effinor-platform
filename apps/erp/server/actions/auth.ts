"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { IMPERSONATION_COOKIE_NAME } from "@/lib/auth/impersonation/constants";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE_NAME);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
