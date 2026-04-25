import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Service d'upload vers Supabase Storage bucket marketing-media.
 * Utilisé par les formulaires blog et réalisations.
 *
 * Convention de chemins :
 *   blog/{entityId}/{timestamp}-{filename}
 *   realisations/{entityId}/{timestamp}-{filename}
 *
 * Le client Supabase passé en argument doit être le client browser
 * authentifié (`@/lib/supabase/client`). Les RLS storage policies
 * exigent un utilisateur authentifié avec rôle marketing_manager,
 * admin ou super_admin (cf. migration 20260425190100).
 */

export const MARKETING_MEDIA_BUCKET = "marketing-media"
const MAX_SIZE_MB = 10
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const

export type UploadFolder = "blog" | "realisations"

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string }

/**
 * Valide un fichier avant upload (type MIME + taille).
 * @returns null si OK, message d'erreur sinon.
 */
export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return `Type non supporté (${file.type}). Acceptés : JPG, PNG, WebP, GIF, SVG`
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1)
    return `Fichier trop lourd (${sizeMb} MB). Maximum : ${MAX_SIZE_MB} MB`
  }
  return null
}

/**
 * Normalise un nom de fichier pour Supabase Storage.
 * Retire les accents, espaces et caractères spéciaux. Conserve l'extension.
 */
export function sanitizeFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg"
  const name = filename
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  return `${name || "image"}.${ext}`
}

/**
 * Upload d'une image vers le bucket marketing-media.
 *
 * @param supabase  Client Supabase browser AUTHENTIFIÉ (cf. `@/lib/supabase/client`).
 * @param file      Fichier à uploader.
 * @param folder    'blog' ou 'realisations' (préfixe du chemin storage).
 * @param entityId  ID de l'entité (article ou réalisation). 'new' si pas encore créé.
 */
export async function uploadMarketingMedia(
  supabase: SupabaseClient,
  file: File,
  folder: UploadFolder,
  entityId: string = "new",
): Promise<UploadResult> {
  const validationError = validateImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  const timestamp = Date.now()
  const safeName = sanitizeFilename(file.name)
  const path = `${folder}/${entityId}/${timestamp}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
    })

  if (uploadError) {
    console.error("[uploadMarketingMedia]", uploadError)
    return { ok: false, error: `Erreur upload : ${uploadError.message}` }
  }

  const { data } = supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .getPublicUrl(path)

  return { ok: true, url: data.publicUrl, path }
}

/**
 * Supprime un fichier depuis son path dans marketing-media.
 */
export async function deleteMarketingMedia(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(MARKETING_MEDIA_BUCKET)
    .remove([path])
  if (error) console.error("[deleteMarketingMedia]", path, error)
}
