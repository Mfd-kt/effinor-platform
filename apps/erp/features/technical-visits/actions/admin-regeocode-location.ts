"use server";

import { revalidatePath } from "next/cache";

import { ensureProfileGeocoded } from "@/features/technical-visits/lib/ensure-profile-geocoded";
import { ensureVisitGeocoded } from "@/features/technical-visits/lib/ensure-visit-geocoded";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";

export async function adminRegeocodeVisit(visitId: string): Promise<{ ok: boolean; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !access.roleCodes.includes("super_admin")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = await createClient();
  await supabase.from("technical_visits").update({ geocoding_status: "complete_not_geocoded" }).eq("id", visitId);
  await ensureVisitGeocoded(supabase, visitId);
  revalidatePath("/technical-visits");
  revalidatePath(`/technical-visits/${visitId}`);
  return { ok: true, message: "Relance géocodage visite effectuée." };
}

export async function adminRegeocodeProfile(profileId: string): Promise<{ ok: boolean; message: string }> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !access.roleCodes.includes("super_admin")) {
    return { ok: false, message: "Accès refusé." };
  }
  const supabase = await createClient();
  await supabase.from("profiles").update({ geocoding_status: "complete_not_geocoded" }).eq("id", profileId);
  await ensureProfileGeocoded(supabase, profileId);
  revalidatePath("/settings/users");
  return { ok: true, message: "Relance géocodage profil effectuée." };
}
