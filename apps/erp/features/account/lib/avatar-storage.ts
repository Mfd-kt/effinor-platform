export const AVATARS_BUCKET = "avatars";

/** Chemin unique par utilisateur (remplacé à chaque nouvel envoi). */
export function avatarObjectPath(userId: string): string {
  return `${userId}/avatar`;
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function isAllowedAvatarMime(type: string): boolean {
  return ALLOWED.has(type);
}
