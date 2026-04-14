"use server";

import { revalidatePath } from "next/cache";

import {
  AVATAR_MAX_BYTES,
  AVATARS_BUCKET,
  avatarObjectPath,
  isAllowedAvatarMime,
} from "@/features/account/lib/avatar-storage";
import { createClient } from "@/lib/supabase/server";

export type UploadMyAvatarResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

export async function uploadMyAvatar(formData: FormData): Promise<UploadMyAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Session expirée." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choisissez une image (JPEG, PNG ou WebP)." };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "Image trop volumineuse (max 2 Mo)." };
  }

  if (!isAllowedAvatarMime(file.type)) {
    return { ok: false, error: "Format accepté : JPEG, PNG ou WebP." };
  }

  const path = avatarObjectPath(user.id);
  const { error: upErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: "3600",
  });

  if (upErr) {
    const raw = upErr.message ?? "";
    if (/bucket not found|Bucket not found|No such bucket/i.test(raw)) {
      return {
        ok: false,
        error:
          "Bucket Storage « avatars » absent. Ouvrez l’éditeur SQL Supabase et exécutez le fichier supabase/migrations/20260403150000_storage_bucket_avatars.sql (création du bucket + politiques).",
      };
    }
    return { ok: false, error: raw };
  }

  const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true, publicUrl };
}
