/** Taille max alignée sur les buckets Storage (20 Mo). */
export const MAX_REFERENCE_PDF_BYTES = 20 * 1024 * 1024;

export function sanitizeReferencePdfFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
  return base || "document.pdf";
}

export function validateReferencePdfFile(file: File): string | null {
  const looksPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksPdf) {
    return "Seuls les fichiers PDF sont acceptés.";
  }
  if (file.size > MAX_REFERENCE_PDF_BYTES) {
    return "Le fichier dépasse 20 Mo.";
  }
  return null;
}
