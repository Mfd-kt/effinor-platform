"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { ensureProfileGeocoded } from "@/features/technical-visits/lib/ensure-profile-geocoded";
import { getProfileLocationQuality } from "@/features/technical-visits/lib/location-validation";

const profileSchema = z.object({
  fullName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country: z.string().max(120).optional().nullable(),
});

export type UpdateMyProfileResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function updateMyProfile(formData: FormData): Promise<UpdateMyProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Session expirée." };
  }

  const parsed = profileSchema.safeParse({
    fullName: (() => {
      const v = String(formData.get("fullName") ?? "").trim();
      return v === "" ? null : v;
    })(),
    phone: (() => {
      const v = String(formData.get("phone") ?? "").trim();
      return v === "" ? null : v;
    })(),
    jobTitle: (() => {
      const v = String(formData.get("jobTitle") ?? "").trim();
      return v === "" ? null : v;
    })(),
    addressLine1: (() => {
      const v = String(formData.get("addressLine1") ?? "").trim();
      return v === "" ? null : v;
    })(),
    postalCode: (() => {
      const v = String(formData.get("postalCode") ?? "").trim();
      return v === "" ? null : v;
    })(),
    city: (() => {
      const v = String(formData.get("city") ?? "").trim();
      return v === "" ? null : v;
    })(),
    country: (() => {
      const v = String(formData.get("country") ?? "").trim();
      return v === "" ? null : v;
    })(),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      job_title: parsed.data.jobTitle,
      address_line_1: parsed.data.addressLine1 ?? null,
      postal_code: parsed.data.postalCode ?? null,
      city: parsed.data.city ?? null,
      country: parsed.data.country ?? null,
      latitude: null,
      longitude: null,
      geocoding_status: "complete_not_geocoded",
      geocoding_provider: null,
      geocoding_error: null,
      geocoding_updated_at: null,
      geocoding_attempts: 0,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const geocoded = await ensureProfileGeocoded(supabase, user.id);
  const quality = getProfileLocationQuality({
    address_line_1: parsed.data.addressLine1 ?? null,
    postal_code: parsed.data.postalCode ?? null,
    city: parsed.data.city ?? null,
    country: parsed.data.country ?? null,
    latitude: geocoded.lat,
    longitude: geocoded.lng,
    geocoding_status: geocoded.geocoding_status,
  });

  revalidatePath("/account");
  revalidatePath("/technical-visits");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      quality === "complete_geocoded"
        ? "Profil enregistré."
        : "Profil enregistré (adresse non géolocalisée ou incomplète).",
  };
}
