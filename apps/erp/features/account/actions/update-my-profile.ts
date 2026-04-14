"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(120).optional().nullable(),
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
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil enregistré." };
}
