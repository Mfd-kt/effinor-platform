/** V1 : dictées courtes ; aligné produit (~2–5 min à ~128 kbps). */
export const TECHNICAL_VISIT_AUDIO_MAX_BYTES = 10 * 1024 * 1024;

export const TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS = 300;

export const TECHNICAL_VISIT_AUDIO_ALLOWED_MIME_PREFIXES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
] as const;

export function isAllowedTechnicalVisitAudioMime(mime: string): boolean {
  const m = mime.trim().toLowerCase();
  if (!m) return false;
  return TECHNICAL_VISIT_AUDIO_ALLOWED_MIME_PREFIXES.some((p) => m.startsWith(p));
}

export function fileExtensionForAudioMime(mime: string): string {
  const m = mime.trim().toLowerCase();
  if (m.includes("webm")) return ".webm";
  if (m.includes("ogg")) return ".ogg";
  if (m.includes("mp4") || m.includes("m4a")) return ".m4a";
  if (m.includes("mpeg") || m.includes("mp3")) return ".mp3";
  if (m.includes("wav")) return ".wav";
  return ".bin";
}

export function buildTechnicalVisitAudioNoteStoragePath(visitId: string, noteId: string, mime: string): string {
  const ext = fileExtensionForAudioMime(mime);
  return `technical-visits/${visitId}/audio_notes/${noteId}${ext}`;
}
